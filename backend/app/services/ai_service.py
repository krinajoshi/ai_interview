from typing import List, Dict, Optional
import openai
import whisper
import boto3
import logging
from ..core.config import settings
from ..models.interview import Interview, Question
from ..models.resume import Resume, ParsedResumeData
from ..db.mongodb import get_database
import docx2txt
import PyPDF2
import io

# Configure logging
logger = logging.getLogger(__name__)

# Initialize clients
openai.api_key = settings.OPENAI_API_KEY
whisper_model = whisper.load_model("base")
rekognition = boto3.client(
    'rekognition',
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_REGION
)

async def generate_questions(interview: Interview) -> List[Question]:
    # Get database connection
    db = get_database()
    
    # Get role and resume data
    role_dict = db.roles.find_one({"_id": interview.role_id})
    resume_dict = db.resumes.find_one({"user_id": interview.user_id})
    
    if not role_dict or not resume_dict:
        raise ValueError("Role or resume not found")
    
    # Prepare prompt
    prompt = f"""
    Generate interview questions for a {role_dict['experience_level']} {role_dict['name']} position.
    
    Required skills: {', '.join(s['name'] for s in role_dict['required_skills'])}
    Candidate skills: {', '.join(resume_dict['parsed_data']['skills'])}
    
    Interview structure:
    - Technical questions: {role_dict['interview_structure'].get('technical', 0)}
    - Behavioral questions: {role_dict['interview_structure'].get('behavioral', 0)}
    
    Generate questions that:
    1. Test required skills
    2. Focus on skill gaps
    3. Match the difficulty distribution: {role_dict['difficulty_distribution']}
    4. Are appropriate for the experience level
    """
    
    # Call OpenAI API
    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert technical interviewer."},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Parse and structure questions
    questions_data = response.choices[0].message.content
    # Process the response and create Question objects
    # This is a simplified version - you'd need to parse the actual response
    questions = []
    for q in questions_data.split("\n"):
        if q.strip():
            question = Question(
                interview_id=interview.id,
                text=q,
                type="technical",  # You'd need to determine this
                difficulty=3,  # You'd need to determine this
                skill_tested="",  # You'd need to determine this
                reference_answer="",  # You'd need to generate this
                order=len(questions) + 1
            )
            questions.append(question)
    
    return questions

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
    
    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert technical interviewer."},
            {"role": "user", "content": prompt}
        ]
    )
    
    # Process the evaluation
    # This is a simplified version - you'd need to parse the actual response
    return {
        "correctness_score": 0.8,
        "clarity_score": 0.7,
        "depth_score": 0.75,
        "confidence_score": 0.85,
        "feedback": response.choices[0].message.content,
        "resources": [
            {
                "title": "Related Documentation",
                "url": "https://docs.example.com"
            }
        ]
    }

async def analyze_voice_metrics(audio_data: bytes) -> Dict:
    """Analyze voice using Whisper and custom metrics"""
    try:
        # Save audio data to temporary file
        import tempfile
        import os
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            temp_audio.write(audio_data)
            temp_audio_path = temp_audio.name
        
        # Transcribe using Whisper
        result = whisper_model.transcribe(temp_audio_path)
        
        # Clean up temporary file
        os.unlink(temp_audio_path)
        
        # Extract metrics from Whisper result
        segments = result.get('segments', [])
        total_duration = sum(seg.get('end', 0) - seg.get('start', 0) for seg in segments)
        words = sum(len(seg.get('text', '').split()) for seg in segments)
        
        # Calculate metrics
        words_per_minute = (words / total_duration) * 60 if total_duration > 0 else 0
        avg_segment_duration = total_duration / len(segments) if segments else 0
        confidence = sum(seg.get('confidence', 0) for seg in segments) / len(segments) if segments else 0
        
        return {
            "confidence": confidence,
            "clarity": confidence * 0.8,  # Estimated based on confidence
            "fluency": min(1.0, words_per_minute / 150),  # Normalized WPM
            "pace": min(1.0, avg_segment_duration / 3),  # Normalized segment duration
            "hesitation_count": sum(1 for seg in segments if seg.get('end', 0) - seg.get('start', 0) > 2),
            "filler_words_count": sum(1 for seg in segments if any(word in seg.get('text', '').lower() for word in ['um', 'uh', 'like', 'you know']))
        }
    except Exception as e:
        logger.error(f"Error in voice analysis: {str(e)}")
        return {
            "confidence": 0.5,
            "clarity": 0.5,
            "fluency": 0.5,
            "pace": 0.5,
            "hesitation_count": 0,
            "filler_words_count": 0
        }

async def analyze_facial_metrics(video_data: bytes) -> Dict:
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
    
    response = await openai.ChatCompletion.acreate(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are an expert interview coach."},
            {"role": "user", "content": prompt}
        ]
    )
    
    feedback = response.choices[0].message.content
    
    # Process the feedback
    # This is a simplified version - you'd need to parse the actual response
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
        
        # Call OpenAI API
        response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert resume analyzer."},
                {"role": "user", "content": prompt}
            ]
        )
        
        # Process and structure the response
        analysis = response.choices[0].message.content
        
        # Call OpenAI again to get structured JSON
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
        
        structured_response = await openai.ChatCompletion.acreate(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a JSON formatter for resume data."},
                {"role": "user", "content": structure_prompt}
            ]
        )
        
        # Parse the structured response
        import json
        result = json.loads(structured_response.choices[0].message.content)
        
        return result
        
    except Exception as e:
        logger.error(f"Error in resume analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze resume: {str(e)}"
        ) 