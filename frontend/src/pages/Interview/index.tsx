import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  IconButton,
  useTheme,
  alpha,
  Grid,
  Fade,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  ArrowBack,
  ArrowForward,
  Save,
  Refresh,
  Check,
  Timer,
  QuestionAnswer,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setAnswer,
  nextQuestion,
  previousQuestion,
  completeInterview,
  resetInterview,
  setLanguage,
} from '../../features/interview/interviewSlice';
import { Answer, Question, AIAnalysisResult, Language } from '../../types/interview';
import InterviewSetup from './Setup';
import MediaRecorder from '../../components/MediaRecorder';
import LanguageSelector from '../../components/LanguageSelector';
import { analyzeAnswer, transcribeMedia } from '../../services/aiAnalysis';
import DetailedAnalysis from '../../components/DetailedAnalysis';

const getLanguageSpecificFeedback = async (answer: Answer, questionText: string, language: Language): Promise<Answer['feedback']> => {
  try {
    // Check for empty answer
    if (!answer.text?.trim() && !answer.mediaUrl) {
      return {
        score: 0,
        comments: [],
        suggestions: [
          language === 'fr' ? 'Veuillez fournir une réponse' :
          language === 'ar' ? 'يرجى تقديم إجابة' :
          'Please provide an answer'
        ],
      };
    }

    // Get AI analysis of the answer
    let analysis;
    try {
      analysis = await analyzeAnswer(
        answer.text || '',
        answer.mediaUrl || '',
        answer.mediaType || 'text',
        questionText
      );
      console.log('Full analysis results:', analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      return {
        score: 0,
        comments: [],
        suggestions: [
          language === 'fr' ? 'Erreur lors de l\'analyse. Veuillez réessayer.' :
          language === 'ar' ? 'خطأ في التحليل. يرجى المحاولة مرة أخرى.' :
          'Error during analysis. Please try again.'
        ],
      };
    }
    
    // Initialize feedback arrays
    const comments: string[] = [];
    const suggestions: string[] = [];
    
    // Base score calculation (0-5 scale)
    let score = 0;
    
    // Content length analysis (0-1 points)
    const wordCount = (answer.text || '').trim().split(/\s+/).length;
    console.log('Word count:', wordCount);

    if (wordCount === 0) {
      if (!answer.mediaUrl) {
        suggestions.push(
          language === 'fr' ? 'Veuillez fournir une réponse textuelle ou un enregistrement' :
          language === 'ar' ? 'يرجى تقديم إجابة نصية أو تسجيل' :
          'Please provide a text answer or recording'
        );
      }
    } else if (wordCount < 20) {
      score += 0.2;
      suggestions.push(
        language === 'fr' ? 'Votre réponse est très courte. Développez davantage avec des exemples.' :
        language === 'ar' ? 'إجابتك قصيرة جداً. قم بالتطوير مع أمثلة.' :
        'Your answer is very brief. Expand with examples.'
      );
    } else if (wordCount < 50) {
      score += 0.5;
      suggestions.push(
        language === 'fr' ? 'Ajoutez plus de détails à votre réponse' :
        language === 'ar' ? 'أضف المزيد من التفاصيل إلى إجابتك' :
        'Add more details to your response'
      );
    } else if (wordCount >= 50 && wordCount <= 200) {
      score += 1;
      comments.push(
        language === 'fr' ? 'Bonne longueur de réponse' :
        language === 'ar' ? 'طول الإجابة جيد' :
        'Good response length'
      );
    }

    // Only proceed with sentiment and emotion analysis if we have actual content
    if ((wordCount > 0 || answer.mediaUrl) && analysis) {
      // Sentiment analysis (0-2 points)
      console.log('Sentiment score:', analysis.sentimentScore);
      if (analysis.sentimentScore >= 0.8) {
        score += 2;
        comments.push(
          language === 'fr' ? 'Excellent ton professionnel et positif' :
          language === 'ar' ? 'نبرة مهنية وإيجابية ممتازة' :
          'Excellent professional and positive tone'
        );
      } else if (analysis.sentimentScore >= 0.6) {
        score += 1.5;
        comments.push(
          language === 'fr' ? 'Bon ton professionnel' :
          language === 'ar' ? 'نبرة مهنية جيدة' :
          'Good professional tone'
        );
      } else if (analysis.sentimentScore < 0.4) {
        score += 0.5;
        suggestions.push(
          language === 'fr' ? 'Adoptez un ton plus positif et professionnel' :
          language === 'ar' ? 'استخدم نبرة أكثر إيجابية ومهنية' :
          'Adopt a more positive and professional tone'
        );
      }

      // Media response bonus (0-1 point)
      if (analysis.transcription) {
        console.log('Transcription analysis:', { transcription: analysis.transcription });
        score += 0.5;
        comments.push(
          language === 'fr' ? 'Excellent usage du support audio/vidéo' :
          language === 'ar' ? 'استخدام ممتاز للوسائط الصوتية/المرئية' :
          'Excellent use of audio/video support'
        );
        
        // Check consistency between text and transcription
        if (answer.text && analysis.transcription) {
          const textLength = answer.text.length;
          const transcriptionLength = analysis.transcription.length;
          
          if (textLength > 0 && transcriptionLength > 0) {
            try {
              const textSentiment = await analyzeAnswer(
                answer.text,
                '',
                'text',
                questionText
              );
              const transcriptionSentiment = await analyzeAnswer(
                analysis.transcription,
                '',
                'text',
                questionText
              );
              
              console.log('Consistency analysis:', {
                textSentiment,
                transcriptionSentiment
              });

              if (Math.abs(textSentiment.sentimentScore - transcriptionSentiment.sentimentScore) < 0.2) {
                score += 0.5;
                comments.push(
                  language === 'fr' ? 'Bonne cohérence entre réponses écrites et orales' :
                  language === 'ar' ? 'تناسق جيد بين الإجابات المكتوبة والشفهية' :
                  'Good consistency between written and spoken responses'
                );
              } else {
                suggestions.push(
                  language === 'fr' ? 'Veillez à maintenir la même qualité dans vos réponses écrites et orales' :
                  language === 'ar' ? 'احرص على الحفاظ على نفس الجودة في إجاباتك المكتوبة والشفهية' :
                  'Maintain consistent quality in both written and spoken responses'
                );
              }
            } catch (error) {
              console.error('Error analyzing consistency:', error);
            }
          }
        }
      }
    }

    // Normalize final score to be between 0 and 5
    score = Math.min(5, Math.max(0, score));

    // Add general suggestions if score is low
    if (score < 2.5 && (wordCount > 0 || answer.mediaUrl)) {
      suggestions.push(
        language === 'fr' ? 'Structurez mieux votre réponse avec une introduction, des points clés et une conclusion' :
        language === 'ar' ? 'قم بهيكلة إجابتك بشكل أفضل مع مقدمة ونقاط رئيسية وخاتمة' :
        'Better structure your response with an introduction, key points, and conclusion'
      );
    }

    console.log('Generated feedback:', { score, comments, suggestions });

    return {
      score,
      comments: comments.filter(Boolean),
      suggestions: suggestions.filter(Boolean),
    };
  } catch (error) {
    console.error('Error generating feedback:', error);
    return {
      score: 0,
      comments: [],
      suggestions: [
        language === 'fr' ? 'Erreur lors de l\'analyse. Veuillez réessayer.' :
        language === 'ar' ? 'خطأ في التحليل. يرجى المحاولة مرة أخرى.' :
        'Error during analysis. Please try again.'
      ],
    };
  }
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${remainingSeconds}s`);

  return parts.join(' ');
};

const Interview: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    questions,
    currentQuestionIndex,
    answers,
    language,
    isInterviewStarted,
  } = useAppSelector((state) => state.interview);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInterviewStarted) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInterviewStarted]);

  const handleLanguageChange = (newLanguage: Language) => {
    dispatch(setLanguage(newLanguage));
  };

  const handleNext = async () => {
    if (currentAnswer?.text || currentAnswer?.mediaUrl) {
      setIsLoading(true);
      try {
        const analysis = await analyzeAnswer(
          currentAnswer.text || '',
          currentAnswer.mediaUrl || '',
          currentAnswer.mediaType || 'text',
          currentQuestion?.text || ''
        );
        dispatch(setAnswer({
          questionIndex: currentQuestionIndex,
          answer: { ...currentAnswer, analysis }
        }));
        dispatch(nextQuestion());
      } catch (error) {
        console.error('Analysis failed:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handlePrevious = () => {
    dispatch(previousQuestion());
  };

  const handleRetryQuestion = () => {
    dispatch(setAnswer({
      questionIndex: currentQuestionIndex,
      answer: { text: '', mediaUrl: null, mediaType: null }
    }));
  };

  const handleCompleteInterview = async () => {
    try {
      const simplifiedQuestions = questions.map((q: Question) => ({
        id: q.id,
        text: q.text[selectedLanguage],
        type: q.type
      }));

      // Save to localStorage before completing
      const interviewData = {
        jobTitle,
        questions: simplifiedQuestions,
        answers: answers.map((answer: Answer, index: number) => ({
          questionIndex: index,
          text: answer.text,
          mediaUrl: answer.mediaUrl,
          mediaType: answer.mediaType,
          feedback: answer.feedback,
          transcription: answer.transcription || ''
        })),
        completedAt: new Date().toISOString(),
        language: selectedLanguage
      };
      localStorage.setItem('lastInterview', JSON.stringify(interviewData));

      dispatch(completeInterview());
      navigate('/dashboard');
    } catch (err) {
      console.error('Error completing interview:', err);
      setError('Failed to complete interview. Please try again.');
    }
  };

  const handlePreviousQuestion = () => {
    dispatch(previousQuestion());
  };

  const handleNext = async () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // Analyze the answer with language-specific feedback
    const feedback = await getLanguageSpecificFeedback(
      currentAnswer, 
      currentQuestion.text[selectedLanguage],
      selectedLanguage
    );
    
    // Get transcription if available
    let transcription = '';
    if (currentAnswer.mediaUrl && currentAnswer.mediaType) {
      try {
        transcription = await transcribeMedia(currentAnswer.mediaUrl, currentAnswer.mediaType);
      } catch (error) {
        console.error('Transcription failed:', error);
      }
    }
    
    const answerWithFeedback = {
      ...currentAnswer,
      feedback,
      transcription
    };

    // Save the current answer
    dispatch(setAnswer({ 
      answer: answerWithFeedback,
      questionIndex: currentQuestionIndex 
    }));

    if (currentQuestionIndex < questions.length - 1) {
      dispatch(nextQuestion());
    } else {
      // Transform questions to match Dashboard's expected format
      const simplifiedQuestions = questions.map(q => ({
        id: q.id,
        text: q.text[selectedLanguage],
        type: q.type
      }));

      // Get all answers including the last one
      const allAnswers = [...answers];
      allAnswers[currentQuestionIndex] = answerWithFeedback; // Ensure last answer is included

      // Save to localStorage before completing
      const interviewData = {
        jobTitle,
        questions: simplifiedQuestions,
        answers: allAnswers.map((answer, index) => ({
          questionIndex: index,
          text: answer.text,
          mediaUrl: answer.mediaUrl,
          mediaType: answer.mediaType,
          transcription: answer.transcription || '',
          feedback: answer.feedback
        })),
        completedAt: new Date().toISOString(),
        language: selectedLanguage
      };
      const pastInterviews = JSON.parse(localStorage.getItem('pastInterviews') || '[]');
      pastInterviews.push(interviewData);
      localStorage.setItem('pastInterviews', JSON.stringify(pastInterviews));

      // Complete the interview and navigate to dashboard
      dispatch(completeInterview());
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

  const handleAnalyzeClick = async () => {
    if (currentQuestionIndex < 0 || currentQuestionIndex >= answers.length) return;
    
    const currentAnswer = answers[currentQuestionIndex];
    if (!currentAnswer) return;

    setLoading(true);
    setError(null);

    try {
      if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) return;
      
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return;

      const analysis = await analyzeAnswer(
        currentAnswer.text,
        currentAnswer.mediaUrl,
        currentAnswer.mediaType,
        currentQuestion.text[selectedLanguage as keyof typeof currentQuestion.text]
      );
      setCurrentAnalysis(analysis);
      setShowDetailedAnalysis(true);
    } catch (err) {
      setError('Failed to analyze answer. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isInterviewStarted) {
    return <InterviewSetup onStart={() => dispatch(resetInterview())} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Fade in timeout={800}>
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.grey[200]}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.primary.light, 0.05)})`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: theme.palette.grey[900] }}>
                    {t('interview.title')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <LanguageSelector
                      value={language}
                      onChange={handleLanguageChange}
                    />
                    <Chip
                      icon={<Timer />}
                      label={formatTime(elapsedTime)}
                      color="primary"
                      variant="outlined"
                      sx={{ borderWidth: 2 }}
                    />
                  </Box>
                </Box>

                <Stepper
                  activeStep={currentQuestionIndex}
                  sx={{
                    '& .MuiStepLabel-root .Mui-completed': {
                      color: theme.palette.success.main,
                    },
                    '& .MuiStepLabel-label.Mui-completed.MuiStepLabel-alternativeLabel': {
                      color: theme.palette.success.main,
                    },
                    '& .MuiStepLabel-root .Mui-active': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  {questions.map((_, index) => (
                    <Step key={index}>
                      <StepLabel>{t('interview.question', { number: index + 1 })}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Paper>
            </Grid>

            <Grid item xs={12}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.grey[200]}`,
                  overflow: 'visible',
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="h5"
                      gutterBottom
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: theme.palette.grey[900],
                        fontWeight: 600,
                      }}
                    >
                      <QuestionAnswer color="primary" />
                      {t('interview.currentQuestion')}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.primary, fontSize: '1.1rem' }}>
                      {currentQuestion?.text || ''}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      variant="outlined"
                      placeholder={t('interview.answerPlaceholder') || ''}
                      value={currentAnswer?.text || ''}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: theme.palette.background.paper,
                          '&:hover fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: theme.palette.primary.main,
                          },
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ mb: 4 }}>
                    <MediaRecorder
                      onRecordingComplete={handleMediaRecordingComplete}
                      questionId={currentQuestion?.id}
                      existingRecording={
                        currentAnswer?.mediaUrl
                          ? {
                              url: currentAnswer.mediaUrl,
                              type: currentAnswer.mediaType!,
                            }
                          : undefined
                      }
                    />
                  </Box>

                  {currentAnswer?.analysis && (
                    <Box sx={{ mb: 4 }}>
                      <DetailedAnalysis
                        open={true}
                        onClose={() => {}}
                        analysis={currentAnswer.analysis}
                        question={currentQuestion?.text || ''}
                      />
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 2,
                      mt: 4,
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Tooltip title={t('interview.previous')}>
                        <Button
                          variant="outlined"
                          onClick={handlePrevious}
                          disabled={currentQuestionIndex === 0}
                          startIcon={<ArrowBack />}
                        >
                          {t('interview.previous')}
                        </Button>
                      </Tooltip>
                      <Tooltip title={t('interview.retry')}>
                        <Button
                          variant="outlined"
                          onClick={handleRetryQuestion}
                          startIcon={<Refresh />}
                        >
                          {t('interview.retry')}
                        </Button>
                      </Tooltip>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {currentQuestionIndex === questions.length - 1 ? (
                        <Tooltip title={t('interview.complete')}>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={handleCompleteInterview}
                            disabled={!currentAnswer?.text && !currentAnswer?.mediaUrl}
                            startIcon={<Check />}
                          >
                            {t('interview.complete')}
                          </Button>
                        </Tooltip>
                      ) : (
                        <Tooltip title={t('interview.next')}>
                          <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={!currentAnswer?.text && !currentAnswer?.mediaUrl}
                            endIcon={<ArrowForward />}
                          >
                            {t('interview.next')}
                          </Button>
                        </Tooltip>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Fade>

      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            zIndex: 1000,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.grey[200]}`,
            }}
          >
            <CircularProgress size={48} />
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
              {t('interview.analyzing')}
            </Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default Interview; 