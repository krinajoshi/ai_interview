import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  nextQuestion, 
  previousQuestion, 
  setAnswer, 
  completeInterview 
} from '../../features/interview/interviewSlice';
import MediaRecorder from '../../components/MediaRecorder';
import { Answer } from '../../types/interview';
import { analyzeAnswer, transcribeMedia } from '../../services/aiAnalysis';

const Interview: React.FC = () => {
  const dispatch = useAppDispatch();
  const { 
    questions, 
    currentQuestionIndex, 
    answers, 
    language 
  } = useAppSelector((state) => state.interview);
  
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  
  // Debug information
  console.log('Current question:', currentQuestion);
  console.log('Current language:', language);
  
  const handleNext = async () => {
    if (!answerText && !currentAnswer) {
      setError('Please provide an answer before continuing');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    
    try {
      // If there's a new answer text, save it
      if (answerText) {
        // Analyze the answer
        const analysis = await analyzeAnswer(
          answerText, 
          undefined, 
          undefined, 
          currentQuestion?.text?.[language] || 'No question'
        );
        
        // Save the answer
        const answer: Answer = {
          text: answerText,
          feedback: {
            score: analysis.score,
            comments: [analysis.feedback],
            suggestions: []
          }
        };
        
        dispatch(setAnswer({ answer, questionIndex: currentQuestionIndex }));
      }
      
      // Move to next question
      dispatch(nextQuestion());
      
      // Reset the answer text for the next question
      setAnswerText('');
    } catch (err) {
      console.error('Error saving answer:', err);
      setError('Failed to save answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePrevious = () => {
    dispatch(previousQuestion());
  };
  
  const handleRecordingComplete = async (mediaBlob: Blob | null, type: 'audio' | 'video' | null) => {
    if (!mediaBlob || !type) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create a URL for the media
      const mediaUrl = URL.createObjectURL(mediaBlob);
      
      // Transcribe the media
      const transcription = await transcribeMedia(mediaUrl, type);
      
      // Analyze the transcription
      const analysis = await analyzeAnswer(
        transcription, 
        mediaUrl, 
        type, 
        currentQuestion?.text?.[language] || 'No question'
      );
      
      // Save the answer
      const answer: Answer = {
        text: '',
        mediaUrl,
        mediaType: type,
        transcription,
        feedback: {
          score: analysis.score,
          comments: [analysis.feedback],
          suggestions: []
        }
      };
      
      dispatch(setAnswer({ answer, questionIndex: currentQuestionIndex }));
    } catch (err) {
      console.error('Error processing recording:', err);
      setError('Failed to process recording. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If no questions are loaded yet
  if (!currentQuestion) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography variant="h6">Loading questions...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Interview Questions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Question {currentQuestionIndex + 1} of {questions.length}
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          {currentQuestion?.text?.[language] || 'Question not available in this language'}
        </Typography>
        
        {currentQuestion?.context && (
          <Box sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Context:
            </Typography>
            <Typography variant="body2">
              {currentQuestion.context[language]}
            </Typography>
          </Box>
        )}
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Answer with text, audio, or video:
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Type your answer here..."
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          disabled={isSubmitting}
          sx={{ mb: 2 }}
        />
        
        <MediaRecorder
          onRecordingComplete={handleRecordingComplete}
          questionId={currentQuestion?.id || ''}
          existingRecording={
            currentAnswer?.mediaUrl && currentAnswer?.mediaType
              ? {
                  url: currentAnswer.mediaUrl,
                  type: currentAnswer.mediaType,
                }
              : undefined
          }
        />
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0 || isSubmitting}
        >
          Previous
        </Button>
        
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : currentQuestionIndex === questions.length - 1 ? (
            'Finish'
          ) : (
            'Next'
          )}
        </Button>
      </Box>
    </Paper>
  );
};

export default Interview;