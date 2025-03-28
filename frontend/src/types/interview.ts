import { Language } from '../components/LanguageSelector';

export interface Answer {
  text: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
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
  sentiment: {
    label: string;
    score: number;
  };
  transcription?: string;
  content_analysis?: {
    relevance_score: number;
    similarity_score: number;
    rerank_score: number;
    feedback: {
      relevant_points: string[];
      missing_points: string[];
      off_topic_content: string[];
    };
  };
  quality_metrics?: {
    has_gibberish: boolean;
    has_meaningful_structure: boolean;
    avg_sentence_length: number;
    sentence_count: number;
    excessive_repetition: boolean;
    word_count: number;
  };
  score: number;
  feedback: string[];
  improvement_points: string[];
} 