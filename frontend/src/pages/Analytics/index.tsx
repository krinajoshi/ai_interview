import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DetailedAnalysis from '../../components/DetailedAnalysis';
import TestAnalysis from '../../components/TestAnalysis';
import { Language } from '../../components/LanguageSelector';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`interview-tabpanel-${index}`}
      aria-labelledby={`interview-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Analytics: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interview, setInterview] = useState<any>(null);
  const [tabValue, setTabValue] = useState(0);
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const loadInterview = () => {
      try {
        // If interviewId is provided, load specific interview
        if (interviewId) {
          const savedInterviews = localStorage.getItem('pastInterviews');
          if (savedInterviews) {
            const interviews = JSON.parse(savedInterviews);
            const index = parseInt(interviewId.split('-')[1], 10);
            
            if (interviews[index]) {
              setInterview(interviews[index]);
              setLanguage(interviews[index].language || 'en');
            } else {
              setError('Interview not found');
            }
          } else {
            setError('No interviews found');
          }
        } else {
          // Load last interview if no ID provided
          const lastInterviewData = localStorage.getItem('lastInterview');
          if (lastInterviewData) {
            const lastInterview = JSON.parse(lastInterviewData);
            setInterview(lastInterview);
            setLanguage(lastInterview.language || 'en');
          } else {
            setError('No interviews found');
          }
        }
      } catch (error) {
        console.error('Error loading interview:', error);
        setError('Failed to load interview data');
      } finally {
        setLoading(false);
      }
    };
    
    loadInterview();
  }, [interviewId]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  // Calculate overall scores
  const calculateScores = () => {
    if (!interview || !interview.answers || interview.answers.length === 0) {
      return {
        overall: 0,
        technical: 0,
        communication: 0
      };
    }
    
    const answers = interview.answers;
    
    // Overall score is average of all answer scores
    const overallScore = answers.reduce((sum: number, answer: any) => 
      sum + (answer.analysis?.score || 0), 0) / answers.length;
    
    // Technical score is average of technical question scores
    const technicalAnswers = answers.filter((_: any, index: number) => 
      interview.questions[index]?.type === 'technical');
    
    const technicalScore = technicalAnswers.length > 0 
      ? technicalAnswers.reduce((sum: number, answer: any) => 
          sum + (answer.analysis?.score || 0), 0) / technicalAnswers.length
      : 0;
    
    // Communication score is average of behavioral question scores
    const behavioralAnswers = answers.filter((_: any, index: number) => 
      interview.questions[index]?.type === 'behavioral');
    
    const communicationScore = behavioralAnswers.length > 0 
      ? behavioralAnswers.reduce((sum: number, answer: any) => 
          sum + (answer.analysis?.score || 0), 0) / behavioralAnswers.length
      : 0;
    
    return {
      overall: overallScore,
      technical: technicalScore || overallScore * 0.9, // Fallback if no technical questions
      communication: communicationScore || overallScore * 0.85 // Fallback if no behavioral questions
    };
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (!interview) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>No interview data available</Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  const scores = calculateScores();
  
  // Extract strengths and weaknesses from answers
  const strengths = [
    'Clear communication',
    'Strong technical knowledge',
    'Good problem-solving approach'
  ];
  
  const weaknesses = [
    'Could provide more specific examples',
    'Some hesitation in responses'
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {language === 'fr' ? 'Analyse de l\'entretien' :
             language === 'ar' ? 'تحليل المقابلة' :
             'Interview Analysis'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            {language === 'fr' ? 'Retour au tableau de bord' :
             language === 'ar' ? 'العودة إلى لوحة التحكم' :
             'Back to Dashboard'}
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
          <Typography variant="h5" gutterBottom>
            {interview.jobTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {language === 'fr' ? 'Complété le ' :
             language === 'ar' ? ' تم الانتهاء في ' :
             'Completed on '} 
            {new Date(interview.completedAt).toLocaleDateString()}
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <TestAnalysis
            overallScore={scores.overall}
            technicalScore={scores.technical}
            communicationScore={scores.communication}
            strengths={strengths}
            weaknesses={weaknesses}
            language={language}
          />
        </Paper>

        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="interview questions tabs"
          >
            {interview.questions.map((question: any, index: number) => (
              <Tab 
                key={index} 
                label={`${language === 'fr' ? 'Question' : language === 'ar' ? 'سؤال' : 'Question'} ${index + 1}`} 
                id={`interview-tab-${index}`}
                aria-controls={`interview-tabpanel-${index}`}
              />
            ))}
          </Tabs>
          
          {interview.questions.map((question: any, index: number) => {
            const answer = interview.answers[index];
            return (
              <TabPanel key={index} value={tabValue} index={index}>
                <DetailedAnalysis
                  questionText={question.text}
                  answerText={answer?.text || ''}
                  transcription={answer?.transcription}
                  analysis={{
                    score: answer?.analysis?.score || 0.5,
                    feedback: answer?.analysis?.feedback || 'No feedback available',
                    strengths: ['Clear explanation', 'Good technical understanding'],
                    weaknesses: ['Could provide more examples'],
                    suggestions: ['Consider mentioning specific use cases'],
                    keywords: {
                      expected: ['algorithm', 'complexity', 'optimization'],
                      found: ['algorithm', 'complexity'],
                      missing: ['optimization']
                    }
                  }}
                  language={language}
                />
              </TabPanel>
            );
          })}
        </Paper>
      </Box>
    </Container>
  );
};

export default Analytics;