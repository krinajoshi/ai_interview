import os
import logging
from typing import Dict, List, Optional
import cohere
from ..core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Initialize Cohere client
try:
    co = cohere.Client(settings.COHERE_API_KEY)
    logger.info("Cohere client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Cohere client: {str(e)}")
    co = None

async def analyze_sentiment(text: str) -> Dict:
    """
    Analyze sentiment of text using Cohere API
    
    Args:
        text: The text to analyze
        
    Returns:
        Dict containing sentiment analysis results
    """
    try:
        if not co:
            logger.warning("Cohere client not initialized, returning mock sentiment")
            return {
                "sentiment": "neutral",
                "confidence": 0.7,
                "emotions": {
                    "neutral": 0.7,
                    "positive": 0.2,
                    "negative": 0.1
                }
            }
            
        # Call Cohere API for sentiment analysis
        response = co.classify(
            model='large',
            inputs=[text],
            examples=[
                {"text": "I really enjoyed this interview experience", "label": "positive"},
                {"text": "The questions were challenging but fair", "label": "positive"},
                {"text": "I'm not sure if I answered that correctly", "label": "neutral"},
                {"text": "This was a terrible experience", "label": "negative"},
                {"text": "I struggled with most of the questions", "label": "negative"}
            ]
        )
        
        # Extract sentiment from response
        classification = response.classifications[0]
        sentiment = classification.prediction
        confidence = classification.confidence
        
        # Create emotion mapping
        emotions = {
            "positive": 0.0,
            "neutral": 0.0,
            "negative": 0.0
        }
        
        # Set the predicted sentiment with its confidence
        emotions[sentiment] = confidence
        
        # Distribute remaining confidence among other emotions
        remaining = 1.0 - confidence
        other_emotions = [e for e in emotions.keys() if e != sentiment]
        for emotion in other_emotions:
            emotions[emotion] = remaining / len(other_emotions)
            
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "emotions": emotions
        }
        
    except Exception as e:
        logger.error(f"Error analyzing sentiment with Cohere: {str(e)}")
        # Return a default sentiment analysis
        return {
            "sentiment": "neutral",
            "confidence": 0.5,
            "emotions": {
                "neutral": 0.5,
                "positive": 0.3,
                "negative": 0.2
            }
        }

async def analyze_text_complexity(text: str) -> Dict:
    """
    Analyze the complexity of text using Cohere API
    
    Args:
        text: The text to analyze
        
    Returns:
        Dict containing complexity analysis results
    """
    try:
        if not co:
            logger.warning("Cohere client not initialized, returning mock complexity")
            return {
                "complexity_level": "medium",
                "readability_score": 0.65,
                "vocabulary_diversity": 0.5,
                "sentence_complexity": 0.6
            }
            
        # For now, we'll use a simple heuristic approach
        # In a production environment, you would use Cohere's more advanced features
        
        # Calculate basic metrics
        words = text.split()
        sentences = text.split('.')
        avg_words_per_sentence = len(words) / max(len(sentences), 1)
        unique_words = len(set(word.lower() for word in words))
        vocabulary_diversity = unique_words / max(len(words), 1)
        
        # Determine complexity level
        if avg_words_per_sentence > 20 and vocabulary_diversity > 0.7:
            complexity_level = "high"
            readability_score = 0.8
        elif avg_words_per_sentence > 12 and vocabulary_diversity > 0.5:
            complexity_level = "medium"
            readability_score = 0.6
        else:
            complexity_level = "low"
            readability_score = 0.4
            
        # Calculate sentence complexity
        long_words = sum(1 for word in words if len(word) > 6)
        sentence_complexity = long_words / max(len(words), 1)
            
        return {
            "complexity_level": complexity_level,
            "readability_score": readability_score,
            "vocabulary_diversity": vocabulary_diversity,
            "sentence_complexity": sentence_complexity
        }
        
    except Exception as e:
        logger.error(f"Error analyzing text complexity: {str(e)}")
        # Return a default complexity analysis
        return {
            "complexity_level": "medium",
            "readability_score": 0.5,
            "vocabulary_diversity": 0.5,
            "sentence_complexity": 0.5
        }

async def detect_language(text: str) -> Dict:
    """
    Detect the language of text using Cohere API
    
    Args:
        text: The text to analyze
        
    Returns:
        Dict containing language detection results
    """
    try:
        if not co:
            logger.warning("Cohere client not initialized, returning mock language detection")
            return {
                "language": "en",
                "confidence": 0.9,
                "name": "English"
            }
            
        # Call Cohere API for language detection
        response = co.detect_language([text])
        
        # Extract language from response
        language_code = response.results[0].language_code
        language_name = response.results[0].language_name
        
        return {
            "language": language_code,
            "name": language_name,
            "confidence": 0.9  # Cohere doesn't provide confidence, so we use a default
        }
        
    except Exception as e:
        logger.error(f"Error detecting language with Cohere: {str(e)}")
        # Return a default language detection
        return {
            "language": "en",
            "name": "English",
            "confidence": 0.7
        }