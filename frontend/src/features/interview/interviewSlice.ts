import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  id: string;
  text: string;
  type: string;
  context?: string;
}

interface InterviewState {
  jobTitle: string;
  resume: string | null;
  jobDescription: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, string>;
  loading: boolean;
  error: string | null;
  isInterviewStarted: boolean;
  isInterviewComplete: boolean;
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
};

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
      state.currentQuestionIndex = 0;
      state.answers = {};
    },
    startInterview: (state) => {
      state.isInterviewStarted = true;
      state.isInterviewComplete = false;
      state.currentQuestionIndex = 0;
      state.answers = {};
    },
    setAnswer: (state, action: PayloadAction<{ questionId: string; answer: string }>) => {
      state.answers[action.payload.questionId] = action.payload.answer;
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