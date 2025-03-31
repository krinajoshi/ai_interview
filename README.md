# AI Interview Assistant

An intelligent interview preparation and practice platform that helps users prepare for technical interviews using AI-powered feedback and analysis.

## Features

- **Multi-language Support**: Practice interviews in English, French, and Arabic
- **AI-Powered Analysis**: Get detailed feedback on your answers using advanced AI models
- **Real-time Feedback**: Receive instant feedback on your responses
- **Progress Tracking**: Track your interview preparation progress
- **Detailed Analytics**: View comprehensive analysis of your interview performance
- **Audio/Video Recording**: Record your answers using audio or video for more realistic practice
- **Speech-to-Text**: Automatic transcription of audio/video recordings for analysis
- **Sentiment Analysis**: Get insights into your communication style and tone
- **Performance Metrics**: Track your scores and improvement areas

## Tech Stack

### Frontend
- React with TypeScript
- Material-UI for components
- Redux Toolkit for state management
- i18next for internationalization
- MediaRecorder API for audio/video recording

### Backend
- FastAPI (Python)
- Cohere AI for sentiment analysis and feedback generation
- Whisper API for speech-to-text transcription
- SQLAlchemy for database operations
- Pydantic for data validation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- Cohere AI API key
- Whisper API access

### Environment Variables
Create a `.env` file in the frontend directory:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_COHERE_API_KEY=your_cohere_api_key
```

Create a `.env` file in the backend directory:
```env
DATABASE_URL=sqlite:///./interview.db
COHERE_API_KEY=your_cohere_api_key
WHISPER_API_KEY=your_whisper_api_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ai-interview-assistant.git
cd ai-interview-assistant
```

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

4. Set up the database:
```bash
cd backend
alembic upgrade head
```

### Running the Application

1. Start the backend server:
```bash
cd backend
uvicorn main:app --reload
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`.

## Usage

1. **Start a New Interview**:
   - Select your preferred language
   - Choose a job title or enter a custom one
   - Click "Start Interview"

2. **Answer Questions**:
   - Type your answer in the text field
   - Or record audio/video using the media recorder
   - Get real-time feedback on your responses

3. **View Analysis**:
   - Click "View Detailed Analysis" for comprehensive feedback
   - See your score, sentiment analysis, and improvement suggestions
   - Review transcribed audio/video recordings

4. **Track Progress**:
   - View your interview history
   - Track your scores and improvement areas
   - Compare performance across different interviews

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Cohere AI for sentiment analysis and feedback generation
- Whisper API for speech-to-text transcription
- Material-UI for the component library
- React and TypeScript communities

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
```