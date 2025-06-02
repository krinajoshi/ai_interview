# AI Interview Preparation API

Backend API for AI-powered interview preparation application.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Download the multilingual model:
```bash
python install_model.py
```

3. Start the server:
```bash
uvicorn app.main:app --reload
```

## Features

- User authentication with JWT
- Interview question generation using local multilingual model
- Answer evaluation
- Voice and facial analysis
- Multilingual support (English, French, Arabic)

## API Endpoints

- `/api/v1/users/register` - Register a new user
- `/api/v1/users/login` - Login and get access token
- `/api/v1/users/me` - Get current user information
- `/api/v1/interviews/generate-questions` - Generate interview questions
- `/api/v1/analysis` - Analyze interview answers
- `/api/v1/transcription` - Transcribe audio recordings

## Model Information

The application uses the BLOOMZ-1B7 model from Hugging Face, which is:
- Multilingual (supports 46+ languages)
- Free and open-source
- Runs locally without API costs
- Optimized with 8-bit quantization to reduce memory usage

## Requirements

- Python 3.8+
- MongoDB
- 4GB+ RAM for model inference