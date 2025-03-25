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
import { analyzeAnswer, AIAnalysisResult } from '../../services/aiAnalysis';

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

      // Emotion analysis (0-1 points)
      const confidenceEmotion = analysis.emotions.find(e => e.label === 'confidence');
      const professionalEmotion = analysis.emotions.find(e => e.label === 'neutral');
      
      console.log('Emotions:', { confidenceEmotion, professionalEmotion });
      
      if (confidenceEmotion && confidenceEmotion.score > 0.6) {
        score += 1;
        comments.push(
          language === 'fr' ? 'Excellente confiance dans la réponse' :
          language === 'ar' ? 'ثقة ممتازة في الإجابة' :
          'Excellent confidence in the response'
        );
      } else if (professionalEmotion && professionalEmotion.score > 0.6) {
        score += 0.8;
        comments.push(
          language === 'fr' ? 'Ton professionnel approprié' :
          language === 'ar' ? 'نبرة مهنية مناسبة' :
          'Appropriate professional tone'
        );
      }

      // Question relevance analysis (0-1 points)
      if (wordCount > 0) {
        const questionKeywords = questionText.toLowerCase().split(/\s+/).filter(word => word.length > 3);
        const answerWords = answer.text.toLowerCase().split(/\s+/);
        const relevantKeywordsCount = questionKeywords.filter(keyword => 
          answerWords.some(word => word.includes(keyword) || keyword.includes(word))
        ).length;
        const relevanceScore = relevantKeywordsCount / Math.max(1, questionKeywords.length);

        console.log('Relevance analysis:', {
          questionKeywords,
          answerWords,
          relevantKeywordsCount,
          relevanceScore
        });

        if (relevanceScore >= 0.5) {
          score += 1;
          comments.push(
            language === 'fr' ? 'Réponse bien alignée avec la question' :
            language === 'ar' ? 'الإجابة متوافقة جيداً مع السؤال' :
            'Response well-aligned with the question'
          );
        } else if (relevanceScore < 0.3) {
          suggestions.push(
            language === 'fr' ? 'Assurez-vous que votre réponse aborde directement la question posée' :
            language === 'ar' ? 'تأكد من أن إجابتك تتناول السؤال المطروح مباشرة' :
            'Ensure your answer directly addresses the question asked'
          );
        }
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
    const feedback = await getLanguageSpecificFeedback(
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
      // Transform questions to match Dashboard's expected format
      const simplifiedQuestions = questions.map(q => ({
        id: q.id,
        text: q.text[selectedLanguage], // Use the current language's text
        type: q.type
      }));

      // Save to localStorage before completing
      const interviewData = {
        jobTitle,
        questions: simplifiedQuestions,
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

      // Complete the interview and navigate to dashboard
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
        </Paper>
      </Box>
    </Container>
  );
};

export default Interview; 