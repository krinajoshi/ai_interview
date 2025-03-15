import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Language } from '../../components/LanguageSelector';

interface Answer {
  text: string;
  mediaUrl?: string;
  mediaType?: 'audio' | 'video';
  feedback?: {
    score: number;
    comments: string[];
    suggestions: string[];
  };
}

interface Question {
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

interface InterviewState {
  jobTitle: string;
  resume: string | null;
  jobDescription: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, Answer>;
  loading: boolean;
  error: string | null;
  isInterviewStarted: boolean;
  isInterviewComplete: boolean;
  selectedLanguage: Language;
}

const initialState: InterviewState = {
  jobTitle: '',
  resume: null,
  jobDescription: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: {},
  loading: false,
  error: null,
  isInterviewStarted: false,
  isInterviewComplete: false,
  selectedLanguage: 'en',
};

interface SetAnswerPayload {
  questionId: string;
  answer: Answer;
}

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setJobTitle: (state, action: PayloadAction<string>) => {
      state.jobTitle = action.payload;
    },
    setResume: (state, action: PayloadAction<string | null>) => {
      state.resume = action.payload;
    },
    setJobDescription: (state, action: PayloadAction<string | null>) => {
      state.jobDescription = action.payload;
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.selectedLanguage = action.payload;
    },
    startInterview: (state) => {
      state.isInterviewStarted = true;
      state.isInterviewComplete = false;
      state.currentQuestionIndex = 0;
      state.answers = {};
      state.error = null;
    },
    setAnswer: (state, action: PayloadAction<SetAnswerPayload>) => {
      const { questionId, answer } = action.payload;
      state.answers[questionId] = answer;
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    completeInterview: (state) => {
      state.isInterviewComplete = true;
      state.isInterviewStarted = false;
    },
    resetInterview: () => initialState,
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setJobTitle,
  setResume,
  setJobDescription,
  setQuestions,
  setLanguage,
  startInterview,
  setAnswer,
  nextQuestion,
  previousQuestion,
  completeInterview,
  resetInterview,
  setLoading,
  setError,
} = interviewSlice.actions;

export default interviewSlice.reducer; 