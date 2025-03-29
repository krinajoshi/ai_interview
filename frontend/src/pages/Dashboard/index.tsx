import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
  Rating,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import AssessmentIcon from '@mui/icons-material/Assessment';

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

interface Interview {
  jobTitle: string;
  questions: Array<{ 
    id: string; 
    text: string;
    type: string;
  }>;
  answers: Record<string, Answer>;
  completedAt: string;
  language: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading, error } = useAppSelector((state) => state.auth);
  const [pastInterviews, setPastInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
    if (!user && !loading) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const stored = localStorage.getItem('pastInterviews');
    if (stored) {
      setPastInterviews(JSON.parse(stored));
    }
  }, []);

  const calculateAverageScore = (interview: Interview) => {
    const scores = Object.values(interview.answers)
      .map(answer => answer.feedback?.score || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const handleViewResponses = (interview: Interview) => {
    setSelectedInterview(interview);
  };

  const handleCloseDialog = () => {
    setSelectedInterview(null);
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('common.dashboard')}
        </Typography>
        
        <Grid container spacing={3}>
          {/* Welcome Card */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                {t('dashboard.welcomeBack', { name: user.name })}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/interview')}
                sx={{ mt: 2 }}
              >
                {t('interview.start')}
              </Button>
            </Paper>
          </Grid>

          {/* Past Interviews */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Past Interviews
            </Typography>
            <Grid container spacing={2}>
              {pastInterviews.map((interview, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {interview.jobTitle}
                      </Typography>
                      <Typography color="text.secondary">
                        Date: {new Date(interview.completedAt).toLocaleDateString()}
                      </Typography>
                      <Typography color="text.secondary">
                        Questions: {interview.questions.length}
                      </Typography>
                      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography component="span">Average Score:</Typography>
                        <Rating 
                          value={calculateAverageScore(interview) / 5} 
                          readOnly 
                          precision={0.1}
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleViewResponses(interview)}
                        startIcon={<AssessmentIcon />}
                      >
                        View Detailed Analysis
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>

        {/* Interview Responses Dialog */}
        <Dialog
          open={!!selectedInterview}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h6">
              Interview Analysis - {selectedInterview?.jobTitle}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Completed on: {selectedInterview && new Date(selectedInterview.completedAt).toLocaleString()}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <List>
              {selectedInterview?.questions.map((question, index) => (
                <React.Fragment key={question.id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="subtitle1">
                            Q{index + 1}: {question.text}
                          </Typography>
                          {selectedInterview.answers[question.id]?.feedback && (
                            <Rating
                              value={selectedInterview.answers[question.id].feedback!.score / 5}
                              readOnly
                              precision={0.1}
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          {/* Text Answer */}
                          <Typography
                            component="div"
                            variant="body2"
                            color="text.primary"
                            sx={{ whiteSpace: 'pre-wrap', mb: 2 }}
                          >
                            {selectedInterview.answers[question.id]?.text || 'No text answer provided'}
                          </Typography>
                          
                          {/* Media Response */}
                          {selectedInterview.answers[question.id]?.mediaUrl && (
                            <Box sx={{ mt: 2, mb: 2 }}>
                              <Chip
                                icon={selectedInterview.answers[question.id].mediaType === 'video' ? 
                                  <VideocamIcon /> : <MicIcon />}
                                label={`${selectedInterview.answers[question.id].mediaType === 'video' ? 
                                  'Video' : 'Audio'} Response`}
                                color="primary"
                                variant="outlined"
                                sx={{ mb: 1 }}
                              />
                              {selectedInterview.answers[question.id].mediaType === 'video' ? (
                                <video
                                  controls
                                  src={selectedInterview.answers[question.id].mediaUrl}
                                  style={{ maxWidth: '100%' }}
                                />
                              ) : (
                                <audio
                                  controls
                                  src={selectedInterview.answers[question.id].mediaUrl}
                                  style={{ width: '100%' }}
                                />
                              )}
                            </Box>
                          )}

                          {/* Feedback */}
                          {selectedInterview.answers[question.id]?.feedback && (
                            <Card variant="outlined" sx={{ mt: 2, bgcolor: 'grey.50' }}>
                              <CardContent>
                                <Typography variant="subtitle2" gutterBottom>
                                  Analysis:
                                </Typography>
                                
                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  Positive Points:
                                </Typography>
                                <ul style={{ margin: '0.5rem 0' }}>
                                  {selectedInterview.answers[question.id].feedback!.comments.map((comment, i) => (
                                    <li key={i}>
                                      <Typography variant="body2">{comment}</Typography>
                                    </li>
                                  ))}
                                </ul>

                                <Typography variant="body2" sx={{ mt: 1 }}>
                                  Suggestions:
                                </Typography>
                                <ul style={{ margin: '0.5rem 0' }}>
                                  {selectedInterview.answers[question.id].feedback!.suggestions.map((suggestion, i) => (
                                    <li key={i}>
                                      <Typography variant="body2">{suggestion}</Typography>
                                    </li>
                                  ))}
                                </ul>
                              </CardContent>
                            </Card>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < selectedInterview.questions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Dashboard; 