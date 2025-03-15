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
  setLanguage,
} from '../../features/interview/interviewSlice';
import InterviewSetup from './Setup';
import MediaRecorder from '../../components/MediaRecorder';
import LanguageSelector, { Language } from '../../components/LanguageSelector';

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

const getLanguageSpecificFeedback = (answer: Answer, questionText: string, language: Language): Answer['feedback'] => {
  // This is a placeholder for the language-specific analysis logic
  // In a production environment, this would call an AI service with language support
  
  const feedbackByLanguage = {
    en: {
      comments: [
        'Good use of specific examples',
        'Clear communication style',
        answer.mediaType ? 'Effective use of ' + answer.mediaType + ' response' : '',
      ],
      suggestions: [
        'Consider providing more context',
        'Try to be more concise',
        'Include specific metrics if available',
      ],
    },
    fr: {
      comments: [
        'Bonne utilisation d\'exemples spécifiques',
        'Style de communication clair',
        answer.mediaType ? 'Utilisation efficace de la réponse ' + (answer.mediaType === 'video' ? 'vidéo' : 'audio') : '',
      ],
      suggestions: [
        'Pensez à fournir plus de contexte',
        'Essayez d\'être plus concis',
        'Incluez des métriques spécifiques si possible',
      ],
    },
    ar: {
      comments: [
        'استخدام جيد للأمثلة المحددة',
        'أسلوب تواصل واضح',
        answer.mediaType ? 'استخدام فعال للرد ' + (answer.mediaType === 'video' ? 'المرئي' : 'الصوتي') : '',
      ],
      suggestions: [
        'حاول تقديم المزيد من السياق',
        'حاول أن تكون أكثر إيجازاً',
        'قم بتضمين مقاييس محددة إذا كانت متوفرة',
      ],
    },
  };

  const score = Math.random() * 5; // Mock score between 0-5
  const feedback = feedbackByLanguage[language];

  return {
    score,
    comments: feedback.comments.filter(Boolean),
    suggestions: feedback.suggestions,
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
    selectedLanguage,
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

  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

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
    
    // Analyze the answer with language-specific feedback
    const feedback = getLanguageSpecificFeedback(
      currentAnswer, 
      currentQuestion.text[selectedLanguage],
      selectedLanguage
    );
    
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
        language: selectedLanguage,
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
              {selectedLanguage === 'fr' ? 'Entretien terminé !' : 
               selectedLanguage === 'ar' ? '!تم الانتهاء من المقابلة' : 
               'Interview Complete!'}
            </Typography>
            <Typography paragraph>
              {selectedLanguage === 'fr' ? 
                'Merci d\'avoir terminé l\'entretien. Vos réponses ont été enregistrées et analysées.' :
               selectedLanguage === 'ar' ?
                '.شكراً لإكمال المقابلة. تم تسجيل إجاباتك وتحليلها' :
                'Thank you for completing the interview. Your responses have been recorded and analyzed.'}
            </Typography>
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                onClick={handleSaveAndReturn}
              >
                {selectedLanguage === 'fr' ? 'Retourner au tableau de bord' :
                 selectedLanguage === 'ar' ? 'العودة إلى لوحة التحكم' :
                 'Return to Dashboard'}
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

            {feedback && (
              <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedLanguage === 'fr' ? 'Analyse de la réponse' :
                     selectedLanguage === 'ar' ? 'تحليل الإجابة' :
                     'Answer Analysis'}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLanguage === 'fr' ? 'Score: ' :
                     selectedLanguage === 'ar' ? 'النتيجة: ' :
                     'Score: '}
                    {feedback.score.toFixed(1)} / 5
                  </Typography>
                  
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    {selectedLanguage === 'fr' ? 'Points positifs:' :
                     selectedLanguage === 'ar' ? ':النقاط الإيجابية' :
                     'Positive Points:'}
                  </Typography>
                  <ul>
                    {feedback.comments.map((comment, index) => (
                      <li key={index}>{comment}</li>
                    ))}
                  </ul>

                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    {selectedLanguage === 'fr' ? 'Suggestions d\'amélioration:' :
                     selectedLanguage === 'ar' ? ':اقتراحات للتحسين' :
                     'Suggestions for Improvement:'}
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
              {selectedLanguage === 'fr' ? 'Question précédente' :
               selectedLanguage === 'ar' ? 'السؤال السابق' :
               'Previous Question'}
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!currentAnswer.text.trim() && !currentAnswer.mediaUrl || loading}
              endIcon={loading && <CircularProgress size={20} />}
            >
              {currentQuestionIndex === questions.length - 1 ?
                (selectedLanguage === 'fr' ? 'Terminer l\'entretien' :
                 selectedLanguage === 'ar' ? 'إنهاء المقابلة' :
                 'Complete Interview') :
                (selectedLanguage === 'fr' ? 'Question suivante' :
                 selectedLanguage === 'ar' ? 'السؤال التالي' :
                 'Next Question')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Interview; 