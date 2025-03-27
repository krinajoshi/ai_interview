from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
import logging
import re
import cohere
import asyncio
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment"
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")
COHERE_API_KEY = os.getenv("COHERE_API_KEY")

# Initialize Cohere client
try:
    co = cohere.Client(COHERE_API_KEY)
    logger.info("Cohere client initialized successfully")
except Exception as e:
    logger.error(f"Error initializing Cohere client: {str(e)}")
    co = None

class SentimentRequest(BaseModel):
    text: str
    question: Optional[str] = None
    transcription: Optional[str] = None

class AnalysisResponse(BaseModel):
    sentiment: Dict[str, Any]
    feedback: List[str]
    improvement_points: List[str]
    score: int
    rating_explanation: str
    content_analysis: Optional[Dict[str, Any]] = None

def get_rating_explanation(star_rating: int) -> str:
    explanations = {
        1: "The answer missed the point of the question entirely or was otherwise wholly inadequate",
        2: "A poor or incomplete answer that nonetheless contained good points",
        3: "A basically adequate answer that hit the key points of the question, but which goes no further",
        4: "A strong answer that goes beyond the basic requirements of the question",
        5: "An excellent answer that is exactly what you're looking for"
    }
    return explanations.get(star_rating, "Rating explanation not available")

async def check_content_relevance(text: str, question: str) -> Dict[str, Any]:
    """
    Use Cohere to check content relevance between question and answer
    """
    try:
        if not co or not COHERE_API_KEY:
            logger.error("Cohere client not initialized or API key missing")
            return {
                "relevance_score": 0.0,
                "is_relevant": False,
                "error": "Content relevance check unavailable"
            }

        # First, get embeddings to compare semantic similarity
        embeddings = co.embed(
            texts=[question, text],
            model='embed-english-v3.0',
            input_type='search_document'
        ).embeddings

        # Calculate cosine similarity between question and answer embeddings
        similarity = sum(a * b for a, b in zip(embeddings[0], embeddings[1])) / (
            (sum(a * a for a in embeddings[0]) ** 0.5) *
            (sum(b * b for b in embeddings[1]) ** 0.5)
        )

        # Then use rerank for more detailed analysis
        rerank_results = co.rerank(
            query=question,
            documents=[text],
            model='rerank-english-v2.0',
            top_n=1
        )

        relevance_score = rerank_results[0].relevance_score
        
        # Combine both scores for better accuracy
        combined_score = (similarity + relevance_score) / 2
        
        # Get detailed feedback using Cohere's generate
        feedback_prompt = f'''Analyze how well this answer addresses the question. Be direct and honest.
Question: {question}
Answer: {text}
Provide a JSON with these fields:
- relevant_points: list of points that directly address the question
- missing_points: list of expected points that were not addressed
- off_topic_content: list of content that wasn't relevant to the question
'''

        feedback_response = co.generate(
            prompt=feedback_prompt,
            max_tokens=300,
            temperature=0.1,
            format='json'
        )

        try:
            content_feedback = json.loads(feedback_response.generations[0].text)
        except:
            content_feedback = {
                "relevant_points": [],
                "missing_points": ["Unable to analyze specific points"],
                "off_topic_content": []
            }

        logger.info(f"Content relevance score: {combined_score}")
        logger.info(f"Content feedback: {content_feedback}")
        
        return {
            "relevance_score": combined_score,
            "is_relevant": combined_score > 0.6,
            "similarity_score": similarity,
            "rerank_score": relevance_score,
            "feedback": content_feedback,
            "error": None
        }
    except Exception as e:
        logger.error(f"Error in content relevance check: {str(e)}")
        return {
            "relevance_score": 0.0,
            "is_relevant": False,
            "error": str(e)
        }

def analyze_content_quality(text: str, question: Optional[str] = None, relevance_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Analyze the quality of the content"""
    # Check for common gibberish patterns
    gibberish_patterns = [
        r'(\w)\1{3,}',  # Repeated characters (e.g., 'aaaa')
        r'[^\s\w\d.,!?-]+',  # Non-standard characters
        r'\b\w{1,2}\b\s*(?:\b\w{1,2}\b\s*){3,}',  # Multiple very short words in sequence
        r'(?:[bcdfghjklmnpqrstvwxz]{4,})|(?:[aeiou]{4,})'  # Unlikely consonant/vowel sequences
    ]
    
    has_gibberish = any(re.search(pattern, text.lower(), re.IGNORECASE) for pattern in gibberish_patterns)
    
    # Check for meaningful word patterns
    meaningful_patterns = [
        r'\b(because|therefore|however|additionally|furthermore|moreover|specifically|for example)\b',
        r'\b(i think|in my opinion|based on|according to)\b',
        r'\b(first|second|third|finally|lastly)\b'
    ]
    
    has_meaningful_structure = any(re.search(pattern, text.lower(), re.IGNORECASE) for pattern in meaningful_patterns)
    
    # Check for sentence structure
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    avg_sentence_length = sum(len(s.split()) for s in sentences) / len(sentences) if sentences else 0
    
    # Use Cohere's relevance score if available
    question_relevance = relevance_data.get("relevance_score", 0.5) if relevance_data else 0.0
    is_relevant = relevance_data.get("is_relevant", True) if relevance_data else True
    
    # Check for word repetition
    words = text.lower().split()
    word_freq = {}
    for word in words:
        if len(word) > 3:  # Only check words longer than 3 characters
            word_freq[word] = word_freq.get(word, 0) + 1
    
    excessive_repetition = any(count > 3 for count in word_freq.values())
    
    return {
        "has_gibberish": has_gibberish,
        "has_meaningful_structure": has_meaningful_structure,
        "avg_sentence_length": avg_sentence_length,
        "sentence_count": len(sentences),
        "question_relevance": question_relevance,
        "is_relevant": is_relevant,
        "excessive_repetition": excessive_repetition,
        "word_count": len(words)
    }

def analyze_answer_content(text: str, confidence_level: float, quality_metrics: Dict[str, Any], question: Optional[str] = None) -> Dict[str, List[str]]:
    """Analyze the content of the answer for specific characteristics"""
    try:
        feedback = []
        improvement_points = []
        
        # First check for gibberish or low-quality content
        if quality_metrics["has_gibberish"] or quality_metrics["excessive_repetition"]:
            return {
                "feedback": ["Your response contains unclear or nonsensical content"],
                "improvement_points": [
                    "Please provide a clear and professional response",
                    "Use proper language and complete sentences",
                    "Structure your answer to address the question"
                ],
                "quality_score": 1
            }

        # Start with content relevance analysis
        quality_score = 3  # Default neutral score
        
        if question:
            relevance_data = quality_metrics.get("relevance_data", {})
            content_feedback = relevance_data.get("feedback", {})
            
            # Add relevant points as positive feedback
            relevant_points = content_feedback.get("relevant_points", [])
            if relevant_points:
                feedback.extend([f"✓ {point}" for point in relevant_points])
            
            # Add missing points as improvement points
            missing_points = content_feedback.get("missing_points", [])
            if missing_points:
                improvement_points.extend([f"Consider addressing: {point}" for point in missing_points])
            
            # Add off-topic content as improvement points
            off_topic = content_feedback.get("off_topic_content", [])
            if off_topic:
                improvement_points.extend([f"Remove irrelevant content about: {point}" for point in off_topic])

            # Adjust score based on relevance
            if quality_metrics["relevance_score"] < 0.4:
                quality_score = 1
                improvement_points.append("Your response does not address the question")
            elif quality_metrics["relevance_score"] < 0.6:
                quality_score = 2
                improvement_points.append("Your response only partially addresses the question")
            elif quality_metrics["relevance_score"] > 0.8:
                quality_score += 1
                feedback.append("Your response directly addresses the question")

        # Check response structure and length
        if quality_metrics["sentence_count"] < 2:
            improvement_points.append("Your response is too brief. Provide multiple sentences")
            quality_score = min(quality_score, 2)
        elif quality_metrics["avg_sentence_length"] < 5:
            improvement_points.append("Your sentences are too short. Elaborate more")
            quality_score = min(quality_score, 2)

        # Ensure we have at least one piece of feedback
        if not feedback:
            feedback.append("Response needs improvement")
        if not improvement_points:
            improvement_points.append("Add more detail and structure to your response")

        return {
            "feedback": feedback,
            "improvement_points": improvement_points,
            "quality_score": quality_score
        }
    except Exception as e:
        logger.error(f"Error in analyze_answer_content: {str(e)}")
        return {
            "feedback": ["Unable to analyze answer content in detail"],
            "improvement_points": ["Please provide a clear and professional response"],
            "quality_score": 1
        }

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_sentiment(request: SentimentRequest) -> Dict[str, Any]:
    try:
        if not HUGGING_FACE_TOKEN:
            logger.error("Hugging Face API token not configured")
            raise HTTPException(status_code=500, detail="Hugging Face API token not configured")

        if not COHERE_API_KEY:
            logger.error("Cohere API token not configured")
            raise HTTPException(status_code=500, detail="Cohere API token not configured")

        text = request.text.strip()
        question = request.question.strip() if request.question else None
        
        # Use transcription if available
        if request.transcription:
            text = request.transcription.strip()
            logger.info("Using transcription for analysis")

        if not text:
            return {
                "sentiment": {"label": "NEUTRAL", "score": 0.5},
                "feedback": ["No response provided"],
                "improvement_points": ["Please provide a response to analyze"],
                "score": 1,
                "rating_explanation": get_rating_explanation(1),
                "content_analysis": None
            }

        # Check content relevance with Cohere if question is provided
        relevance_data = None
        if question:
            relevance_data = await check_content_relevance(text, question)
            logger.info(f"Content relevance data: {relevance_data}")

        # First analyze content quality
        quality_metrics = analyze_content_quality(text, question)
        quality_metrics["relevance_data"] = relevance_data
        logger.info(f"Content quality metrics: {quality_metrics}")

        # If content is detected as gibberish, return early with low score
        if quality_metrics["has_gibberish"]:
            return {
                "sentiment": {"label": "NEGATIVE", "score": 0.2},
                "feedback": ["Your response contains unclear or nonsensical content"],
                "improvement_points": [
                    "Please provide a clear and professional response",
                    "Use proper language and complete sentences",
                    "Structure your answer to address the question"
                ],
                "score": 1,
                "rating_explanation": get_rating_explanation(1),
                "content_analysis": relevance_data
            }

        logger.info(f"Analyzing text: {text[:100]}...")
        logger.info(f"Question context: {question if question else 'No question provided'}")

        headers = {
            "Authorization": f"Bearer {HUGGING_FACE_TOKEN}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    HUGGING_FACE_API_URL,
                    json={"inputs": text},
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 503:
                    logger.warning("Model is loading, please try again in a few seconds")
                    return {
                        "sentiment": {"label": "NEUTRAL", "score": 0.5},
                        "feedback": ["The analysis model is currently loading. Please try again."],
                        "improvement_points": [],
                        "score": 3,
                        "rating_explanation": "Unable to provide accurate rating - model is loading"
                    }
                
                response.raise_for_status()
                sentiment_data = response.json()
                
                logger.info(f"Received sentiment response: {sentiment_data}")

                if not sentiment_data or not isinstance(sentiment_data, list) or not sentiment_data[0]:
                    raise ValueError("Invalid response format from sentiment analysis model")

                # Process the sentiment result
                predictions = sentiment_data[0]
                sorted_predictions = sorted(predictions, key=lambda x: x['score'], reverse=True)
                top_prediction = sorted_predictions[0]
                
                star_rating = int(top_prediction['label'].split()[0])
                normalized_score = (star_rating - 1) / 4
                confidence_level = top_prediction['score']

                # Analyze answer content with quality metrics
                content_analysis = analyze_answer_content(text, confidence_level, quality_metrics, question)
                feedback = content_analysis["feedback"]
                improvement_points = content_analysis["improvement_points"]
                quality_score = content_analysis["quality_score"]

                # Adjust star rating based on content quality
                final_score = min(star_rating, quality_score)

                # Add length-based feedback
                word_count = len(text.split())
                if word_count < 50:
                    improvement_points.append("Your response could be more detailed. Aim for at least 100 words.")
                    if final_score > 2:
                        final_score = 2  # Downgrade rating for very short answers
                elif word_count > 300:
                    feedback.append("Comprehensive response with good detail")
                    improvement_points.append("Consider being more concise while maintaining key details")

                return {
                    "sentiment": {
                        "label": "POSITIVE" if final_score >= 4 else "NEUTRAL" if final_score == 3 else "NEGATIVE",
                        "score": normalized_score,
                        "star_rating": final_score,
                        "confidence": confidence_level
                    },
                    "feedback": feedback,
                    "improvement_points": improvement_points,
                    "score": final_score,
                    "rating_explanation": get_rating_explanation(final_score),
                    "content_analysis": content_analysis
                }

            except httpx.HTTPError as e:
                logger.error(f"HTTP error occurred: {str(e)}")
                if hasattr(e, 'response'):
                    logger.error(f"Response status: {e.response.status_code}")
                    logger.error(f"Response body: {e.response.text}")
                raise HTTPException(
                    status_code=500,
                    detail="Error communicating with sentiment analysis service. Please try again."
                )

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Request text: {text[:100]}...")
        if 'sentiment_data' in locals():
            logger.error(f"Sentiment data: {sentiment_data}")
        return {
            "sentiment": {"label": "NEUTRAL", "score": 0.5},
            "feedback": ["Error during analysis. Please try again."],
            "improvement_points": ["If the error persists, try rephrasing your answer"],
            "score": 3,
            "rating_explanation": "Unable to provide accurate rating due to analysis error",
            "content_analysis": None
        } 