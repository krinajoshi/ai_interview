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
  text: string;
  type: 'text' | 'audio' | 'video';
  timeLimit?: number;
  context?: {
    en: string;
    fr: string;
    ar: string;
  };
}

export interface SetAnswerPayload {
  questionIndex: number;
  answer: Answer;
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
  language: Language;
}

export interface AIAnalysisResult {
  relevanceScore: number;
  sentimentScore: number;
  feedback: string[];
  qualityScore: number;
  suggestions: string[];
  transcription?: string;
  sentiment?: {
    score: number;
    label: string;
  };
}

export interface InterviewSetupProps {
  onStart: () => void;
}

export type Language = 'en' | 'fr' | 'ar'; 