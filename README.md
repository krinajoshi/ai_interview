# AI Interview Platform

An intelligent interview platform that provides real-time feedback and analysis during technical interviews.

## Features

### 1. Multi-Modal Interview Responses
- Text-based answers
- Audio recording support
- Video recording support
- Real-time transcription of audio/video responses
- Multi-language support (English, French, Arabic)

### 2. AI-Powered Analysis
- Sentiment analysis of responses
- Content relevance scoring
- Quality metrics analysis
- Detailed feedback generation
- Improvement suggestions

### 3. Interview Dashboard
- View past interviews
- Access detailed analysis of each response
- Track performance over time
- Review transcriptions alongside recordings
- Score tracking and feedback history

### 4. Technical Features
- AssemblyAI integration for accurate transcription
- Real-time audio/video processing
- Secure file handling
- Responsive design
- Cross-browser compatibility

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- FFmpeg (for audio processing)
- AssemblyAI API key

### Environment Setup
1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   - Frontend (.env):
     ```
     REACT_APP_API_URL=http://localhost:8000
     ```
   - Backend (.env):
     ```
     ASSEMBLY_AI_TOKEN=your_assembly_ai_token
     ```

### Running the Application
1. Start the backend server:
   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```
2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

## Recent Updates

### Transcription Improvements
- Switched to AssemblyAI for more reliable transcription
- Added support for multiple audio formats (WAV, WebM, MP3, OGG)
- Improved error handling and retry logic
- Added transcription display in the dashboard

### Dashboard Enhancements
- Added transcription view alongside media recordings
- Improved answer sequence display
- Enhanced feedback visualization
- Better error handling and user feedback

### Technical Improvements
- Optimized audio file handling
- Added file size validation
- Improved error messages
- Enhanced logging for debugging

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Tech Stack

### Backend
- Python 3.11+
- FastAPI
- MongoDB
- Redis (for caching)
- OpenAI API
- AWS S3 (for file storage)

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- Redux Toolkit
- React Router

## Prerequisites

- Python 3.11 or higher
- Node.js 16 or higher
- MongoDB
- Redis (optional, for caching)
- AWS Account (for S3 storage)
- OpenAI API key
- Cohere API key (for content analysis)
- Hugging Face API token (for sentiment analysis)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ai_interview.git
cd ai_interview
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
SECRET_KEY=your_secret_key
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=ai_interview_db
OPENAI_API_KEY=your_openai_api_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=your_aws_region
S3_BUCKET=your_bucket_name
LLM_MODEL=ollama/llama3
LLM_ENDPOINT=http://localhost:11434
COHERE_API_KEY=your_cohere_api_key
HUGGING_FACE_TOKEN=your_huggingface_token
```

### 3. Frontend Setup

```bash
# Install dependencies
cd frontend
npm install

# Create .env file
cp .env.example .env
```

Edit the `.env` file:
```env
REACT_APP_API_URL=http://localhost:8000
```

## Running the Application

### 1. Start MongoDB
```bash
mongod
```

### 2. Start the Backend Server
```bash
cd backend
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at `http://localhost:8000`

### 3. Start the Frontend Development Server
```bash
cd frontend
npm start
```

The frontend will be available at `http://localhost:3000`

## API Documentation

Once the backend server is running, you can access:
- Swagger UI documentation: `http://localhost:8000/docs`
- ReDoc documentation: `http://localhost:8000/redoc`

## Development

### Backend Development
- The backend uses FastAPI with async/await syntax
- MongoDB with Motor for async database operations
- Pydantic models for data validation
- JWT for authentication

### Frontend Development
- Built with React and TypeScript
- Material-UI for components
- Redux Toolkit for state management
- React Router for navigation

## Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Running in GitHub Codespaces

When running the application in GitHub Codespaces, follow these additional steps:

### Frontend Setup for Codespaces
1. Make sure you're in the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at the Codespace's forwarded port (usually `https://YOUR-CODESPACE-NAME-3000.preview.app.github.dev`)

### Backend Setup for Codespaces
1. Make sure you're in the backend directory:
```bash
cd backend
```

2. Create and activate the virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Start the backend server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at the Codespace's forwarded port (usually `https://YOUR-CODESPACE-NAME-8000.preview.app.github.dev`)

### Environment Configuration for Codespaces
Update your frontend `.env` file to use the Codespace URL:
```env
REACT_APP_API_URL=https://YOUR-CODESPACE-NAME-8000.preview.app.github.dev
``` 
