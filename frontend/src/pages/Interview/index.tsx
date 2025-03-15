import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setAnswer,
  nextQuestion,
  previousQuestion,
  completeInterview,
  resetInterview,
} from '../../features/interview/interviewSlice';
import InterviewSetup from './Setup';

const Interview: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    questions,
    currentQuestionIndex,
    answers,
    loading,
    error,
    isInterviewStarted,
    isInterviewComplete,
    jobTitle,
  } = useAppSelector((state) => state.interview);

  const [currentAnswer, setCurrentAnswer] = React.useState('');

  // Debug logging
  React.useEffect(() => {
    console.log('Interview state:', {
      questions,
      currentQuestionIndex,
      isInterviewStarted,
      isInterviewComplete,
    });
  }, [questions, currentQuestionIndex, isInterviewStarted, isInterviewComplete]);

  React.useEffect(() => {
    if (isInterviewStarted && questions.length > 0) {
      const currentQuestionId = questions[currentQuestionIndex]?.id;
      setCurrentAnswer(answers[currentQuestionId] || '');
    }
  }, [currentQuestionIndex, questions, answers, isInterviewStarted]);

  const handleBack = () => {
    dispatch(resetInterview());
    navigate('/dashboard');
  };

  if (!isInterviewStarted) {
    return <InterviewSetup />;
  }

  if (questions.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Loading Questions...
            </Typography>
            <CircularProgress />
            <Button
              variant="outlined"
              onClick={handleBack}
              sx={{ mt: 2, display: 'block' }}
            >
              Back to Dashboard
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    dispatch(setAnswer({ questionId: currentQuestion.id, answer: currentAnswer }));

    if (currentQuestionIndex < questions.length - 1) {
      dispatch(nextQuestion());
    } else {
      dispatch(completeInterview());
    }
  };

  const handlePrevious = () => {
    const currentQuestion = questions[currentQuestionIndex];
    dispatch(setAnswer({ questionId: currentQuestion.id, answer: currentAnswer }));
    dispatch(previousQuestion());
  };

  const handleSaveAndReturn = () => {
    const interviewData = {
      jobTitle,
      questions,
      answers,
      completedAt: new Date().toISOString(),
    };
    const pastInterviews = JSON.parse(localStorage.getItem('pastInterviews') || '[]');
    pastInterviews.push(interviewData);
    localStorage.setItem('pastInterviews', JSON.stringify(pastInterviews));
    dispatch(resetInterview());
    navigate('/dashboard');
  };

  if (isInterviewComplete) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Interview Complete!
            </Typography>
            <Typography paragraph>
              Thank you for completing the interview. Your responses have been recorded.
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleSaveAndReturn}
              >
                Save and Return to Dashboard
              </Button>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('Interview Questions')}
        </Typography>

        <Stepper activeStep={currentQuestionIndex} sx={{ mb: 4 }}>
          {questions.map((_, index) => (
            <Step key={index}>
              <StepLabel>Question {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="h6" gutterBottom>
            {questions[currentQuestionIndex]?.text}
          </Typography>

          {questions[currentQuestionIndex]?.context && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, fontStyle: 'italic' }}
            >
              Context: {questions[currentQuestionIndex].context}
            </Typography>
          )}

          <TextField
            fullWidth
            multiline
            rows={6}
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here..."
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 || loading}
            >
              {t('Previous Question')}
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!currentAnswer.trim() || loading}
              endIcon={loading && <CircularProgress size={20} />}
            >
              {currentQuestionIndex === questions.length - 1
                ? t('Complete Interview')
                : t('Next Question')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Interview; 