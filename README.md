# AI Interview Platform

An intelligent interview platform that uses AI to conduct and evaluate technical interviews.

## Features

- Automated technical interviews
- Real-time speech and facial analysis
- Code evaluation
- Performance metrics and feedback
- Resume parsing and analysis

## Tech Stack

### Backend
- Python 3.9+
- FastAPI
- MongoDB
- Redis
- OpenAI GPT-4
- AWS Services (S3, Rekognition)

### Frontend
- Next.js
- TypeScript
- Material-UI
- Redux

## Setup

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the variables with your credentials

4. Run the server:
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment variables:
- Copy `.env.example` to `.env.local`
- Update the variables

3. Run the development server:
```bash
npm run dev
```

## Documentation

- [API Documentation](API_DOCUMENTATION.md)
- [Frontend Components](FRONTEND_COMPONENTS.md)
- [AI Services](AI_SERVICES.md)
- [Database & Storage](DATABASE_STORAGE.md)
- [Development Guide](DEVELOPMENT.md)
- [Deployment Guide](DEPLOYMENT.md)

## License

MIT 
