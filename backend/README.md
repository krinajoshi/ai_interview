# AI Interview Platform Backend

The backend for the AI Interview Platform, built with FastAPI, MongoDB, and multiple AI services for comprehensive interview analysis.

## Using AI Services

The AI Interview Platform uses multiple AI services for different aspects of the interview process:

1. **Language Models**: Using Hugging Face's free inference API for generating questions and evaluating answers
2. **Speech-to-Text**: Using Hugging Face's Whisper model API for transcribing audio
3. **Content Analysis**: Using Cohere's AI models for semantic answer evaluation
4. **Sentiment Analysis**: Using Hugging Face's sentiment analysis model for response evaluation

### Setting Up AI Service Integration

Follow these steps to set up all required AI services:

1. **Set up Hugging Face**:
   - Sign up at [huggingface.co/join](https://huggingface.co/join)
   - Generate an API token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Select "Read" access level

2. **Set up Cohere**:
   - Sign up at [cohere.com/sign-up](https://cohere.com/sign-up)
   - Generate an API key from your dashboard
   - Copy the API key for configuration

3. **Configure your application**:
   - Create a `.env` file in the backend root directory (copy from `.env.example`)
   - Add your API tokens:
     ```
     HUGGING_FACE_TOKEN=your_huggingface_token
     COHERE_API_KEY=your_cohere_api_key
     LLM_MODEL=huggingface/mistral
     SPEECH_TO_TEXT_PROVIDER=huggingface
     ```

4. **Test the integration**:
   - Run `python test_ai_integration.py` to verify all AI services
   - Run `python test_integrated_workflow.py` to test the complete interview workflow

### Answer Analysis System

The platform now features a sophisticated answer analysis system that combines multiple AI models:

#### Content Relevance Analysis
- Uses Cohere's embedding model for semantic similarity
- Employs reranking for detailed content matching
- Provides specific feedback on relevant and missing points
- Identifies off-topic content

#### Quality Assessment
- Detects unclear or nonsensical responses
- Analyzes sentence structure and complexity
- Checks for excessive repetition
- Evaluates answer completeness

#### Feedback Generation
- Provides point-by-point feedback on strengths
- Lists specific areas for improvement
- Gives honest, direct suggestions
- Includes detailed content analysis

### Available Models

The application uses several AI models for different purposes:

- **LLM Models** (Question Generation):
  - Mistral-7B-Instruct (default)
  - Llama-2-7b-chat
  - Gemma-7b
  - OpenChat-3.5
  - Phi-2
  - Falcon-7B

- **Sentiment Analysis**:
  - bert-base-multilingual-uncased-sentiment

- **Content Analysis**:
  - Cohere Embed v3.0
  - Cohere Rerank v2.0
  - Cohere Generate

- **Speech-to-Text Models**:
  - Whisper Large V3
  - Assembly AI (optional fallback)

The system will automatically select the appropriate model format and will try alternative models if the primary one fails.

## Getting Started

1. Clone the repository
2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and configure your environment variables
5. Start MongoDB (install if needed)
6. Run the development server:
   ```
   uvicorn app.main:app --reload
   ```

## API Documentation

Once the server is running, you can access the OpenAPI documentation at:
- http://localhost:8000/docs
- http://localhost:8000/redoc

## Recent Technical Changes

### Authentication Enhancements

The authentication system has been enhanced with improved error handling:

- Added fallback user creation for testing purposes when MongoDB connection fails
- Enhanced logging in the JWT verification process
- Fixed user retrieval from database with proper ID comparison

### Legacy API Support

Added backward compatibility for the frontend with new endpoints:

- **POST** `/api/v1/interview/generate-questions` - Legacy endpoint for generating interview questions
- Question format has been standardized to support multi-language text with the structure:
  ```json
  {
    "id": "string",
    "text": {
      "en": "English question text",
      "fr": "French question text",
      "ar": "Arabic question text"
    },
    "type": "behavioral"
  }
  ```

### Temporary Role Handling

Implemented automatic creation of temporary roles when needed:

- Uses proper `ObjectId` generation from the `bson` package
- Creates roles with sensible defaults based on the job title
- Properly handles role ID conversion between string and ObjectId formats

### Fallback Question Generation

Enhanced the question generation system with reliable fallbacks:

- Simple predefined questions when AI services are unavailable
- Questions are formatted to match frontend expectations
- Extensive error handling and logging during the generation process

### CORS Configuration

Fixed Cross-Origin Resource Sharing to allow frontend-backend communication:

- Added proper CORS middleware configuration
- Allowed specific origins (localhost:3000)
- Configured allowed methods, headers, and credentials

### Answer Analysis Enhancements

The answer analysis system has been significantly improved:

- **Semantic Understanding**: 
  - Implemented dual-model approach using embeddings and reranking
  - Added detailed content relevance checking
  - Improved accuracy of feedback generation

- **Quality Assessment**:
  - Enhanced gibberish detection
  - Added response structure analysis
  - Implemented better scoring system

- **Feedback System**:
  - More specific and actionable feedback
  - Point-by-point analysis of responses
  - Clearer improvement suggestions

## Troubleshooting

### Common Issues and Solutions

- **MongoDB Connection Failures**: The system will create a dummy user for testing. Check your MongoDB connection string and ensure the database is running.
  
- **401 Unauthorized Errors**: Check that you're properly sending the JWT token in the Authorization header. The token should be prefixed with "Bearer ".

- **500 Internal Server Errors**: Check the server logs for detailed error messages. Most common causes are:
  - MongoDB connection issues
  - Invalid ObjectId formats
  - Missing environment variables

- **CORS Errors**: If you see CORS-related errors in the browser console, verify the CORS configuration in `main.py` matches your frontend URL.

- **Invalid Question Format**: If the frontend reports invalid question format, check the server logs to see the exact format being sent. Ensure it includes `id`, `text` (as an object), and `type` fields.

## Running Tests

```
pytest
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 