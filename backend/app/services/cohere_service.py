from typing import Dict, List, Optional
import cohere
from app.core.config import settings
from app.models.analysis import QuestionForAnalysis
import logging

# Set up logging
logger = logging.getLogger(__name__)

class CohereService:
    def __init__(self):
        if not settings.COHERE_API_KEY:
            logger.warning("COHERE_API_KEY not set. Analysis will be limited.")
            self.client = None
        else:
            try:
                logger.debug("Initializing Cohere client")
                self.client = cohere.Client(settings.COHERE_API_KEY)
                logger.debug("Cohere client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Cohere client: {str(e)}", exc_info=True)
                self.client = None
        
    async def analyze_answer(self, question: QuestionForAnalysis, answer: str) -> Dict:
        """
        Analyze the answer using Cohere's rerank and generate models for better feedback
        """
        if not self.client:
            logger.warning("No Cohere client available, returning default analysis")
            return {
                "score": 50,
                "feedback": "Analysis service is currently unavailable. Please try again later.",
                "comments": [],
                "suggestions": [],
                "sentiment": {
                    "score": 0.5,
                    "label": "NEUTRAL"
                },
                "improvement_points": []
            }

        try:
            logger.debug(f"Starting analysis for question: {question.text}")
            logger.debug(f"Answer length: {len(answer)} characters")
            
            # Prepare the question context
            question_context = f"Question: {question.text}\n"
            if question.context:
                question_context += f"Context: {question.context}\n"
            if question.expected_points:
                question_context += f"Expected points to cover: {', '.join(question.expected_points)}\n"
            
            # Use rerank to evaluate answer relevance
            logger.debug("Calling Cohere rerank")
            rerank_results = self.client.rerank(
                query=question_context,
                documents=[answer],
                top_n=1,
                model='rerank-english-v2.0'
            )
            logger.debug(f"Rerank results: {rerank_results}")
            
            # Generate detailed feedback using Cohere's generate model
            prompt = f"""
            Question: {question.text}
            Context: {question.context if question.context else 'No additional context provided'}
            Expected points: {', '.join(question.expected_points) if question.expected_points else 'No specific points required'}
            Answer: {answer}
            
            Please provide detailed feedback on this interview answer. Consider:
            1. Content relevance and completeness
            2. Technical accuracy
            3. Clarity and structure
            4. Areas for improvement
            5. Specific suggestions
            
            Format the feedback in a clear, constructive manner.
            """
            
            logger.debug("Calling Cohere generate")
            generate_response = self.client.generate(
                prompt=prompt,
                max_tokens=500,
                temperature=0.7,
                k=0,
                stop_sequences=[],
                return_likelihoods='NONE'
            )
            logger.debug(f"Generate response: {generate_response}")
            
            # Extract feedback from generation
            feedback = generate_response.generations[0].text.strip()
            
            # Calculate score based on rerank result
            relevance_score = rerank_results.results[0].relevance_score if rerank_results.results else 0.5
            score = int(relevance_score * 100)  # Convert to percentage
            
            # Generate improvement points
            improvement_prompt = f"""
            Based on this answer: {answer}
            
            List 3 specific improvement points. Format each point as a clear, actionable suggestion.
            """
            
            improvement_response = self.client.generate(
                prompt=improvement_prompt,
                max_tokens=200,
                temperature=0.7,
                k=0,
                stop_sequences=[],
                return_likelihoods='NONE'
            )
            
            improvement_points = [
                point.strip() for point in improvement_response.generations[0].text.split('\n')
                if point.strip()
            ][:3]  # Limit to 3 points
            
            # Analyze sentiment
            sentiment_prompt = f"""
            Analyze the sentiment of this answer: {answer}
            
            Provide a sentiment score between 0 and 1, and a label (POSITIVE, NEGATIVE, or NEUTRAL).
            Format: score|label
            """
            
            sentiment_response = self.client.generate(
                prompt=sentiment_prompt,
                max_tokens=20,
                temperature=0.3,
                k=0,
                stop_sequences=['\n'],
                return_likelihoods='NONE'
            )
            
            try:
                sentiment_text = sentiment_response.generations[0].text.strip()
                sentiment_score, sentiment_label = sentiment_text.split('|')
                sentiment = {
                    "score": float(sentiment_score),
                    "label": sentiment_label.strip()
                }
            except:
                sentiment = {
                    "score": 0.5,
                    "label": "NEUTRAL"
                }
            
            result = {
                "score": score,
                "feedback": feedback,
                "comments": [feedback],  # Use the main feedback as the primary comment
                "suggestions": improvement_points,
                "sentiment": sentiment,
                "improvement_points": improvement_points
            }
            logger.debug(f"Analysis result: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error in Cohere analysis: {str(e)}", exc_info=True)
            return {
                "score": 50,
                "feedback": "Unable to analyze answer at this time. Please try again.",
                "comments": [],
                "suggestions": [],
                "sentiment": {
                    "score": 0.5,
                    "label": "NEUTRAL"
                },
                "improvement_points": []
            }
    
    def _calculate_completeness(self, question: QuestionForAnalysis, answer: str) -> float:
        """Calculate how well the answer covers expected points"""
        if not question.expected_points:
            return 0.8  # Default score if no points specified
            
        # Use Cohere's embed model to compare answer with expected points
        embeddings = self.client.embed(
            texts=[answer] + question.expected_points,
            model='embed-english-v3.0'
        )
        
        # Calculate similarity between answer and each expected point
        answer_embedding = embeddings.embeddings[0]
        point_embeddings = embeddings.embeddings[1:]
        
        similarities = [
            self._cosine_similarity(answer_embedding, point_embedding)
            for point_embedding in point_embeddings
        ]
        
        return sum(similarities) / len(similarities)
    
    def _analyze_technical_accuracy(self, question: QuestionForAnalysis, answer: str) -> float:
        """Analyze technical accuracy of the answer"""
        prompt = f"""
        Question: {question.text}
        Answer: {answer}
        
        Rate the technical accuracy of this answer on a scale of 0 to 1.
        Consider:
        - Use of correct technical terminology
        - Accuracy of technical concepts
        - Depth of technical understanding
        - Practical application of knowledge
        
        Provide only a number between 0 and 1.
        """
        
        response = self.client.generate(
            prompt=prompt,
            max_tokens=10,
            temperature=0.1,
            k=0,
            stop_sequences=['\n']
        )
        
        try:
            return float(response.generations[0].text.strip())
        except:
            return 0.5
    
    def _analyze_clarity(self, answer: str) -> float:
        """Analyze clarity and structure of the answer"""
        prompt = f"""
        Answer: {answer}
        
        Rate the clarity and structure of this answer on a scale of 0 to 1.
        Consider:
        - Organization of thoughts
        - Clear explanation
        - Logical flow
        - Conciseness
        
        Provide only a number between 0 and 1.
        """
        
        response = self.client.generate(
            prompt=prompt,
            max_tokens=10,
            temperature=0.1,
            k=0,
            stop_sequences=['\n']
        )
        
        try:
            return float(response.generations[0].text.strip())
        except:
            return 0.5
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = sum(x * y for x, y in zip(vec1, vec2))
        norm1 = sum(x * x for x in vec1) ** 0.5
        norm2 = sum(x * x for x in vec2) ** 0.5
        return dot_product / (norm1 * norm2) if norm1 * norm2 != 0 else 0 