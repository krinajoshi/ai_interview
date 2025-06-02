import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { Language } from '../../components/LanguageSelector';
import { Question, Answer, SetAnswerPayload } from '../../types/interview';

interface InterviewState {
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

const initialState: InterviewState = {
  jobTitle: '',
  resume: null,
  jobDescription: null,
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  loading: false,
  error: null,
  isInterviewStarted: false,
  isInterviewComplete: false,
  selectedLanguage: 'en',
  language: 'en',
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to handle error messages
const handleError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.detail) return error.response.data.detail;
  if (error?.message) return error.message;
  return 'An unknown error occurred';
};

export const generateQuestions = createAsyncThunk(
  'interview/generateQuestions',
  async ({ 
    jobTitle, 
    jobDescription, 
    language 
  }: { 
    jobTitle: string; 
    jobDescription?: string; 
    language: string 
  }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Create request body
      const requestBody = {
        job_title: jobTitle,
        language: language
      };
      
      // Add job_description if provided
      if (jobDescription) {
        Object.assign(requestBody, { job_description: jobDescription });
      }

      console.log('Sending request with body:', requestBody);

      const response = await axios.post(
        `${API_URL}/api/v1/interviews/generate-questions`,
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Response data:', response.data);
      
      // Ensure questions have the correct format
      const formattedQuestions = response.data.questions.map((q: any) => {
        // Make sure each question has the required fields
        return {
          id: q.id || `q_${Math.random().toString(36).substr(2, 9)}`,
          text: q.text || {
            en: "Default question text",
            fr: "Texte de question par défaut",
            ar: "نص السؤال الافتراضي"
          },
          type: q.type || "general"
        };
      });
      
      return {
        ...response.data,
        questions: formattedQuestions
      };
    } catch (error) {
      console.error('Error generating questions:', error);
      return rejectWithValue(handleError(error));
    }
  }
);

const interviewSlice = createSlice({
  name: 'interview',
  initialState,
  reducers: {
    setJobTitle: (state, action: PayloadAction<string>) => {
      state.jobTitle = action.payload;
    },
    setJobDescription: (state, action: PayloadAction<string | null>) => {
      state.jobDescription = action.payload;
    },
    setResume: (state, action: PayloadAction<string | null>) => {
      state.resume = action.payload;
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.selectedLanguage = action.payload;
      state.language = action.payload;
    },
    startInterview: (state) => {
      state.isInterviewStarted = true;
      state.currentQuestionIndex = 0;
      state.answers = Array(state.questions.length).fill(null);
    },
    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
      } else {
        state.isInterviewComplete = true;
      }
    },
    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
      }
    },
    setAnswer: (state, action: PayloadAction<SetAnswerPayload>) => {
      const { answer, questionIndex } = action.payload;
      state.answers[questionIndex] = answer;
    },
    completeInterview: (state) => {
      state.isInterviewComplete = true;
    },
    resetInterview: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(generateQuestions.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(generateQuestions.fulfilled, (state, action) => {
      state.loading = false;
      state.questions = action.payload.questions;
      state.answers = Array(action.payload.questions.length).fill(null);
    });
    builder.addCase(generateQuestions.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const {
  setJobTitle,
  setJobDescription,
  setResume,
  setLanguage,
  startInterview,
  nextQuestion,
  previousQuestion,
  setAnswer,
  completeInterview,
  resetInterview,
} = interviewSlice.actions;

export default interviewSlice.reducer;