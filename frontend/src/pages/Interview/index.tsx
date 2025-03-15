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
  Card,
  CardContent,
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
import MediaRecorder from '../../components/MediaRecorder';

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

const analyzeAnswer = (answer: Answer, questionText: string): Answer['feedback'] => {
  // This is a placeholder for the analysis logic
  // In a production environment, this would call an AI service
  const score = Math.random() * 5; // Mock score between 0-5
  const comments = [
    'Good use of specific examples',
    'Clear communication style',
    answer.mediaType ? 'Effective use of ' + answer.mediaType + ' response' : '',
  ].filter(Boolean);
  
  const suggestions = [
    'Consider providing more context',
    'Try to be more concise',
    'Include specific metrics if available',
  ];

  return {
    score,
    comments,
    suggestions,
  };
};

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

  const [currentAnswer, setCurrentAnswer] = React.useState<Answer>({ text: '' });

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
      setCurrentAnswer(answers[currentQuestionId] || { text: '' });
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

  const handleMediaRecordingComplete = (mediaBlob: Blob | null, type: 'audio' | 'video' | null) => {
    if (!mediaBlob || !type) {
      // If mediaBlob is null, it means the recording was deleted
      setCurrentAnswer(prev => ({
        ...prev,
        mediaUrl: undefined,
        mediaType: undefined
      }));
      return;
    }

    // In production, you would upload this to a server and get a URL back
    const mediaUrl = URL.createObjectURL(mediaBlob);
    setCurrentAnswer(prev => ({
      ...prev,
      mediaUrl,
      mediaType: type
    }));
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Analyze the answer before saving
    const feedback = analyzeAnswer(currentAnswer, currentQuestion.text);
    const answerWithFeedback = {
      ...currentAnswer,
      feedback
    };

    // Save the current answer
    dispatch(setAnswer({ 
      questionId: currentQuestion.id, 
      answer: answerWithFeedback 
    }));

    if (currentQuestionIndex < questions.length - 1) {
      dispatch(nextQuestion());
    } else {
      // Save to localStorage before completing
      const interviewData = {
        jobTitle,
        questions,
        answers: {
          ...answers,
          [currentQuestion.id]: answerWithFeedback // Include the last answer
        },
        completedAt: new Date().toISOString(),
      };
      const pastInterviews = JSON.parse(localStorage.getItem('pastInterviews') || '[]');
      pastInterviews.push(interviewData);
      localStorage.setItem('pastInterviews', JSON.stringify(pastInterviews));

      // Complete the interview
      dispatch(completeInterview());
    }
  };

  const handlePrevious = () => {
    const currentQuestion = questions[currentQuestionIndex];
    dispatch(setAnswer({ 
      questionId: currentQuestion.id, 
      answer: currentAnswer 
    }));
    dispatch(previousQuestion());
  };

  const handleSaveAndReturn = () => {
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
              Thank you for completing the interview. Your responses have been recorded and analyzed.
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

  const currentQuestion = questions[currentQuestionIndex];
  const feedback = currentAnswer.feedback;

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
            {currentQuestion?.text}
          </Typography>

          {currentQuestion?.context && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, fontStyle: 'italic' }}
            >
              Context: {currentQuestion.context}
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Answer with text, audio, or video:
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              value={currentAnswer.text}
              onChange={(e) => setCurrentAnswer(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Type your answer here..."
              sx={{ mb: 2 }}
            />

            <MediaRecorder 
              onRecordingComplete={handleMediaRecordingComplete}
              questionId={currentQuestion.id}
              existingRecording={
                currentAnswer.mediaUrl ? {
                  url: currentAnswer.mediaUrl,
                  type: currentAnswer.mediaType!
                } : undefined
              }
            />

            {feedback && (
              <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Answer Analysis
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    Score: {feedback.score.toFixed(1)} / 5
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Positive Points:
                  </Typography>
                  <ul>
                    {feedback.comments.map((comment, index) => (
                      <li key={index}>{comment}</li>
                    ))}
                  </ul>

                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Suggestions for Improvement:
                  </Typography>
                  <ul>
                    {feedback.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </Box>

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
              disabled={!currentAnswer.text.trim() && !currentAnswer.mediaUrl || loading}
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