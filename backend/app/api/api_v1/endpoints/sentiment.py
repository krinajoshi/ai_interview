from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

router = APIRouter()

HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment"
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")

class SentimentRequest(BaseModel):
    text: str
    question: Optional[str] = None

class AnalysisResponse(BaseModel):
    sentiment: Dict[str, Any]
    feedback: List[str]
    improvement_points: List[str]
    score: int
    rating_explanation: str

def get_rating_explanation(star_rating: int) -> str:
    explanations = {
        1: "The answer missed the point of the question entirely or was otherwise wholly inadequate",
        2: "A poor or incomplete answer that nonetheless contained good points",
        3: "A basically adequate answer that hit the key points of the question, but which goes no further",
        4: "A strong answer that goes beyond the basic requirements of the question",
        5: "An excellent answer that is exactly what you're looking for"
    }
    return explanations.get(star_rating, "Rating explanation not available")

def analyze_content_quality(text: str, question: Optional[str] = None) -> Dict[str, Any]:
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
    
    # Check for question relevance if question is provided
    question_relevance = 0.0
    if question:
        # Extract key terms from question (excluding common stop words)
        stop_words = {'what', 'when', 'where', 'who', 'why', 'how', 'is', 'are', 'was', 'were', 'do', 'does', 'did',
                     'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        question_terms = set(word.lower() for word in question.split() if word.lower() not in stop_words)
        answer_terms = set(word.lower() for word in text.split() if word.lower() not in stop_words)
        
        if question_terms:
            matching_terms = question_terms.intersection(answer_terms)
            question_relevance = len(matching_terms) / len(question_terms)
    
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
            feedback = ["Your response contains unclear, repetitive, or non-meaningful content"]
            improvement_points = [
                "Please provide a clear and professional response",
                "Use complete sentences and proper words",
                "Avoid repetition and nonsensical combinations of letters"
            ]
            return {
                "feedback": feedback,
                "improvement_points": improvement_points,
                "quality_score": 1  # Force a low score for gibberish
            }
        
        # Check question relevance
        if question and quality_metrics["question_relevance"] < 0.3:
            improvement_points.append("Your response doesn't seem to address the question directly")
            quality_score = 2  # Low score for irrelevant answers
        else:
            quality_score = 3  # Start with neutral score
        
        # Check sentence structure
        if quality_metrics["sentence_count"] < 2:
            improvement_points.append("Provide a more detailed response with multiple sentences")
            quality_score = min(quality_score, 2)
        elif quality_metrics["avg_sentence_length"] < 5:
            improvement_points.append("Your sentences are very short. Try to elaborate more")
            quality_score = min(quality_score, 2)
        elif quality_metrics["avg_sentence_length"] > 25:
            improvement_points.append("Consider breaking down long sentences for better clarity")
        
        # Check for specific examples and metrics
        has_numbers = any(char.isdigit() for char in text)
        has_specific_examples = any(keyword in text.lower() for keyword in [
            "for example", "instance", "specifically", "when i", "during",
            "such as", "like", "particularly"
        ])
        
        # Check for STAR method components with expanded keywords
        has_situation = any(keyword in text.lower() for keyword in [
            "situation", "context", "when", "during", "while", "at the time",
            "background", "scenario", "case"
        ])
        has_task = any(keyword in text.lower() for keyword in [
            "task", "goal", "objective", "needed to", "had to", "responsible for",
            "assignment", "project", "challenge"
        ])
        has_action = any(keyword in text.lower() for keyword in [
            "i did", "implemented", "created", "developed", "managed", "handled",
            "coordinated", "led", "organized", "executed", "solved"
        ])
        has_result = any(keyword in text.lower() for keyword in [
            "result", "outcome", "achieved", "improved", "increased", "decreased",
            "impact", "success", "benefit", "accomplishment"
        ])
        
        # Calculate quality score based on content analysis
        if quality_metrics["has_meaningful_structure"]:
            quality_score += 1
            feedback.append("Your response shows good structure and flow")
        
        if has_numbers and has_specific_examples:
            quality_score += 1
            feedback.append("Strong use of specific examples and metrics")
        elif has_specific_examples:
            feedback.append("Good use of specific examples")
            improvement_points.append("Consider including quantifiable metrics to strengthen your examples")
        elif has_numbers:
            feedback.append("Good use of quantifiable metrics")
            improvement_points.append("Consider providing more specific examples to context your metrics")
        else:
            improvement_points.append("Include specific examples and metrics to support your points")
            quality_score -= 1

        # STAR method feedback
        star_components = [has_situation, has_task, has_action, has_result]
        star_count = sum(star_components)
        if star_count == 4:
            quality_score += 1
            feedback.append("Excellent use of the STAR method, covering all components")
        elif star_count >= 2:
            feedback.append("Partial use of the STAR method detected")
            missing_components = []
            if not has_situation: missing_components.append("situation")
            if not has_task: missing_components.append("task")
            if not has_action: missing_components.append("action")
            if not has_result: missing_components.append("result")
            improvement_points.append(f"Complete the STAR method by adding the {' and '.join(missing_components)} components")
        else:
            quality_score -= 1
            improvement_points.append("Structure your answer using the STAR method (Situation, Task, Action, Result)")

        # Confidence level feedback
        if confidence_level > 0.8:
            feedback.append(f"Your response demonstrates strong confidence ({confidence_level:.0%})")
        elif confidence_level > 0.6:
            feedback.append(f"Your confidence level is good ({confidence_level:.0%})")
        else:
            improvement_points.append(f"Work on conveying more confidence in your response (current level: {confidence_level:.0%})")
            quality_score -= 1

        # Ensure quality score stays within bounds
        quality_score = max(1, min(5, quality_score))

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

        text = request.text.strip()
        question = request.question.strip() if request.question else None

        if not text:
            return {
                "sentiment": {"label": "NEUTRAL", "score": 0.5},
                "feedback": ["No text provided for analysis"],
                "improvement_points": ["Please provide some text to analyze"],
                "score": 1,
                "rating_explanation": get_rating_explanation(1)
            }

        # First analyze content quality
        quality_metrics = analyze_content_quality(text, question)
        logger.info(f"Content quality metrics: {quality_metrics}")

        # If content is detected as gibberish or has excessive repetition, return early with low score
        if quality_metrics["has_gibberish"] or quality_metrics["excessive_repetition"]:
            return {
                "sentiment": {"label": "NEGATIVE", "score": 0.2},
                "feedback": ["Your response appears to be unclear, repetitive, or contains non-meaningful content"],
                "improvement_points": [
                    "Please provide a clear and professional response",
                    "Use complete sentences and proper words",
                    "Avoid repetition and nonsensical combinations of letters"
                ],
                "score": 1,
                "rating_explanation": get_rating_explanation(1)
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
                    "rating_explanation": get_rating_explanation(final_score)
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
            "rating_explanation": "Unable to provide accurate rating due to analysis error"
        } 