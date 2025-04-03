import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  IconButton,
  Alert,
  Snackbar,
  Container,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { Mic, Stop, Videocam, Send } from '@mui/icons-material';
import { Answer, AIAnalysisResult } from '../../types/interview';
import { analyzeAnswer, transcribeMedia } from '../../services/aiAnalysis';
import { Language } from '../../components/LanguageSelector';
import { calculateAnswerScore } from '../../utils/scoreCalculator';
import InterviewSetup from './Setup';
import MediaRecorder from '../../components/MediaRecorder';
import LanguageSelector from '../../components/LanguageSelector';
import {
  setJobTitle,
  setResume,
  setJobDescription,
  setQuestions,
  startInterview,
  setLoading,
  setError,
  setLanguage,
  resetInterview,
  setAnswer,
  nextQuestion,
  previousQuestion,
  completeInterview
} from '../../features/interview/interviewSlice';

const Interview: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentAnswer, setCurrentAnswer] = React.useState<Answer>({ text: '', mediaUrl: '', mediaType: 'audio' });
  const [currentMediaBlob, setCurrentMediaBlob] = React.useState<Blob | null>(null);
  const [currentMediaType, setCurrentMediaType] = React.useState<'audio' | 'video' | undefined>(undefined);

  const {
    questions,
    currentQuestionIndex,
    answers,
    isInterviewStarted,
    isInterviewComplete,
    language: selectedLanguage,
    jobTitle,
  } = useAppSelector((state) => state.interview);

  React.useEffect(() => {
    if (isInterviewStarted && questions.length > 0 && currentQuestionIndex >= 0) {
      const answer = answers[currentQuestionIndex];
      setCurrentAnswer(answer || { text: '', mediaUrl: '', mediaType: 'audio' });
    }
  }, [currentQuestionIndex, questions, answers, isInterviewStarted]);

  // Add effect to handle interview completion
  React.useEffect(() => {
    if (isInterviewComplete) {
      console.log('Interview complete, language:', selectedLanguage);
      // Add a small delay to show the completion message before redirecting
      const timer = setTimeout(() => {
        console.log('Redirecting to dashboard...');
        dispatch(resetInterview());
        navigate('/dashboard');
      }, 2000); // 2 second delay
      return () => clearTimeout(timer);
    }
  }, [isInterviewComplete, navigate, dispatch, selectedLanguage]);

  const handleBack = () => {
    dispatch(resetInterview());
    navigate('/dashboard');
  };

  const handleStartInterview = () => {
    dispatch(setLanguage(selectedLanguage));
    dispatch(resetInterview());
  };

  const handleSubmitFeedback = async (answer: Answer, questionIndex: number) => {
    try {
      dispatch(setAnswer({ answer, questionIndex }));
      
      if (questionIndex < questions.length - 1) {
        dispatch(nextQuestion());
      } else {
        await handleCompleteInterview();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    }
  };

  const handleRetryQuestion = () => {
    const currentAnswer = answers[currentQuestionIndex];
    if (!currentAnswer) return;

    dispatch(setAnswer({ 
      answer: { ...currentAnswer, feedback: undefined }, 
      questionIndex: currentQuestionIndex 
    }));
  };

  const handleCompleteInterview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all answers including the last one
      const allAnswers = [...answers];
      if (currentAnswer.text.trim() || currentAnswer.mediaUrl) {
        allAnswers[currentQuestionIndex] = currentAnswer;
      }

      // Analyze each answer
      const analyzedAnswers = await Promise.all(
        allAnswers.map(async (answer, index) => {
          const question = questions[index];
          let transcription = '';
          
          if (answer.mediaUrl && answer.mediaType) {
            try {
              transcription = await transcribeMedia(answer.mediaUrl, answer.mediaType);
            } catch (error) {
              console.error('Transcription failed:', error);
            }
          }

          const analysisResult = await analyzeAnswer(
            answer.text || transcription || '',
            answer.mediaUrl,
            answer.mediaType,
            question.text[selectedLanguage]
          );

          return {
            ...answer,
            analysis: analysisResult,
            transcription: transcription || undefined
          };
        })
      );

      // Transform questions to match Dashboard's expected format
      const simplifiedQuestions = questions.map(q => ({
        id: q.id,
        text: q.text[selectedLanguage],
        type: q.type
      }));

      // Save to localStorage before completing
      const interviewData = {
        jobTitle,
        questions: simplifiedQuestions,
        answers: analyzedAnswers.map((answer, index) => ({
          questionIndex: index,
          text: answer.text,
          mediaUrl: answer.mediaUrl,
          mediaType: answer.mediaType,
          transcription: answer.transcription || '',
          analysis: answer.analysis
        })),
        completedAt: new Date().toISOString(),
        language: selectedLanguage
      };

      // Get existing interviews
      const pastInterviews = JSON.parse(localStorage.getItem('pastInterviews') || '[]');
      
      // Add new interview
      pastInterviews.push(interviewData);
      
      // Save back to localStorage
      localStorage.setItem('pastInterviews', JSON.stringify(pastInterviews));
      
      // Also save as last interview
      localStorage.setItem('lastInterview', JSON.stringify(interviewData));

      // Complete the interview and navigate to dashboard
      dispatch(completeInterview());
      navigate('/dashboard');
    } catch (err) {
      console.error('Error completing interview:', err);
      setError('Failed to complete interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousQuestion = () => {
    dispatch(previousQuestion());
  };

  const handleNext = async () => {
    if (!currentAnswer.text.trim() && !currentAnswer.mediaUrl) {
      setError('Please provide an answer before proceeding.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Get transcription for media answers
      let transcription = '';
      if (currentAnswer.mediaUrl && currentAnswer.mediaType) {
        try {
          transcription = await transcribeMedia(currentAnswer.mediaUrl, currentAnswer.mediaType);
        } catch (error) {
          console.error('Transcription failed:', error);
          // Continue even if transcription fails
        }
      }

      // Save the current answer
      dispatch(setAnswer({
        questionIndex: currentQuestionIndex,
        answer: {
          text: currentAnswer.text,
          mediaUrl: currentAnswer.mediaUrl,
          mediaType: currentAnswer.mediaType,
          transcription: transcription
        }
      }));

      // Move to next question
      if (currentQuestionIndex < questions.length - 1) {
        dispatch(nextQuestion());
        setCurrentAnswer({ text: '', mediaUrl: '', mediaType: 'audio' });
        setError('');
      } else {
        // If it's the last question, complete the interview
        await handleCompleteInterview();
      }
    } catch (error) {
      console.error('Error in handleNext:', error);
      setError('Failed to process your answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    const currentQuestion = questions[currentQuestionIndex];
    dispatch(setAnswer({ 
      answer: currentAnswer,
      questionIndex: currentQuestionIndex 
    }));
    dispatch(previousQuestion());
  };

  const handleSaveAndReturn = () => {
    dispatch(resetInterview());
    navigate('/dashboard');
  };

  const handleMediaRecordingComplete = (mediaBlob: Blob | null, type: 'audio' | 'video' | null) => {
    if (!mediaBlob || !type) {
      // If mediaBlob is null, it means the recording was deleted
      setCurrentAnswer({
        ...currentAnswer,
        mediaUrl: undefined,
        mediaType: undefined,
        transcription: undefined
      });
      return;
    }

    // Create a Blob URL for preview
    const mediaUrl = URL.createObjectURL(mediaBlob);
    
    // Update the current answer with the media
    setCurrentAnswer(prev => ({
      ...prev,
      mediaUrl,
      mediaType: type
    }));
  };

  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

  if (!isInterviewStarted) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <InterviewSetup onStart={handleStartInterview} />
        </Box>
      </Container>
    );
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

  if (isInterviewComplete) {
    console.log('Showing completion screen');
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom align="center">
              {selectedLanguage === 'fr' ? 'Entretien terminé !' : 
               selectedLanguage === 'ar' ? '!تم الانتهاء من المقابلة' : 
               'Interview Complete!'}
            </Typography>
            <Typography paragraph align="center">
              {selectedLanguage === 'fr' ? 
                'Merci d\'avoir terminé l\'entretien. Vos réponses ont été enregistrées et analysées.' :
               selectedLanguage === 'ar' ?
                '.شكراً لإكمال المقابلة. تم تسجيل إجاباتك وتحليلها' :
                'Thank you for completing the interview. Your responses have been recorded and analyzed.'}
            </Typography>
            <Typography paragraph align="center" color="text.secondary">
              {selectedLanguage === 'fr' ? 
                'Redirection vers le tableau de bord...' :
               selectedLanguage === 'ar' ?
                '...جارٍ إعادة التوجيه إلى لوحة التحكم' :
                'Redirecting to dashboard...'}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const feedback = currentAnswer?.feedback;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {selectedLanguage === 'fr' ? 'Questions d\'entretien' :
           selectedLanguage === 'ar' ? 'أسئلة المقابلة' :
           'Interview Questions'}
          <Box sx={{ minWidth: 200 }}>
            <LanguageSelector value={selectedLanguage} onChange={handleLanguageChange} />
          </Box>
        </Typography>

        <Stepper activeStep={currentQuestionIndex} sx={{ mb: 4 }}>
          {questions.map((_, index) => (
            <Step key={index}>
              <StepLabel>
                {selectedLanguage === 'fr' ? `Question ${index + 1}` :
                 selectedLanguage === 'ar' ? `${index + 1} السؤال` :
                 `Question ${index + 1}`}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3, direction: selectedLanguage === 'ar' ? 'rtl' : 'ltr' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Typography variant="h6" gutterBottom>
            {currentQuestion?.text[selectedLanguage]}
          </Typography>

          {currentQuestion?.context && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 2, fontStyle: 'italic' }}
            >
              {selectedLanguage === 'fr' ? 'Contexte: ' :
               selectedLanguage === 'ar' ? 'السياق: ' :
               'Context: '}
              {currentQuestion.context[selectedLanguage]}
            </Typography>
          )}

          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedLanguage === 'fr' ? 'Répondez avec du texte, de l\'audio ou de la vidéo:' :
               selectedLanguage === 'ar' ? ':أجب بالنص أو الصوت أو الفيديو' :
               'Answer with text, audio, or video:'}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              value={currentAnswer.text}
              onChange={(e) => setCurrentAnswer(prev => ({ ...prev, text: e.target.value }))}
              placeholder={
                selectedLanguage === 'fr' ? 'Tapez votre réponse ici...' :
                selectedLanguage === 'ar' ? '...اكتب إجابتك هنا' :
                'Type your answer here...'
              }
              sx={{ mb: 2 }}
              InputProps={{
                style: { textAlign: selectedLanguage === 'ar' ? 'right' : 'left' }
              }}
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
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!currentAnswer.text.trim() && !currentAnswer.mediaUrl || loading}
              endIcon={loading && <CircularProgress size={20} />}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Interview; 