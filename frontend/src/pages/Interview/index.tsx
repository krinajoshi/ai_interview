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
  IconButton,
} from '@mui/material';
import { Analytics as AnalyticsIcon } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setAnswer,
  nextQuestion,
  previousQuestion,
  completeInterview,
  resetInterview,
  setLanguage,
} from '../../features/interview/interviewSlice';
import { Answer, Question, AIAnalysisResult } from '../../types/interview';
import { Language } from '../../components/LanguageSelector';
import InterviewSetup from './Setup';
import MediaRecorder from '../../components/MediaRecorder';
import LanguageSelector from '../../components/LanguageSelector';
import { analyzeAnswer, transcribeMedia } from '../../services/aiAnalysis';
import DetailedAnalysis from '../../components/DetailedAnalysis';

const getLanguageSpecificFeedback = async (answer: Answer, questionText: string, language: Language): Promise<Answer['feedback']> => {
  try {
    // Check for empty answer
    if (!answer.text.trim() && !answer.mediaUrl) {
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
      analysis = await analyzeAnswer(answer.text, answer.mediaUrl, answer.mediaType);
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
    const wordCount = answer.text.trim().split(/\s+/).length;
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
      console.log('Sentiment score:', analysis.sentiment.score);
      if (analysis.sentiment.score >= 0.8) {
        score += 2;
        comments.push(
          language === 'fr' ? 'Excellent ton professionnel et positif' :
          language === 'ar' ? 'نبرة مهنية وإيجابية ممتازة' :
          'Excellent professional and positive tone'
        );
      } else if (analysis.sentiment.score >= 0.6) {
        score += 1.5;
        comments.push(
          language === 'fr' ? 'Bon ton professionnel' :
          language === 'ar' ? 'نبرة مهنية جيدة' :
          'Good professional tone'
        );
      } else if (analysis.sentiment.score < 0.4) {
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
        if (answer.text.length > 0 && analysis.transcription.length > 0) {
          try {
            const textSentiment = await analyzeAnswer(answer.text);
            const transcriptionSentiment = await analyzeAnswer(analysis.transcription);
            
            console.log('Consistency analysis:', {
              textSentiment,
              transcriptionSentiment
            });

            if (Math.abs(textSentiment.sentiment.score - transcriptionSentiment.sentiment.score) < 0.2) {
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

const Interview: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = React.useState(false);
  const [currentAnalysis, setCurrentAnalysis] = React.useState<AIAnalysisResult | null>(null);

  const {
    questions,
    currentQuestionIndex,
    answers,
    isInterviewStarted,
    isInterviewComplete,
    language: selectedLanguage,
    jobTitle,
  } = useAppSelector((state) => state.interview);

  const [currentAnswer, setCurrentAnswer] = React.useState<Answer>({ text: '' });

  React.useEffect(() => {
    if (isInterviewStarted && questions.length > 0 && currentQuestionIndex >= 0) {
      const answer = answers[currentQuestionIndex];
      setCurrentAnswer(answer || { text: '' });
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

  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

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

          {/* Add Analysis Button */}
          {answers[currentQuestionIndex]?.text && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={handleAnalyzeClick}
                startIcon={<AnalyticsIcon />}
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'View Detailed Analysis'}
              </Button>
            </Box>
          )}
        </Paper>
      </Box>

      {/* Detailed Analysis Dialog */}
      {currentAnalysis && (
        <DetailedAnalysis
          open={showDetailedAnalysis}
          onClose={() => setShowDetailedAnalysis(false)}
          analysis={currentAnalysis}
          question={questions[currentQuestionIndex].text[selectedLanguage]}
        />
      )}
    </Container>
  );
};

export default Interview; 