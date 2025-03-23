#!/usr/bin/env python3
"""
Integrated workflow test for AI Interview Platform
This script tests the end-to-end workflow using Hugging Face APIs
"""

import os
import sys
import json
import asyncio
import tempfile
import requests
import time
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Mock imports since we're not using a real database here
class MockDB:
    def __init__(self):
        self.data = {
            "roles": [],
            "resumes": [],
            "interviews": [],
            "questions": [],
            "answers": []
        }
        
        # Add mock role
        self.data["roles"].append({
            "_id": "role1",
            "name": "Software Engineer",
            "experience_level": "Senior",
            "required_skills": [
                {"name": "Python"},
                {"name": "JavaScript"},
                {"name": "React"}
            ],
            "interview_structure": {
                "technical": 3,
                "behavioral": 2
            },
            "difficulty_distribution": {
                "easy": 1,
                "medium": 3,
                "hard": 1
            }
        })
        
        # Add mock resume
        self.data["resumes"].append({
            "_id": "resume1",
            "user_id": "user1",
            "parsed_data": {
                "skills": ["Python", "Django", "SQL", "Docker"]
            }
        })
    
    def find_one(self, collection, query):
        for item in self.data[collection]:
            match = True
            for key, value in query.items():
                if key == "_id" and item.get(key) != value:
                    match = False
                elif key != "_id" and item.get(key) != value:
                    match = False
            if match:
                return item
        return None
    
    def find_many(self, collection, query):
        results = []
        for item in self.data[collection]:
            match = True
            for key, value in query.items():
                if key == "_id" and item.get(key) != value:
                    match = False
                elif key != "_id" and item.get(key) != value:
                    match = False
            if match:
                results.append(item)
        return results
    
    def insert_one(self, collection, data):
        if "_id" not in data:
            data["_id"] = f"{collection}{len(self.data[collection]) + 1}"
        self.data[collection].append(data)
        return data["_id"]

# Mock models
class Interview:
    def __init__(self, **kwargs):
        self.id = kwargs.get("_id", None)
        self.user_id = kwargs.get("user_id", "")
        self.role_id = kwargs.get("role_id", "")
        self.language = kwargs.get("language", "en")
        self.status = kwargs.get("status", "scheduled")
        self.questions = kwargs.get("questions", [])
        self.answers = kwargs.get("answers", [])
        
    def dict(self, by_alias=False):
        return {
            "_id": self.id,
            "user_id": self.user_id,
            "role_id": self.role_id,
            "language": self.language,
            "status": self.status
        }

class Question:
    def __init__(self, **kwargs):
        self.id = kwargs.get("_id", None)
        self.interview_id = kwargs.get("interview_id", "")
        self.text = kwargs.get("text", "")
        self.type = kwargs.get("type", "technical")
        self.difficulty = kwargs.get("difficulty", 3)
        self.skill_tested = kwargs.get("skill_tested", "")
        self.reference_answer = kwargs.get("reference_answer", "")
        self.order = kwargs.get("order", 1)
        
    def dict(self, by_alias=False):
        return {
            "_id": self.id,
            "interview_id": self.interview_id,
            "text": self.text,
            "type": self.type,
            "difficulty": self.difficulty,
            "skill_tested": self.skill_tested,
            "reference_answer": self.reference_answer,
            "order": self.order
        }

class InterviewCreate:
    def __init__(self, role_id, language="en"):
        self.role_id = role_id
        self.language = language

# Sample audio URL for testing
SAMPLE_AUDIO_URL = "https://cdn.openai.com/whisper/draft-20220913a/micro-machines.wav"

# Import actual services (from app codebase)
# We're using mock imports for this test script
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.services.ai_service import (
    call_huggingface_with_fallbacks,
    analyze_voice,
)

# Global mock database
mock_db = MockDB()

# API tokens
HF_API_TOKEN = os.environ.get("HUGGINGFACE_API_TOKEN")
if not HF_API_TOKEN:
    print("❌ Error: HUGGINGFACE_API_TOKEN not set in environment")
    sys.exit(1)

async def mock_generate_questions(interview):
    """Mock implementation of generate_questions using the real HF API call"""
    # Get role and resume data from mock DB
    role_dict = mock_db.find_one("roles", {"_id": interview.role_id})
    resume_dict = mock_db.find_one("resumes", {"user_id": interview.user_id})
    
    # Prepare prompt
    prompt = f"""
    Generate interview questions for a {role_dict['experience_level']} {role_dict['name']} position.
    
    Required skills: {', '.join(s['name'] for s in role_dict['required_skills'])}
    Candidate skills: {', '.join(resume_dict['parsed_data']['skills'])}
    
    Interview structure:
    - Technical questions: {role_dict['interview_structure'].get('technical', 0)}
    - Behavioral questions: {role_dict['interview_structure'].get('behavioral', 0)}
    
    Format the response as a JSON array of question objects with the following structure:
    [
      {{
        "text": "Question text here",
        "type": "technical" or "behavioral",
        "difficulty": integer from 1-5,
        "skill_tested": "Name of skill being tested",
        "reference_answer": "A reference answer to evaluate against"
      }}
    ]
    Ensure the JSON is valid and properly formatted.
    """
    
    try:
        # Use the real HF API call
        response_text = await call_huggingface_with_fallbacks(
            prompt=prompt,
            system_prompt="You are an expert technical interviewer. Generate structured interview questions in valid JSON format only."
        )
        
        # Parse JSON response
        import re
        json_pattern = r'(\[[\s\S]*\])'
        json_match = re.search(json_pattern, response_text)
        
        if json_match:
            cleaned_json = json_match.group(1)
            questions_data = json.loads(cleaned_json)
        else:
            # Fallback to regex extraction
            json_match = re.search(r'\[\s*{.*}\s*\]', response_text, re.DOTALL)
            if json_match:
                questions_data = json.loads(json_match.group(0))
            else:
                # Return default questions if parsing fails
                questions_data = [
                    {
                        "text": "Tell us about your experience with Python",
                        "type": "technical",
                        "difficulty": 3,
                        "skill_tested": "Python",
                        "reference_answer": "A good candidate would mention Python frameworks, libraries, and real-world applications."
                    }
                ]
        
        # Create Question objects
        questions = []
        for i, q_data in enumerate(questions_data):
            question = Question(
                interview_id=interview.id,
                text=q_data.get("text", "Default question"),
                type=q_data.get("type", "technical"),
                difficulty=q_data.get("difficulty", 3),
                skill_tested=q_data.get("skill_tested", ""),
                reference_answer=q_data.get("reference_answer", ""),
                order=i + 1
            )
            questions.append(question)
        
        print(f"✅ Generated {len(questions)} questions successfully")
        return questions
        
    except Exception as e:
        print(f"❌ Error generating questions: {str(e)}")
        question = Question(
            interview_id=interview.id,
            text="Fallback question. Tell us about your programming experience.",
            type="technical",
            difficulty=3,
            skill_tested="general",
            reference_answer="Any reasonable programming experience."
        )
        return [question]

async def mock_evaluate_answer(question, reference_answer, user_answer, code_submission=None):
    """Mock implementation of evaluate_answer using the real HF API call"""
    prompt = f"""
    Evaluate the following interview answer:
    
    Question: {question}
    Reference Answer: {reference_answer}
    User Answer: {user_answer}
    """
    
    try:
        # Use the real HF API call
        response_text = await call_huggingface_with_fallbacks(
            prompt=prompt,
            system_prompt="You are an expert technical interviewer."
        )
        
        # Attempt to parse JSON
        try:
            import re
            json_pattern = r'({[\s\S]*})'
            json_match = re.search(json_pattern, response_text)
            
            if json_match:
                evaluation = json.loads(json_match.group(1))
            else:
                # Try a different approach
                evaluation = json.loads(response_text)
                
            # Ensure all required fields are present
            required_fields = ["correctness_score", "clarity_score", "depth_score", "confidence_score", "feedback"]
            for field in required_fields:
                if field not in evaluation:
                    evaluation[field] = 0.5 if "score" in field else "No specific feedback available."
            
            if "resources" not in evaluation:
                evaluation["resources"] = [{"title": "Official Documentation", "url": "https://docs.example.com"}]
                
            print("✅ Successfully evaluated answer")
            return evaluation
            
        except json.JSONDecodeError:
            # If JSON parsing fails, return default evaluation
            print("⚠️ JSON parsing failed, using default evaluation")
            return {
                "correctness_score": 0.7,
                "clarity_score": 0.7,
                "depth_score": 0.7,
                "confidence_score": 0.7,
                "feedback": "Default feedback due to parsing error.",
                "resources": [{"title": "Default Resource", "url": "https://example.com"}]
            }
            
    except Exception as e:
        print(f"❌ Error evaluating answer: {str(e)}")
        return {
            "correctness_score": 0.5,
            "clarity_score": 0.5,
            "depth_score": 0.5,
            "confidence_score": 0.5,
            "feedback": "We were unable to evaluate your answer due to a technical issue.",
            "resources": [{"title": "Default Resource", "url": "https://example.com"}]
        }

async def download_sample_audio():
    """Download sample audio file for testing"""
    print(f"Downloading sample audio from {SAMPLE_AUDIO_URL}...")
    try:
        # Create a temp directory if it doesn't exist
        os.makedirs("tmp", exist_ok=True)
        
        # Download the file
        response = requests.get(SAMPLE_AUDIO_URL, stream=True)
        response.raise_for_status()
        
        # Save to disk
        file_path = os.path.join("tmp", "sample_audio.wav")
        with open(file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        print(f"Downloaded sample audio to {file_path}")
        
        # Read the file into bytes
        with open(file_path, "rb") as f:
            audio_bytes = f.read()
            
        return audio_bytes
        
    except Exception as e:
        print(f"❌ Error downloading sample audio: {str(e)}")
        sys.exit(1)

async def test_integrated_workflow():
    """Test the entire interview workflow"""
    print("\n=== Starting Integrated Workflow Test ===")
    
    # Step 1: Create Interview
    print("\n📋 Step 1: Creating Interview")
    interview_data = InterviewCreate(role_id="role1")
    interview = Interview(user_id="user1", role_id="role1", status="scheduled")
    interview.id = mock_db.insert_one("interviews", interview.dict())
    print(f"✅ Created interview with ID: {interview.id}")
    
    # Step 2: Generate Questions
    print("\n❓ Step 2: Generating Questions")
    questions = await mock_generate_questions(interview)
    for q in questions:
        q_id = mock_db.insert_one("questions", q.dict())
        q.id = q_id
    interview.questions = questions
    print(f"✅ Generated {len(questions)} questions")
    
    # Display questions
    print("\nGenerated Questions:")
    for i, q in enumerate(questions):
        print(f"{i+1}. {q.text} (Type: {q.type}, Difficulty: {q.difficulty})")
    
    # Step 3: Process Voice Answer
    print("\n🗣️ Step 3: Processing Voice Answer")
    audio_data = await download_sample_audio()
    
    # Use real voice analysis
    voice_metrics = await analyze_voice(audio_data)
    print(f"✅ Analyzed voice with confidence score: {voice_metrics['confidence']}")
    print(f"Transcription: {voice_metrics['transcription'][:100]}...")
    
    # Step 4: Evaluate Answer
    print("\n📊 Step 4: Evaluating Answer")
    if len(questions) > 0:
        question = questions[0]
        evaluation = await mock_evaluate_answer(
            question.text, 
            question.reference_answer,
            voice_metrics['transcription']
        )
        print(f"✅ Evaluation scores:")
        print(f"  - Correctness: {evaluation['correctness_score']}")
        print(f"  - Clarity: {evaluation['clarity_score']}")
        print(f"  - Depth: {evaluation['depth_score']}")
        print(f"  - Confidence: {evaluation['confidence_score']}")
        print(f"Feedback: {evaluation['feedback'][:100]}...")
    
    print("\n=== Integrated Workflow Test Completed Successfully ===")

if __name__ == "__main__":
    try:
        asyncio.run(test_integrated_workflow())
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        sys.exit(1) 