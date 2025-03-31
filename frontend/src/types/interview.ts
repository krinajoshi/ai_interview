import { Language } from '../components/LanguageSelector';

export interface Answer {
  text: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  transcription?: string;
  feedback?: {
    score: number;
    comments: string[];
    suggestions: string[];
  };
}

export interface Question {
  id: string;
  text: {
    en: string;
    fr: string;
    ar: string;
  };
  type: string;
  context?: {
    en: string;
    fr: string;
    ar: string;
  };
}

export interface SetAnswerPayload {
  answer: Answer;
  questionIndex: number;
}

export interface InterviewState {
  jobTitle: string;
  resume: string | null;
  jobDescription: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Answer[];
  loading: boolean;
  error: string | null;
  isInterviewStarted: boolean;
  isInterviewComplete: boolean;
  selectedLanguage: Language;
  language: 'en' | 'fr' | 'ar';
}

export interface AIAnalysisResult {
  score: number;
  feedback: string;
  comments: string[];
  suggestions: string[];
  sentiment: {
    score: number;
    label: string;
  };
  improvement_points: string[];
  transcription?: string;
} 