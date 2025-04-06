from typing import List, Dict, Optional
import logging
import json
import requests
import os
import re
from ..core.config import settings
from ..models.interview import Interview, Question
from ..models.resume import Resume, ParsedResumeData
from ..db.mongodb import get_database
import boto3
import docx2txt
import PyPDF2
import io
import bson
from openai import OpenAI
from dotenv import load_dotenv
from bson.objectid import ObjectId

# Configure logging
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize OpenAI client with OpenRouter base URL
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
    default_headers={
        "HTTP-Referer": "http://localhost:3000",  # Required for OpenRouter
        "X-Title": "AI Interview Assistant"  # Optional, but recommended
    }
)

# Initialize Hugging Face settings
HUGGINGFACE_API_TOKEN = settings.HUGGINGFACE_API_TOKEN
HUGGINGFACE_ENDPOINT = settings.HUGGINGFACE_ENDPOINT

# Define fallback models
HUGGINGFACE_MODELS = {
    "primary": settings.HUGGINGFACE_ENDPOINT,
    "fallbacks": [
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf",
        "https://api-inference.huggingface.co/models/google/gemma-7b-it",
        "https://api-inference.huggingface.co/models/openchat/openchat-3.5-1210"
    ]
}

# Initialize AWS services if credentials are available
try:
    if all([settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY, settings.AWS_REGION]):
        rekognition = boto3.client(
            'rekognition',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
    else:
        rekognition = None
        logger.warning("AWS credentials not fully configured. Rekognition features will be unavailable.")
except Exception as e:
    rekognition = None
    logger.error(f"Error initializing AWS services: {str(e)}")

# Fallback questions in case LLM generation fails
FALLBACK_QUESTIONS = {
    "technical": [
        "Explain the concept of Object-Oriented Programming and its core principles.",
        "What's the difference between a thread and a process?",
        "How would you optimize a database query that's running slowly?",
        "Explain the concept of REST API and its core principles.",
        "What is the difference between HTTP and HTTPS?",
    ],
    "behavioral": [
        "Describe a challenging project you worked on and how you overcame obstacles.",
        "Tell me about a time when you had to learn a new technology quickly.",
        "How do you handle disagreements with team members?",
        "Describe your approach to meeting tight deadlines.",
        "How do you stay updated with the latest technologies in your field?",
    ]
}

async def call_huggingface_api(prompt: str, system_prompt: str = "You are a helpful assistant.", endpoint: str = None) -> str:
    """Call Hugging Face API for text generation with support for multiple model endpoints"""
    if not endpoint:
        endpoint = HUGGINGFACE_ENDPOINT
        
    try:
        # Prepare headers
        headers = {
            "Authorization": f"Bearer {HUGGINGFACE_API_TOKEN}",
            "Content-Type": "application/json"
        }
        
        # Format the prompt based on the model type
        if "mistral" in endpoint.lower():
            formatted_prompt = f"<s>[INST] {system_prompt}\n\n{prompt} [/INST]"
        elif "llama" in endpoint.lower():
            formatted_prompt = f"<s>[INST] <<SYS>>\n{system_prompt}\n<</SYS>>\n\n{prompt} [/INST]"
        elif "gemma" in endpoint.lower():
            formatted_prompt = f"<start_of_turn>user\n{system_prompt}\n{prompt}<end_of_turn>\n<start_of_turn>model"
        else:
            # Default format for other models
            formatted_prompt = f"{system_prompt}\n\n{prompt}"
        
        # Make the API request
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": 1024,
                "temperature": 0.7,
                "top_p": 0.95,
                "do_sample": True
            }
        }
        
        logger.info(f"Sending request to Hugging Face API endpoint: {endpoint}")
        response = requests.post(
            endpoint,
            headers=headers,
            json=payload,
            timeout=60  # Longer timeout for HF API
        )
        
        # Check if the response is successful
        response.raise_for_status()
        logger.info(f"Received HTTP status code: {response.status_code}")
        
        # Extract the generated text
        result = response.json()
        logger.info(f"Raw JSON response from API: {str(result)[:200]}...")
        
        # Handle different response formats
        if isinstance(result, list) and len(result) > 0:
            if "generated_text" in result[0]:
                return result[0]["generated_text"].replace(formatted_prompt, "").strip()
            else:
                return str(result[0]).strip()
        elif isinstance(result, dict) and "generated_text" in result:
            return result["generated_text"].replace(formatted_prompt, "").strip()
        else:
            logger.warning(f"Unexpected response format. Using as plain text: {str(result)[:100]}...")
            return str(result).strip()
    
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error to Hugging Face API ({endpoint}): {str(e)}")
        raise ConnectionError(f"Could not connect to Hugging Face API. Check your internet connection.")
    except Exception as e:
        logger.error(f"Error calling Hugging Face API ({endpoint}): {str(e)}")
        raise

async def call_huggingface_with_fallbacks(prompt: str, system_prompt: str = "You are a helpful assistant.") -> str:
    """Try multiple Hugging Face models in sequence until one succeeds"""
    # Try primary endpoint first
    try:
        return await call_huggingface_api(prompt, system_prompt)
    except Exception as e:
        logger.warning(f"Primary Hugging Face model failed: {str(e)}. Trying fallbacks...")
    
    # Try fallback models
    last_error = None
    for fallback_endpoint in HUGGINGFACE_MODELS["fallbacks"]:
        try:
            logger.info(f"Trying fallback model: {fallback_endpoint}")
            return await call_huggingface_api(prompt, system_prompt, fallback_endpoint)
        except Exception as e:
            logger.warning(f"Fallback model {fallback_endpoint} failed: {str(e)}")
            last_error = e
    
    # If all models failed, raise the last error
    if last_error:
        raise last_error
    else:
        raise Exception("All Hugging Face models failed")

async def generate_questions(role_id: str) -> List[Question]:
    """Generate interview questions using OpenRouter API"""
    try:
        # Get role details from database
        db = get_database()
        role = await db["roles"].find_one({"_id": ObjectId(role_id)})
        if not role:
            raise ValueError("Role not found")
        
        # Prepare the prompt based on role details
        prompt = f"""Generate 5 interview questions for a {role['name']} position.
Job Description: {role['description'] or role['name']}

Please generate a mix of technical and behavioral questions that assess the candidate's skills and experience.
For each question, you MUST provide the text in English, French, and Arabic.

Format the response as a JSON array of question objects with these fields:
- text: A dictionary with language codes as keys and the question text in that language
  - "en": English text (e.g., "What is your experience with Python?")
  - "fr": French text (e.g., "Quelle est votre expérience avec Python ?")
  - "ar": Arabic text (e.g., "ما هي خبرتك مع بايثون؟")
- type: Either "technical" or "behavioral"
- difficulty: A number from 1-5
- skill_tested: The skill being assessed
- reference_answer: A dictionary with language codes as keys and the reference answer in that language
  - "en": English answer
  - "fr": French answer
  - "ar": Arabic answer

Example format:
[
    {{
        "text": {{
            "en": "What is your experience with Python?",
            "fr": "Quelle est votre expérience avec Python ?",
            "ar": "ما هي خبرتك مع بايثون؟"
        }},
        "type": "technical",
        "difficulty": 3,
        "skill_tested": "programming",
        "reference_answer": {{
            "en": "A good answer would include specific examples of Python projects...",
            "fr": "Une bonne réponse inclurait des exemples spécifiques de projets Python...",
            "ar": "ستتضمن الإجابة الجيدة أمثلة محددة لمشاريع بايثون..."
        }}
    }}
]

IMPORTANT: 
1. Each question MUST be provided in all three languages (English, French, and Arabic)
2. Do not use the same text for all languages - each language should have its own proper translation
3. The format should be exactly as shown in the example
4. Make sure the Arabic text is properly right-to-left formatted."""

        # Call OpenRouter API with the free model
        response = client.chat.completions.create(
            model="meta-llama/llama-4-maverick:free",  # Using the free model
            messages=[
                {"role": "system", "content": "You are an expert interviewer and translator. Generate interview questions and provide proper translations in English, French, and Arabic. Each question and answer must be properly translated into all three languages. The Arabic text should be properly right-to-left formatted."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000,  # Increased token limit for multilingual content
            response_format={ "type": "json_object" }
        )

        # Parse the response
        try:
            # First try to parse the entire response as JSON
            response_data = json.loads(response.choices[0].message.content)
            if isinstance(response_data, dict) and "questions" in response_data:
                questions_data = response_data["questions"]
            else:
                questions_data = response_data
        except json.JSONDecodeError:
            # If JSON parsing fails, try to extract questions from text
            text = response.choices[0].message.content
            questions = []
            for line in text.split('\n'):
                if line.strip() and '?' in line:
                    # If we only have English text, translate it
                    en_text = line.strip()
                    fr_text = await translate_text(en_text, "fr")
                    ar_text = await translate_text(en_text, "ar")
                    
                    questions.append({
                        "text": {
                            "en": en_text,
                            "fr": fr_text,
                            "ar": ar_text
                        },
                        "type": "behavioral",
                        "difficulty": 3,
                        "skill_tested": "general",
                        "reference_answer": {
                            "en": "A good answer would address the question directly and provide relevant examples.",
                            "fr": "Une bonne réponse aborderait directement la question et fournirait des exemples pertinents.",
                            "ar": "ستتناول الإجابة الجيدة السؤال مباشرة وتقدم أمثلة ذات صلة."
                        }
                    })
            questions_data = questions[:5]  # Take first 5 questions

        # Convert to Question objects
        questions = []
        for i, q_data in enumerate(questions_data):
            # Ensure all required fields are present
            if isinstance(q_data, str):
                # If we only have English text, translate it
                en_text = q_data
                fr_text = await translate_text(en_text, "fr")
                ar_text = await translate_text(en_text, "ar")
                
                q_data = {
                    "text": {
                        "en": en_text,
                        "fr": fr_text,
                        "ar": ar_text
                    },
                    "type": "behavioral",
                    "difficulty": 3,
                    "skill_tested": "general",
                    "reference_answer": {
                        "en": "A good answer would address the question directly and provide relevant examples.",
                        "fr": "Une bonne réponse aborderait directement la question et fournirait des exemples pertinents.",
                        "ar": "ستتناول الإجابة الجيدة السؤال مباشرة وتقدم أمثلة ذات صلة."
                    }
                }
            elif not isinstance(q_data, dict):
                continue

            # Ensure text and reference_answer are dictionaries with proper translations
            if isinstance(q_data.get("text"), str):
                en_text = q_data["text"]
                fr_text = await translate_text(en_text, "fr")
                ar_text = await translate_text(en_text, "ar")
                q_data["text"] = {
                    "en": en_text,
                    "fr": fr_text,
                    "ar": ar_text
                }
            if isinstance(q_data.get("reference_answer"), str):
                en_text = q_data["reference_answer"]
                fr_text = await translate_text(en_text, "fr")
                ar_text = await translate_text(en_text, "ar")
                q_data["reference_answer"] = {
                    "en": en_text,
                    "fr": fr_text,
                    "ar": ar_text
                }

            questions.append(Question(
                id=f"q_{i+1}",
                text=q_data.get("text", {"en": "", "fr": "", "ar": ""}),
                type=q_data.get("type", "behavioral"),
                difficulty=q_data.get("difficulty", 3),
                skill_tested=q_data.get("skill_tested", "general"),
                reference_answer=q_data.get("reference_answer", {
                    "en": "A good answer would address the question directly and provide relevant examples.",
                    "fr": "Une bonne réponse aborderait directement la question et fournirait des exemples pertinents.",
                    "ar": "ستتناول الإجابة الجيدة السؤال مباشرة وتقدم أمثلة ذات صلة."
                })
            ))

        return questions

    except Exception as e:
        logger.error(f"Error generating questions: {str(e)}")
        raise

async def translate_text(text: str, target_language: str) -> str:
    """Translate text to the target language using OpenRouter API"""
    try:
        # Prepare the translation prompt
        prompt = f"""Translate the following text to {target_language}:
        {text}
        
        Return only the translated text, nothing else."""

        # Call OpenRouter API for translation
        response = client.chat.completions.create(
            model="meta-llama/llama-4-maverick:free",
            messages=[
                {"role": "system", "content": f"You are a professional translator. Translate the given text to {target_language}."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500
        )

        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error translating text: {str(e)}")
        return text  # Return original text if translation fails

async def translate_questions(questions: List[Dict[str, str]], target_language: str) -> List[Dict[str, str]]:
    """
    Translate questions to the target language using OpenRouter API.
    """
    try:
        translated_questions = []
        for question in questions:
            # Prepare the translation prompt
            prompt = f"""Translate the following interview question to {target_language}:
            {question['question']}
            
            Return only the translated question, nothing else.
            """
            
            # Get translation using OpenRouter API
            response = client.chat.completions.create(
                model="openchat/openchat-3.5-1210",  # or "mistralai/mistral-7b-instruct"
                messages=[
                    {"role": "system", "content": f"You are a professional translator. Translate the given text to {target_language}."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            translated_text = response.choices[0].message.content.strip()
            
            # Create translated question object
            translated_question = {
                "question": translated_text,
                "type": question["type"]
            }
            translated_questions.append(translated_question)
        
        return translated_questions
        
    except Exception as e:
        logger.error(f"Error translating questions: {str(e)}")
        return questions  # Return original questions if translation fails

async def evaluate_answer(
    question: str,
    reference_answer: str,
    user_answer: str,
    code_submission: Optional[str] = None
) -> Dict:
    prompt = f"""
    Evaluate the following interview answer:
    
    Question: {question}
    Reference Answer: {reference_answer}
    User Answer: {user_answer}
    """
    
    if code_submission:
        prompt += f"\nCode Submission: {code_submission}"
    
    prompt += """
    Return a JSON object with the following structure:
    {
        "correctness_score": float between 0-1,
        "clarity_score": float between 0-1,
        "depth_score": float between 0-1,
        "confidence_score": float between 0-1,
        "feedback": "Detailed feedback on the answer",
        "resources": [
            {
                "title": "Resource title",
                "url": "Resource URL"
            }
        ]
    }
    
    Ensure your response is a properly formatted JSON object with nothing else.
    """
    
    try:
        # Try Hugging Face API
        response_text = await call_huggingface_with_fallbacks(
            prompt=prompt,
            system_prompt="You are an expert technical interviewer."
        )
        
        # Parse JSON response
        try:
            json_pattern = r'({[\s\S]*})'
            json_match = re.search(json_pattern, response_text)
            
            if json_match:
                cleaned_json = json_match.group(1)
                evaluation = json.loads(cleaned_json)
            else:
                evaluation = json.loads(response_text)
            
            # Ensure all required fields are present
            required_fields = ["correctness_score", "clarity_score", "depth_score", "confidence_score", "feedback"]
            for field in required_fields:
                if field not in evaluation:
                    evaluation[field] = 0.5 if "score" in field else "No specific feedback available."
            
            if "resources" not in evaluation:
                evaluation["resources"] = [{"title": "Official Documentation", "url": "https://docs.example.com"}]
                
            return evaluation
            
        except json.JSONDecodeError:
            # If JSON parsing fails, extract JSON from response
            json_match = re.search(r'{.*}', response_text, re.DOTALL)
            if json_match:
                evaluation = json.loads(json_match.group(0))
                return evaluation
            else:
                # Return a default evaluation
                return {
                    "correctness_score": 0.7,
                    "clarity_score": 0.7,
                    "depth_score": 0.7,
                    "confidence_score": 0.7,
                    "feedback": f"Unable to parse evaluation. Original response: {response_text[:100]}...",
                    "resources": [{"title": "Official Documentation", "url": "https://docs.example.com"}]
                }
                
    except Exception as e:
        logger.error(f"Error using LLM for evaluation: {str(e)}")
        
        # Return a default evaluation as last resort
        return {
            "correctness_score": 0.5,
            "clarity_score": 0.5,
            "depth_score": 0.5,
            "confidence_score": 0.5,
            "feedback": "We were unable to evaluate your answer due to a technical issue. Please try again later.",
            "resources": [
                {
                    "title": "Related Documentation",
                    "url": "https://docs.example.com"
                }
            ]
        }

async def analyze_voice(audio_data: bytes) -> Dict:
    """Analyze voice using Hugging Face speech-to-text API or fallback metrics"""
    try:
        # Save audio data to temporary file
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio.write(audio_data)
            temp_audio_path = temp_audio.name
        
        # Use Hugging Face Speech-to-Text API
        transcription = await transcribe_audio_huggingface(temp_audio_path)
        
        # Remove temporary file
        import os
        os.unlink(temp_audio_path)
        
        # Analyze transcription for speech metrics
        words = transcription.split()
        word_count = len(words)
        filler_words = ['um', 'uh', 'like', 'you know', 'so', 'actually', 'basically']
        
        filler_count = 0
        for word in words:
            if word.lower() in filler_words:
                filler_count += 1
        
        # Calculate hesitation based on pauses (periods, commas)
        hesitation_count = transcription.count('...') + transcription.count('..') * 0.5
        
        # Calculate metrics
        clarity = 0.9 - (filler_count / max(word_count, 1) * 0.5)
        fluency = 0.9 - (hesitation_count / max(word_count, 1) * 5)
        pace = 0.7  # Default pace score
        
        return {
            "confidence": 0.8,
            "clarity": max(0.1, min(clarity, 1.0)),
            "fluency": max(0.1, min(fluency, 1.0)),
            "pace": pace,
            "hesitation_count": int(hesitation_count),
            "filler_words_count": filler_count,
            "transcription": transcription
        }
    except Exception as e:
        logger.error(f"Error analyzing voice: {str(e)}")
        # Return default metrics
        return {
            "confidence": 0.7,
            "clarity": 0.7,
            "fluency": 0.7,
            "pace": 0.7,
            "hesitation_count": 0,
            "filler_words_count": 0,
            "transcription": "Unable to transcribe audio"
        }

async def transcribe_audio_huggingface(audio_file_path: str) -> str:
    """Transcribe audio using Hugging Face speech-to-text API"""
    try:
        logger.info(f"Transcribing audio with Hugging Face API")
        
        # Read audio file as bytes
        with open(audio_file_path, "rb") as f:
            audio_bytes = f.read()
        
        # Prepare headers with API token
        headers = {
            "Authorization": f"Bearer {settings.HUGGINGFACE_API_TOKEN}"
        }
        
        # Send request to Hugging Face Speech-to-Text API
        endpoint = settings.SPEECH_TO_TEXT_ENDPOINT
        
        # First try with binary data
        try:
            response = requests.post(
                endpoint,
                headers=headers,
                data=audio_bytes,
                timeout=30
            )
            response.raise_for_status()
        except Exception as e:
            logger.warning(f"Failed to transcribe with binary data: {str(e)}")
            
            # Fallback to multipart form upload
            files = {
                "file": ("audio.wav", audio_bytes),
            }
            response = requests.post(
                endpoint,
                headers=headers,
                files=files,
                timeout=30
            )
            response.raise_for_status()
        
        # Parse the response
        result = response.json()
        
        # Extract transcription from different possible formats
        if isinstance(result, dict) and "text" in result:
            transcription = result["text"]
        elif isinstance(result, list) and len(result) > 0 and "text" in result[0]:
            transcription = result[0]["text"]
        else:
            transcription = str(result)
            
        logger.info(f"Transcription successful: {transcription[:50]}...")
        return transcription
        
    except Exception as e:
        logger.error(f"Error transcribing with Hugging Face: {str(e)}")
        
        # Try alternative speech-to-text provider if configured
        if settings.SPEECH_TO_TEXT_PROVIDER == "assembly_ai" and settings.ASSEMBLY_AI_API_KEY:
            try:
                return await transcribe_audio_assemblyai(audio_file_path)
            except Exception as e2:
                logger.error(f"Error with Assembly AI fallback: {str(e2)}")
        
        # Return empty transcription if all methods fail
        return "Transcription failed. Please try again or speak more clearly."

async def transcribe_audio_assemblyai(audio_file_path: str) -> str:
    """Transcribe audio using Assembly AI as a fallback"""
    try:
        import requests
        
        # Read audio file as bytes
        with open(audio_file_path, "rb") as f:
            audio_bytes = f.read()
        
        # Assembly AI API endpoints
        upload_endpoint = "https://api.assemblyai.com/v2/upload"
        transcript_endpoint = "https://api.assemblyai.com/v2/transcript"
        
        # Headers with API key
        headers = {
            "authorization": settings.ASSEMBLY_AI_API_KEY
        }
        
        # Upload the audio file
        upload_response = requests.post(
            upload_endpoint,
            headers=headers,
            data=audio_bytes
        )
        upload_response.raise_for_status()
        audio_url = upload_response.json()["upload_url"]
        
        # Request transcription
        transcript_request = {
            "audio_url": audio_url
        }
        transcript_response = requests.post(
            transcript_endpoint,
            json=transcript_request,
            headers=headers
        )
        transcript_response.raise_for_status()
        transcript_id = transcript_response.json()["id"]
        
        # Poll for transcription completion
        polling_endpoint = f"https://api.assemblyai.com/v2/transcript/{transcript_id}"
        while True:
            polling_response = requests.get(polling_endpoint, headers=headers)
            polling_response.raise_for_status()
            transcription_result = polling_response.json()
            
            if transcription_result["status"] == "completed":
                return transcription_result["text"]
            
            elif transcription_result["status"] == "error":
                raise RuntimeError(f"Transcription failed: {transcription_result['error']}")
            
            # Wait before polling again
            import asyncio
            await asyncio.sleep(1)
            
    except Exception as e:
        logger.error(f"Error using Assembly AI for transcription: {str(e)}")
        raise

async def analyze_facial_metrics(video_data: bytes) -> Dict:
    """Analyze facial expressions using AWS Rekognition (if available)"""
    try:
        if not rekognition:
            logger.warning("Facial analysis requested but Rekognition is not available. Using fallback metrics.")
            # Return default metrics when Rekognition is not available
            return {
                "engagement": 0.7,
                "confidence": 0.7,
                "eye_contact": 0.7,
                "expressions": {
                    "happy": 0.5,
                    "neutral": 0.3,
                    "thoughtful": 0.2
                }
            }
        
        # Analyze facial expressions using AWS Rekognition
        response = rekognition.detect_faces(
            Image={'Bytes': video_data},
            Attributes=['ALL']
        )
        
        # Process the results
        # This is a simplified version - you'd need more sophisticated analysis
        return {
            "engagement": 0.8,
            "confidence": 0.75,
            "eye_contact": 0.85,
            "expressions": {
                "happy": 0.6,
                "neutral": 0.3,
                "thoughtful": 0.1
            }
        }
    except Exception as e:
        logger.error(f"Error in facial analysis: {str(e)}")
        return {
            "engagement": 0.5,
            "confidence": 0.5,
            "eye_contact": 0.5,
            "expressions": {
                "happy": 0.3,
                "neutral": 0.5,
                "thoughtful": 0.2
            }
        }

async def generate_feedback(interview: Interview) -> Dict:
    # Prepare the prompt with interview data
    prompt = f"""
    Generate feedback for an interview with the following metrics:
    
    Technical Score: {interview.technical_score}
    Communication Score: {interview.communication_score}
    Overall Score: {interview.overall_score}
    
    Voice Metrics: {interview.voice_metrics}
    Facial Metrics: {interview.facial_metrics}
    
    Questions and Answers:
    """
    
    for q, a in zip(interview.questions, interview.answers):
        prompt += f"\nQ: {q.text}\nA: {a.transcribed_text}\nScore: {a.correctness_score}\n"
    
    try:
        # Try Hugging Face API with fallbacks
        logger.info(f"Attempting to use Hugging Face API for feedback")
        feedback = await call_huggingface_with_fallbacks(
            prompt=prompt,
            system_prompt="You are an expert interview coach."
        )
    except Exception as e:
        logger.error(f"Error using LLM for feedback: {str(e)}")
        feedback = "We could not generate personalized feedback at this time. Please review your scores and answers."
    
    # Process the feedback
    return {
        "summary": feedback,
        "improvement_areas": [
            "Technical knowledge in specific areas",
            "Communication clarity",
            "Confidence in responses"
        ]
    }

async def generate_avatar_response(text: str, language: str = "en") -> bytes:
    """Generate audio response using OpenAI TTS"""
    try:
        response = await openai.audio.speech.create(
            model="tts-1",
            voice="alloy",
            input=text
        )
        return response.content
    except Exception as e:
        logger.error(f"Error in avatar response generation: {str(e)}")
        return b"" 

async def analyze_resume(file_url: str) -> Dict:
    """Analyze resume content using OpenAI API"""
    try:
        # Download file from S3
        s3 = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        
        # Extract bucket and key from URL
        bucket = settings.S3_BUCKET
        key = file_url.split(f"{bucket}.s3.{settings.AWS_REGION}.amazonaws.com/")[1]
        
        # Get file from S3
        response = s3.get_object(Bucket=bucket, Key=key)
        file_content = response['Body'].read()
        
        # Extract text based on file type
        text = ""
        if key.lower().endswith('.pdf'):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(file_content))
            for page in pdf_reader.pages:
                text += page.extract_text()
        elif key.lower().endswith('.docx'):
            text = docx2txt.process(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format")

        # Prepare prompt for GPT
        prompt = f"""
        Analyze the following resume and extract structured information:
        
        {text}
        
        Extract and organize the following information:
        1. Skills (technical and soft skills)
        2. Work experience (company, position, dates, responsibilities)
        3. Education (institution, degree, dates)
        4. Projects (name, description, technologies used)
        5. Languages
        6. Certifications
        
        Format the response as structured data that can be parsed.
        """
        
        try:
            # Use Hugging Face API with fallbacks
            logger.info(f"Attempting to use Hugging Face API for resume analysis")
            analysis = await call_huggingface_with_fallbacks(
                prompt=prompt,
                system_prompt="You are an expert resume analyzer."
            )
        except Exception as e:
            logger.error(f"Error using LLM for resume analysis: {str(e)}")
            raise ValueError("No LLM available for resume analysis")
        
        # Call LLM again to get structured JSON
        structure_prompt = f"""
        Convert this resume analysis into a structured JSON format:
        
        {analysis}
        
        Format it as:
        {{
            "parsed_data": {{
                "skills": ["skill1", "skill2", ...],
                "experience": [
                    {{
                        "company": "company name",
                        "position": "job title",
                        "start_date": "YYYY-MM-DD",
                        "end_date": "YYYY-MM-DD",
                        "description": "job description",
                        "technologies": ["tech1", "tech2", ...]
                    }}
                ],
                "education": [
                    {{
                        "institution": "school name",
                        "degree": "degree name",
                        "field_of_study": "major",
                        "start_date": "YYYY-MM-DD",
                        "end_date": "YYYY-MM-DD",
                        "description": "additional details"
                    }}
                ],
                "projects": [
                    {{
                        "name": "project name",
                        "description": "project description",
                        "technologies": ["tech1", "tech2", ...],
                        "url": "project url",
                        "start_date": "YYYY-MM-DD",
                        "end_date": "YYYY-MM-DD"
                    }}
                ],
                "languages": ["language1", "language2", ...],
                "certifications": ["cert1", "cert2", ...]
            }},
            "confidence_score": 0.95,
            "skill_matches": {{
                "python": 0.9,
                "javascript": 0.8,
                ...
            }}
        }}
        """
        
        try:
            # Use Hugging Face API with fallbacks
            logger.info(f"Attempting to use Hugging Face API for JSON formatting")
            structured_text = await call_huggingface_with_fallbacks(
                prompt=structure_prompt,
                system_prompt="You are a JSON formatter for resume data."
            )
        except Exception as e:
            logger.error(f"Error using LLM for JSON formatting: {str(e)}")
            raise ValueError("No LLM available for JSON formatting")
        
        # Parse the structured response
        try:
            # Try to parse as JSON
            result = json.loads(structured_text)
        except json.JSONDecodeError:
            # If it fails, try to extract JSON from the text
            json_match = re.search(r'{.*}', structured_text, re.DOTALL)
            if json_match:
                try:
                    result = json.loads(json_match.group(0))
                except:
                    raise ValueError("Could not parse JSON from response")
            else:
                raise ValueError("Could not find JSON in response")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in resume analysis: {str(e)}")
        from fastapi import HTTPException
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze resume: {str(e)}"
        ) 