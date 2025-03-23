# AI Interview Platform Backend

The backend for the AI Interview Platform, built with FastAPI, MongoDB, and Hugging Face AI services.

## Using Free AI APIs

The AI Interview Platform has been redesigned to use free APIs for all AI functionality. This includes:

1. **Language Models**: Using Hugging Face's free inference API for generating questions and evaluating answers
2. **Speech-to-Text**: Using Hugging Face's Whisper model API for transcribing audio

### Setting Up Hugging Face Integration

Follow these steps to set up the free AI services:

1. **Create a Hugging Face account**:
   - Sign up at [huggingface.co/join](https://huggingface.co/join)
   - Verify your email address

2. **Generate an API token**:
   - Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
   - Click "New token" and give it a name (e.g., "AI Interview Platform")
   - Select "Read" access level
   - Copy the generated token

3. **Configure your application**:
   - Create a `.env` file in the backend root directory (copy from `.env.example`)
   - Add your Hugging Face token:
     ```
     HUGGINGFACE_API_TOKEN=your_token_here
     LLM_MODEL=huggingface/mistral
     SPEECH_TO_TEXT_PROVIDER=huggingface
     ```

4. **Test the integration**:
   - Run `python test_huggingface_integration.py` to verify LLM and speech-to-text functionality
   - Run `python test_integrated_workflow.py` to test the complete interview workflow

### Available Models

The application is configured to use several Hugging Face models with automatic fallback:

- **LLM Models**:
  - Mistral-7B-Instruct (default)
  - Llama-2-7b-chat
  - Gemma-7b
  - OpenChat-3.5
  - Phi-2
  - Falcon-7B

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