# AI Interview Preparation App

An AI-powered multilingual interview preparation platform that helps non-native speakers practice for job interviews in English and French markets. The app generates role-specific questions using AI and provides comprehensive feedback on answers given via text, audio, or video.

## Features

- **Personalized interview questions** based on specific job roles and descriptions
- **Multilingual support** with language switching capabilities (English, French, Arabic)
- **Multi-format response options** (text, audio, video)
- **AI-powered feedback** covering content quality, language proficiency, and cultural communication norms
- **Accessible web-based platform** requiring no downloads
- **Real-time audio transcription** using AssemblyAI
- **Advanced translation** using HuggingFace's translation models

## Tech Stack

### Frontend
- React.js with TypeScript
- Material UI for responsive design
- Redux for state management
- i18n for internationalization

### Backend
- FastAPI (Python)
- MongoDB for data storage
- JWT authentication
- AI services integration (Cohere, Hugging Face, AssemblyAI)

### AI Services
- Question Generation: Local AI models (Hugging Face)
- Speech-to-Text: AssemblyAI API
- Translation: HuggingFace Translation API
- Feedback Analysis: Cohere AI

## Getting Started

### Prerequisites
- Node.js (v14+)
- Python (v3.9+)
- MongoDB

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration. You'll need to add:
   - `ASSEMBLY_AI_API_KEY`: Your AssemblyAI API key for transcription
   - `HUGGINGFACE_API_TOKEN`: Your HuggingFace API token for translation
   - `COHERE_API_KEY`: Your Cohere API key for feedback analysis

5. Run the server:
   ```
   uvicorn app.main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

4. Run the development server:
   ```
   npm start
   ```

## Project Structure

```
ai_interview/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Core functionality
│   │   ├── db/            # Database models
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic
│   │   └── main.py        # Application entry point
│   └── requirements.txt   # Python dependencies
├── frontend/              # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── features/      # Redux slices
│   │   ├── locales/       # Translations
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── App.tsx        # Main application component
│   └── package.json       # Node.js dependencies
└── README.md              # Project documentation
```

## API Integration

### AssemblyAI Integration
The app uses AssemblyAI for high-quality audio transcription. The service provides:
- Real-time transcription
- Support for multiple audio formats
- Automatic punctuation and formatting
- Language detection and support

### HuggingFace Translation
The translation system uses HuggingFace's translation models:
- English to French translation
- English to Arabic translation
- High-quality, context-aware translations
- Support for technical and domain-specific terms

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- AssemblyAI for speech-to-text capabilities
- HuggingFace for translation models
- Cohere for sentiment analysis