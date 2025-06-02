import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  History as HistoryIcon,
  Assessment as AssessmentIcon,
  PlayArrow as PlayArrowIcon,
  AccessTime as AccessTimeIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { formatScoreAsPercentage } from '../../utils/scoreCalculator';
import TestAnalysis from '../../components/TestAnalysis';
import LanguageSelector, { Language } from '../../components/LanguageSelector';

interface InterviewSummary {
  id: string;
  jobTitle: string;
  completedAt: string;
  overallScore: number;
  language: Language;
  questionCount: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [pastInterviews, setPastInterviews] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('en');
  const [lastInterview, setLastInterview] = useState<any>(null);

  useEffect(() => {
    // Load past interviews from localStorage
    const loadInterviews = () => {
      try {
        const savedInterviews = localStorage.getItem('pastInterviews');
        if (savedInterviews) {
          const interviews = JSON.parse(savedInterviews);
          
          // Transform to expected format
          const formattedInterviews = interviews.map((interview: any, index: number) => ({
            id: `interview-${index}`,
            jobTitle: interview.jobTitle,
            completedAt: interview.completedAt,
            overallScore: calculateOverallScore(interview),
            language: interview.language || 'en',
            questionCount: interview.questions?.length || 0
          }));
          
          setPastInterviews(formattedInterviews);
        }
        
        // Load last interview details
        const lastInterviewData = localStorage.getItem('lastInterview');
        if (lastInterviewData) {
          setLastInterview(JSON.parse(lastInterviewData));
        }
      } catch (error) {
        console.error('Error loading interviews:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInterviews();
  }, []);

  // Calculate overall score from interview data
  const calculateOverallScore = (interview: any): number => {
    if (!interview.answers || interview.answers.length === 0) return 0;
    
    const scores = interview.answers
      .filter((answer: any) => answer.analysis && typeof answer.analysis.score === 'number')
      .map((answer: any) => answer.analysis.score);
    
    if (scores.length === 0) return 0;
    return scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
  };

  const handleStartNewInterview = () => {
    navigate('/interview');
  };

  const handleViewInterview = (interviewId: string) => {
    navigate(`/analytics/${interviewId}`);
  };

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang);
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

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {selectedLanguage === 'fr' ? 'Tableau de bord' :
             selectedLanguage === 'ar' ? 'لوحة التحكم' :
             'Dashboard'}
          </Typography>
          <Box sx={{ minWidth: 200 }}>
            <LanguageSelector value={selectedLanguage} onChange={handleLanguageChange} />
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3, direction: selectedLanguage === 'ar' ? 'rtl' : 'ltr' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">
                  {selectedLanguage === 'fr' ? 'Entretiens récents' :
                   selectedLanguage === 'ar' ? 'المقابلات الأخيرة' :
                   'Recent Interviews'}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleStartNewInterview}
                >
                  {selectedLanguage === 'fr' ? 'Nouvel entretien' :
                   selectedLanguage === 'ar' ? 'مقابلة جديدة' :
                   'New Interview'}
                </Button>
              </Box>

              {pastInterviews.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {selectedLanguage === 'fr' ? 'Vous n\'avez pas encore effectué d\'entretien.' :
                     selectedLanguage === 'ar' ? '.لم تقم بإجراء أي مقابلات بعد' :
                     'You haven\'t completed any interviews yet.'}
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartNewInterview}
                    sx={{ mt: 2 }}
                  >
                    {selectedLanguage === 'fr' ? 'Commencer votre premier entretien' :
                     selectedLanguage === 'ar' ? 'ابدأ مقابلتك الأولى' :
                     'Start your first interview'}
                  </Button>
                </Box>
              ) : (
                <List>
                  {pastInterviews.map((interview) => (
                    <React.Fragment key={interview.id}>
                      <ListItem
                        secondaryAction={
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewInterview(interview.id)}
                          >
                            {selectedLanguage === 'fr' ? 'Voir' :
                             selectedLanguage === 'ar' ? 'عرض' :
                             'View'}
                          </Button>
                        }
                      >
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary={interview.jobTitle}
                          secondary={
                            <React.Fragment>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <AccessTimeIcon fontSize="small" />
                                <Typography variant="body2" component="span">
                                  {new Date(interview.completedAt).toLocaleDateString()}
                                </Typography>
                                <Chip
                                  label={formatScoreAsPercentage(interview.overallScore)}
                                  size="small"
                                  color={
                                    interview.overallScore >= 0.8 ? 'success' :
                                    interview.overallScore >= 0.6 ? 'primary' :
                                    interview.overallScore >= 0.4 ? 'warning' : 'error'
                                  }
                                />
                                <Chip
                                  label={interview.language.toUpperCase()}
                                  size="small"
                                  variant="outlined"
                                />
                              </Box>
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedLanguage === 'fr' ? 'Statistiques' :
                   selectedLanguage === 'ar' ? 'الإحصائيات' :
                   'Statistics'}
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText
                      primary={selectedLanguage === 'fr' ? 'Entretiens terminés' :
                              selectedLanguage === 'ar' ? 'المقابلات المكتملة' :
                              'Completed Interviews'}
                      secondary={pastInterviews.length}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={selectedLanguage === 'fr' ? 'Score moyen' :
                              selectedLanguage === 'ar' ? 'متوسط النتيجة' :
                              'Average Score'}
                      secondary={
                        pastInterviews.length > 0
                          ? formatScoreAsPercentage(
                              pastInterviews.reduce((sum, interview) => sum + interview.overallScore, 0) /
                                pastInterviews.length
                            )
                          : 'N/A'
                      }
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary={selectedLanguage === 'fr' ? 'Questions répondues' :
                              selectedLanguage === 'ar' ? 'الأسئلة المجاب عليها' :
                              'Questions Answered'}
                      secondary={pastInterviews.reduce((sum, interview) => sum + interview.questionCount, 0)}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedLanguage === 'fr' ? 'Ressources' :
                   selectedLanguage === 'ar' ? 'الموارد' :
                   'Resources'}
                </Typography>
                <List dense>
                  <ListItem button component="a" href="#interview-tips">
                    <ListItemText
                      primary={selectedLanguage === 'fr' ? 'Conseils d\'entretien' :
                              selectedLanguage === 'ar' ? 'نصائح للمقابلة' :
                              'Interview Tips'}
                    />
                  </ListItem>
                  <ListItem button component="a" href="#common-questions">
                    <ListItemText
                      primary={selectedLanguage === 'fr' ? 'Questions fréquentes' :
                              selectedLanguage === 'ar' ? 'الأسئلة الشائعة' :
                              'Common Questions'}
                    />
                  </ListItem>
                  <ListItem button component="a" href="#resume-builder">
                    <ListItemText
                      primary={selectedLanguage === 'fr' ? 'Créateur de CV' :
                              selectedLanguage === 'ar' ? 'منشئ السيرة الذاتية' :
                              'Resume Builder'}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {lastInterview && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h5" gutterBottom>
              {selectedLanguage === 'fr' ? 'Votre dernier entretien' :
               selectedLanguage === 'ar' ? 'مقابلتك الأخيرة' :
               'Your Last Interview'}
            </Typography>
            
            <TestAnalysis
              overallScore={calculateOverallScore(lastInterview)}
              technicalScore={0.75} // This would come from the actual interview data
              communicationScore={0.8} // This would come from the actual interview data
              strengths={[
                'Clear communication',
                'Strong technical knowledge',
                'Good problem-solving approach'
              ]}
              weaknesses={[
                'Could provide more specific examples',
                'Some hesitation in responses'
              ]}
              language={selectedLanguage}
            />
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;