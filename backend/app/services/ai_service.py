import logging
import uuid
import random
from typing import List, Dict, Optional
import re
import cohere
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Cohere client
co = cohere.Client(os.getenv('COHERE_API_KEY'))

# Role-specific question templates
ROLE_TEMPLATES = {
    "software engineer": [
        "What experience do you have with {language} programming and how have you used it to solve complex problems?",
        "Describe a challenging software architecture you designed for a {project_type} project. What patterns did you use and why?",
        "How do you approach debugging a complex issue in a large codebase?",
        "Explain your process for code reviews and ensuring code quality in a team environment.",
        "How do you stay updated with the latest software development practices in the {technology} field?",
        "Describe your experience with containerization and orchestration tools like Docker and Kubernetes.",
        "How do you handle technical debt in your projects?",
        "What CI/CD practices have you implemented in your previous roles?",
        "Explain your approach to writing unit tests and integration tests.",
        "How do you ensure security best practices in your code?",
        "Describe a time when you had to optimize code for performance. What techniques did you use?",
        "How do you approach learning a new programming language or framework?",
        "What's your experience with microservices architecture?",
        "How do you handle version control conflicts in a team setting?",
        "Describe your experience with cloud platforms like AWS, Azure, or GCP."
    ],
    "data scientist": [
        "Describe your experience with {ml_technique} and how you've applied it to solve real-world problems.",
        "How do you approach feature selection and engineering in your machine learning models?",
        "Explain a time when you had to communicate complex data findings to non-technical stakeholders.",
        "What techniques do you use to handle imbalanced datasets in {ml_application} projects?",
        "How do you validate the performance of your machine learning models and ensure they generalize well?",
        "Describe your experience with big data technologies like Spark or Hadoop.",
        "How do you approach A/B testing and experimental design?",
        "What methods do you use to handle missing data in your datasets?",
        "Explain your process for model selection and hyperparameter tuning.",
        "How do you ensure that your models are fair and unbiased?",
        "Describe a challenging data cleaning problem you've faced and how you solved it.",
        "What visualization tools do you use to communicate your findings?",
        "How do you approach time series forecasting problems?",
        "Explain your experience with deep learning frameworks like TensorFlow or PyTorch.",
        "How do you deploy machine learning models to production?"
    ],
    "product manager": [
        "How do you prioritize features in your product roadmap for a {product_type} product?",
        "Describe how you gather and incorporate user feedback into your product development process.",
        "Tell me about a time when you had to make a difficult product decision with limited data.",
        "How do you measure the success of a product feature after launch?",
        "Describe your approach to working with engineering teams to deliver products on time.",
        "How do you balance stakeholder requests with user needs?",
        "Describe your process for creating product requirements documents.",
        "How do you handle scope creep during product development?",
        "What methodologies do you use for product discovery?",
        "How do you approach pricing strategies for new products?",
        "Describe a time when you had to pivot a product strategy. What led to that decision?",
        "How do you incorporate competitive analysis into your product planning?",
        "What metrics do you track to evaluate product health?",
        "How do you manage technical debt from a product perspective?",
        "Describe your experience with agile development methodologies."
    ],
    "ux designer": [
        "Walk me through your design process from research to implementation for a {design_project} project.",
        "How do you incorporate user research into your design decisions?",
        "Describe a situation where you had to defend a design decision to stakeholders.",
        "How do you ensure your designs are accessible to all users?",
        "Tell me about a time when you had to iterate on a design based on user feedback.",
        "How do you approach creating user personas and journey maps?",
        "Describe your experience with design systems and component libraries.",
        "How do you collaborate with developers to ensure design implementation accuracy?",
        "What tools do you use for prototyping and why?",
        "How do you conduct usability testing?",
        "Describe a time when you had to design for multiple platforms (web, mobile, etc.).",
        "How do you stay updated with the latest UX trends and best practices?",
        "Explain your approach to information architecture and content strategy.",
        "How do you balance aesthetic design with usability?",
        "Describe your experience with animation and micro-interactions in your designs."
    ],
    "project manager": [
        "How do you handle resource allocation in a {project_size} project with tight deadlines?",
        "Describe your approach to risk management in complex projects.",
        "Tell me about a time when a project was falling behind schedule. How did you address it?",
        "How do you ensure effective communication among team members and stakeholders?",
        "Describe how you track and report project progress to different stakeholders.",
        "How do you manage scope changes during project execution?",
        "What project management methodologies are you experienced with?",
        "How do you handle conflicts between team members?",
        "Describe your approach to creating project timelines and milestones.",
        "How do you ensure quality control throughout the project lifecycle?",
        "Tell me about a time when you had to manage multiple projects simultaneously.",
        "How do you handle budget constraints in your projects?",
        "Describe your experience with project management tools and software.",
        "How do you onboard new team members to an ongoing project?",
        "What strategies do you use to keep stakeholders engaged throughout the project?"
    ],
    "marketing": [
        "How do you develop marketing strategies for {product_type} products?",
        "Describe a successful marketing campaign you led and what metrics you used to measure its success.",
        "How do you identify and target the right audience for a new product?",
        "Tell me about a time when a marketing initiative didn't perform as expected. How did you adjust?",
        "How do you stay updated with the latest marketing trends and technologies?",
        "Describe your experience with SEO and content marketing.",
        "How do you approach social media marketing for different platforms?",
        "What analytics tools do you use to track marketing performance?",
        "How do you develop and maintain a consistent brand voice?",
        "Describe your experience with email marketing campaigns.",
        "How do you calculate ROI for your marketing initiatives?",
        "Tell me about your experience with paid advertising platforms.",
        "How do you approach marketing for different stages of the customer journey?",
        "Describe a time when you had to work with a limited marketing budget.",
        "How do you collaborate with sales teams to ensure marketing-sales alignment?"
    ],
    "sales": [
        "Describe your sales approach when dealing with potential clients in the {industry} industry.",
        "How do you handle objections during the sales process?",
        "Tell me about your most challenging sale and how you closed it.",
        "How do you build and maintain relationships with clients?",
        "Describe how you identify new sales opportunities in existing accounts.",
        "What CRM systems have you worked with and how do you use them effectively?",
        "How do you approach cold calling and prospecting?",
        "Describe your experience with solution selling versus product selling.",
        "How do you prepare for sales meetings with potential clients?",
        "Tell me about a time when you lost a sale. What did you learn from it?",
        "How do you stay motivated during periods of rejection?",
        "Describe your approach to negotiating contracts and pricing.",
        "How do you forecast sales and set realistic targets?",
        "What strategies do you use to upsell or cross-sell to existing customers?",
        "How do you collaborate with marketing teams to generate and qualify leads?"
    ]
}

# Behavioral question templates
BEHAVIORAL_TEMPLATES = [
    "Tell me about a time when you had to work under pressure to meet a deadline.",
    "Describe a situation where you had to collaborate with a difficult team member.",
    "How do you handle feedback and criticism about your work?",
    "Tell me about a time when you failed at something. How did you handle it?",
    "Describe a situation where you had to learn a new skill quickly.",
    "How do you prioritize tasks when you have multiple deadlines?",
    "Tell me about a time when you had to make a difficult decision with limited information.",
    "Describe a situation where you went above and beyond what was expected of you.",
    "How do you handle disagreements with your manager or team members?",
    "Tell me about a time when you had to adapt to a significant change at work.",
    "Describe a situation where you demonstrated leadership skills.",
    "How do you handle stress in the workplace?",
    "Tell me about a time when you had to work with a diverse team.",
    "Describe a situation where you had to persuade others to adopt your idea.",
    "How do you approach continuous learning and professional development?"
]

# French translations for behavioral questions
FR_BEHAVIORAL_TEMPLATES = [
    "Parlez-moi d'une situation où vous avez dû travailler sous pression pour respecter une échéance.",
    "Décrivez une situation où vous avez dû collaborer avec un membre d'équipe difficile.",
    "Comment gérez-vous les retours et les critiques sur votre travail?",
    "Parlez-moi d'une fois où vous avez échoué à quelque chose. Comment l'avez-vous géré?",
    "Décrivez une situation où vous avez dû apprendre une nouvelle compétence rapidement.",
    "Comment priorisez-vous les tâches lorsque vous avez plusieurs délais?",
    "Parlez-moi d'une fois où vous avez dû prendre une décision difficile avec des informations limitées.",
    "Décrivez une situation où vous êtes allé au-delà de ce qu'on attendait de vous.",
    "Comment gérez-vous les désaccords avec votre responsable ou les membres de votre équipe?",
    "Parlez-moi d'une fois où vous avez dû vous adapter à un changement important au travail.",
    "Décrivez une situation où vous avez démontré des compétences en leadership.",
    "Comment gérez-vous le stress au travail?",
    "Parlez-moi d'une fois où vous avez dû travailler avec une équipe diverse.",
    "Décrivez une situation où vous avez dû persuader d'autres personnes d'adopter votre idée.",
    "Comment abordez-vous l'apprentissage continu et le développement professionnel?"
]

# Arabic translations for behavioral questions
AR_BEHAVIORAL_TEMPLATES = [
    "أخبرني عن وقت كان عليك فيه العمل تحت الضغط للوفاء بالموعد النهائي.",
    "صف موقفًا كان عليك فيه التعاون مع عضو صعب في الفريق.",
    "كيف تتعامل مع التعليقات والانتقادات حول عملك؟",
    "أخبرني عن وقت فشلت فيه في شيء ما. كيف تعاملت معه؟",
    "صف موقفًا كان عليك فيه تعلم مهارة جديدة بسرعة.",
    "كيف تحدد أولويات المهام عندما يكون لديك مواعيد نهائية متعددة؟",
    "أخبرني عن وقت كان عليك فيه اتخاذ قرار صعب بمعلومات محدودة.",
    "صف موقفًا تجاوزت فيه ما كان متوقعًا منك.",
    "كيف تتعامل مع الخلافات مع مديرك أو أعضاء فريقك؟",
    "أخبرني عن وقت كان عليك فيه التكيف مع تغيير كبير في العمل.",
    "صف موقفًا أظهرت فيه مهارات القيادة.",
    "كيف تتعامل مع الضغط في مكان العمل؟",
    "أخبرني عن وقت كان عليك فيه العمل مع فريق متنوع.",
    "صف موقفًا كان عليك فيه إقناع الآخرين بتبني فكرتك.",
    "كيف تتعامل مع التعلم المستمر والتطوير المهني؟"
]

# Technical parameters for different roles
ROLE_PARAMS = {
    "software engineer": {
        "language": ["Python", "JavaScript", "Java", "C++", "Go", "Ruby", "TypeScript"],
        "project_type": ["web application", "mobile app", "microservice", "data pipeline", "API"],
        "technology": ["web development", "cloud computing", "mobile development", "AI", "DevOps"]
    },
    "data scientist": {
        "ml_technique": ["deep learning", "natural language processing", "computer vision", "time series analysis", "recommendation systems"],
        "ml_application": ["classification", "regression", "clustering", "anomaly detection", "reinforcement learning"]
    },
    "product manager": {
        "product_type": ["B2B", "B2C", "SaaS", "mobile", "enterprise"]
    },
    "ux designer": {
        "design_project": ["mobile app", "website", "enterprise software", "e-commerce platform", "dashboard"]
    },
    "project manager": {
        "project_size": ["small", "medium", "large", "enterprise", "agile"]
    },
    "marketing": {
        "product_type": ["B2B", "B2C", "SaaS", "mobile app", "enterprise software"]
    },
    "sales": {
        "industry": ["technology", "healthcare", "finance", "retail", "manufacturing"]
    }
}

# Default parameters for any role
DEFAULT_PARAMS = {
    "language": "Python",
    "project_type": "software",
    "technology": "software development",
    "ml_technique": "machine learning",
    "ml_application": "data analysis",
    "product_type": "software",
    "design_project": "user interface",
    "project_size": "medium",
    "industry": "technology"
}

# Translations for common phrases
TRANSLATIONS = {
    "technical": {
        "en": "technical",
        "fr": "technique",
        "ar": "تقني"
    },
    "behavioral": {
        "en": "behavioral",
        "fr": "comportemental",
        "ar": "سلوكي"
    }
}

def translate_question(question: str, language: str) -> str:
    """Translate a question to the target language"""
    if language == "en":
        return question
    
    # For behavioral questions, use the pre-translated templates
    if question in BEHAVIORAL_TEMPLATES:
        index = BEHAVIORAL_TEMPLATES.index(question)
        if language == "fr" and index < len(FR_BEHAVIORAL_TEMPLATES):
            return FR_BEHAVIORAL_TEMPLATES[index]
        elif language == "ar" and index < len(AR_BEHAVIORAL_TEMPLATES):
            return AR_BEHAVIORAL_TEMPLATES[index]
    
    # For technical questions, use a simple translation approach
    # In a real app, you would use a translation service
    if language == "fr":
        # Simple French translation rules
        translated = question
        translated = translated.replace("What", "Quelles").replace("what", "quelles")
        translated = translated.replace("How do you", "Comment")
        translated = translated.replace("Describe", "Décrivez")
        translated = translated.replace("Tell me about", "Parlez-moi de")
        translated = translated.replace("experience", "expérience")
        translated = translated.replace("project", "projet")
        return translated
    
    elif language == "ar":
        # Simple Arabic translation rules
        translated = question
        translated = translated.replace("What", "ما هي").replace("what", "ما هي")
        translated = translated.replace("How do you", "كيف")
        translated = translated.replace("Describe", "صف")
        translated = translated.replace("Tell me about", "أخبرني عن")
        translated = translated.replace("experience", "خبرة")
        translated = translated.replace("project", "مشروع")
        return translated
    
    return question

def format_question(template: str, job_title: str) -> str:
    """Format a question template with job-specific parameters"""
    # Find all placeholders in the template
    placeholders = re.findall(r'\{([^}]+)\}', template)
    
    # Find the best matching role
    job_title_lower = job_title.lower()
    matched_role = None
    
    for role in ROLE_TEMPLATES.keys():
        if role in job_title_lower:
            matched_role = role
            break
    
    # Use default parameters if no role match
    if matched_role is None:
        params = DEFAULT_PARAMS
    else:
        params = ROLE_PARAMS.get(matched_role, DEFAULT_PARAMS)
    
    # Format the template with random parameters
    formatted = template
    for placeholder in placeholders:
        if placeholder in params:
            # Choose a random value from the list
            values = params[placeholder]
            if isinstance(values, list) and values:
                value = random.choice(values)
            else:
                value = values
        else:
            # Use a default value
            value = placeholder
        
        formatted = formatted.replace(f"{{{placeholder}}}", value)
    
    return formatted

async def generate_questions(job_title: str, job_description: str = None, language: str = "en") -> List[Dict]:
    """Generate dynamic interview questions based on job title and description"""
    logger.info(f"Generating questions for job title: {job_title}, language: {language}")
    
    # Find the best matching role
    job_title_lower = job_title.lower()
    matched_role = None
    
    for role in ROLE_TEMPLATES.keys():
        if role in job_title_lower:
            matched_role = role
            break
    
    # Use role-specific templates if available, otherwise use default
    if matched_role:
        logger.info(f"Found matching role: {matched_role}")
        technical_templates = ROLE_TEMPLATES[matched_role]
    else:
        logger.info(f"No specific role match for: {job_title}")
        technical_templates = [
            f"What experience do you have that's relevant to this {job_title} role?",
            f"Describe a challenging problem you solved in a previous role related to {job_title}.",
            f"How do you stay updated with the latest trends in the {job_title} field?",
            f"What technical skills do you think are most important for a {job_title} position?",
            f"Describe a project where you demonstrated skills relevant to the {job_title} role."
        ]
    
    # Select 3 technical questions and 2 behavioral questions
    selected_technical = random.sample(technical_templates, min(3, len(technical_templates)))
    selected_behavioral = random.sample(BEHAVIORAL_TEMPLATES, 2)
    
    # Format questions with job-specific parameters
    formatted_technical = [format_question(q, job_title) for q in selected_technical]
    
    # Combine questions
    all_questions = formatted_technical + selected_behavioral
    
    # Format questions for the frontend
    questions = []
    for i, text in enumerate(all_questions):
        question_id = str(uuid.uuid4())
        question_type = "technical" if i < 3 else "behavioral"
        
        # Translate questions
        texts = {
            "en": text if language == "en" else translate_question(text, "en"),
            "fr": translate_question(text, "fr"),
            "ar": translate_question(text, "ar")
        }
        
        questions.append({
            "id": question_id,
            "text": texts,
            "type": question_type
        })
    
    # Shuffle questions
    random.shuffle(questions)
    
    logger.info(f"Generated {len(questions)} dynamic questions for {job_title}")
    return questions

async def evaluate_answer(
    question: str,
    reference_answer: str,
    user_answer: str,
    code_submission: Optional[str] = None
) -> Dict:
    """Generate meaningful feedback for interview answers using Cohere AI"""
    # Check if answer is too short
    if not user_answer or len(user_answer.strip()) < 10:
        return {
            "score": 0.0,
            "correctness_score": 0.0,
            "clarity_score": 0.0,
            "depth_score": 0.0,
            "confidence_score": 0.0,
            "feedback": "Your answer is too short. Please provide a more detailed response that includes specific examples and explanations.",
            "strengths": [],
            "weaknesses": [
                "Answer too brief",
                "Lacks specific examples",
                "Missing detailed explanation"
            ],
            "suggestions": [
                "Expand your answer with specific examples from your experience",
                "Include relevant details about the situation",
                "Explain your thought process and reasoning",
                "Describe the outcome and what you learned"
            ],
            "keywords": {
                "found": [],
                "missing": ["specific examples", "experience", "details", "explanation"]
            }
        }

    try:
        # Prepare a more concise prompt for Cohere
        prompt = f"""Analyze this interview answer:
Q: {question}
A: {user_answer}

Provide scores (0-1) and feedback in JSON format:
{{
    "correctness_score": float,  # How well they answered
    "clarity_score": float,      # How clear their explanation is
    "depth_score": float,        # How detailed their answer is
    "confidence_score": float,   # How confident they sound
    "strengths": [string],       # What they did well
    "weaknesses": [string],      # What they could improve
    "suggestions": [string],     # How they can improve
    "keywords": {{
        "found": [string],       # Terms they used
        "missing": [string]      # Terms they should use
    }}
}}"""

        # Generate analysis using Cohere with optimized parameters
        response = co.generate(
            prompt=prompt,
            max_tokens=300,  # Reduced from 500
            temperature=0.2,  # Reduced from 0.3 for more consistent output
            k=0,
            p=0.9,
            frequency_penalty=0.1,
            presence_penalty=0.1,
            stop_sequences=["Q:", "A:"],  # Simplified stop sequences
            return_likelihoods='NONE'
        )

        # Parse the response
        try:
            analysis = eval(response.generations[0].text.strip())
        except Exception as e:
            logger.error(f"Error parsing Cohere response: {str(e)}")
            logger.error(f"Raw response: {response.generations[0].text}")
            # Fallback to basic analysis
            analysis = {
                "correctness_score": 0.5,
                "clarity_score": 0.5,
                "depth_score": 0.5,
                "confidence_score": 0.5,
                "strengths": ["Basic answer provided"],
                "weaknesses": ["Could not analyze in detail"],
                "suggestions": ["Try providing more specific examples"],
                "keywords": {
                    "found": [],
                    "missing": ["specific examples", "details"]
                }
            }

        # Calculate overall score with weights
        overall_score = (
            analysis['correctness_score'] * 0.4 +
            analysis['clarity_score'] * 0.3 +
            analysis['depth_score'] * 0.2 +
            analysis['confidence_score'] * 0.1
        )

        # Generate concise feedback summary
        feedback_parts = []
        
        if overall_score >= 0.8:
            feedback_parts.append("Excellent answer! ")
        elif overall_score >= 0.6:
            feedback_parts.append("Good answer. ")
        else:
            feedback_parts.append("Your answer needs improvement. ")

        if analysis['strengths']:
            feedback_parts.append("Strengths: " + ", ".join(analysis['strengths'][:2]) + ". ")
        
        if analysis['weaknesses']:
            feedback_parts.append("Areas for improvement: " + ", ".join(analysis['weaknesses'][:2]) + ". ")
        
        if analysis['suggestions']:
            feedback_parts.append("Suggestions: " + ", ".join(analysis['suggestions'][:2]) + ".")

        return {
            "score": overall_score,
            "correctness_score": analysis['correctness_score'],
            "clarity_score": analysis['clarity_score'],
            "depth_score": analysis['depth_score'],
            "confidence_score": analysis['confidence_score'],
            "feedback": " ".join(feedback_parts),
            "strengths": analysis['strengths'][:2],  # Limit to top 2
            "weaknesses": analysis['weaknesses'][:2],  # Limit to top 2
            "suggestions": analysis['suggestions'][:2],  # Limit to top 2
            "keywords": {
                "found": analysis['keywords']['found'][:3],  # Limit to top 3
                "missing": analysis['keywords']['missing'][:3]  # Limit to top 3
            }
        }

    except Exception as e:
        logger.error(f"Error in Cohere analysis: {str(e)}")
        # Fallback to basic analysis if Cohere fails
        return {
            "score": 0.0,
            "correctness_score": 0.0,
            "clarity_score": 0.0,
            "depth_score": 0.0,
            "confidence_score": 0.0,
            "feedback": "Unable to generate detailed feedback at this time. Please try again.",
            "strengths": [],
            "weaknesses": ["Could not analyze in detail"],
            "suggestions": ["Try providing more specific examples", "Include more details"],
            "keywords": {
                "found": [],
                "missing": ["specific examples", "details"]
            }
        }

async def analyze_voice(audio_data: bytes) -> Dict:
    """Mock voice analysis"""
    return {
        "confidence": 0.8,
        "clarity": 0.7,
        "fluency": 0.75,
        "pace": 0.6,
        "hesitation_count": 2,
        "filler_words_count": 3,
        "transcription": "This is a mock transcription of the audio."
    }

async def analyze_facial_metrics(video_data: bytes) -> Dict:
    """Mock facial expression analysis"""
    return {
        "engagement": 0.7,
        "confidence": 0.8,
        "eye_contact": 0.6,
        "expressions": {
            "happy": 0.3,
            "neutral": 0.5,
            "thoughtful": 0.2
        }
    }

async def translate_text(text: str, target_language: str) -> str:
    """Mock text translation"""
    return f"Translated: {text}"

async def transcribe_audio_huggingface(audio_file_path: str) -> str:
    """Transcribe audio using AssemblyAI's speech-to-text service"""
    try:
        import requests
        from ..core.config import settings
        import tempfile
        import os
        
        # Check if we have the API token
        if not settings.ASSEMBLY_AI_API_KEY:
            logger.error("ASSEMBLY_AI_API_KEY not configured")
            raise ValueError("AssemblyAI API key not configured")
            
        # Handle blob URLs by downloading the audio data
        if audio_file_path.startswith('blob:'):
            # Download the audio data from the blob URL
            response = requests.get(audio_file_path)
            if response.status_code != 200:
                raise Exception(f"Failed to download audio from blob URL: {response.status_code}")
            audio_data = response.content
        else:
            # Read from local file
            with open(audio_file_path, 'rb') as audio_file:
                audio_data = audio_file.read()
            
        # First, upload the audio file to AssemblyAI
        upload_url = "https://api.assemblyai.com/v2/upload"
        headers = {
            "authorization": settings.ASSEMBLY_AI_API_KEY
        }
        
        upload_response = requests.post(
            upload_url,
            headers=headers,
            data=audio_data
        )
        
        if upload_response.status_code != 200:
            logger.error(f"AssemblyAI upload error: {upload_response.status_code} - {upload_response.text}")
            raise Exception(f"Audio upload failed with status {upload_response.status_code}")
            
        # Get the audio URL from the upload response
        audio_url = upload_response.json()["upload_url"]
        
        # Submit the transcription request
        transcript_url = "https://api.assemblyai.com/v2/transcript"
        transcript_request = {
            "audio_url": audio_url,
            "language_code": "en",  # You can make this configurable based on user's language
            "punctuate": True,
            "format_text": True
        }
        
        transcript_response = requests.post(
            transcript_url,
            json=transcript_request,
            headers=headers
        )
        
        if transcript_response.status_code != 200:
            logger.error(f"AssemblyAI transcription error: {transcript_response.status_code} - {transcript_response.text}")
            raise Exception(f"Transcription request failed with status {transcript_response.status_code}")
            
        # Get the transcript ID
        transcript_id = transcript_response.json()["id"]
        
        # Poll for the transcription result
        while True:
            polling_response = requests.get(
                f"{transcript_url}/{transcript_id}",
                headers=headers
            )
            
            if polling_response.status_code != 200:
                logger.error(f"AssemblyAI polling error: {polling_response.status_code} - {polling_response.text}")
                raise Exception(f"Failed to get transcription status: {polling_response.status_code}")
                
            status = polling_response.json()["status"]
            
            if status == "completed":
                return polling_response.json()["text"]
            elif status == "error":
                error = polling_response.json().get("error", "Unknown error")
                raise Exception(f"Transcription failed: {error}")
            
            # Wait for 1 second before polling again
            import time
            time.sleep(1)
            
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}")
        raise Exception(f"Failed to transcribe audio: {str(e)}")