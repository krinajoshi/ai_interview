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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import AssessmentIcon from '@mui/icons-material/Assessment';

interface Interview {
  jobTitle: string;
  questions: Array<{ 
    id: string; 
    text: string;
    type: string;
  }>;
  answers: Array<{
    questionIndex: number;
    text: string;
    mediaUrl?: string;
    mediaType?: 'audio' | 'video';
    transcription?: string;
    analysis?: {
      score: number;
      feedback: string;
      strongPoints: string[];
      areasForImprovement: string[];
      structureAnalysis: string;
      technicalAccuracy: string;
      communicationStyle: string;
      actionItems: string[];
    };
  }>;
  completedAt: string;
  language: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [pastInterviews, setPastInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pastInterviews');
    if (stored) {
      setPastInterviews(JSON.parse(stored));
    }
  }, []);

  const calculateAverageScore = (interview: Interview) => {
    const scores = interview.answers.map(answer => answer.analysis?.score || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  };

  const handleViewResponses = (interview: Interview) => {
    setSelectedInterview(interview);
  };

  const handleCloseDialog = () => {
    setSelectedInterview(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('dashboard.title')}
        </Typography>

        {/* Welcome Card */}
        <Grid item xs={12} sx={{ mb: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Welcome back, {user?.name}!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/interview')}
              sx={{ mt: 2 }}
            >
              Start Interview
            </Button>
          </Paper>
        </Grid>

        {/* Past Interviews */}
        <Typography variant="h6" gutterBottom>
          Past Interviews
        </Typography>
        <Grid container spacing={3}>
          {pastInterviews.map((interview, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {interview.jobTitle}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {t('dashboard.completedOn')}: {new Date(interview.completedAt).toLocaleString()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <AssessmentIcon color="primary" />
                    <Typography variant="body2">
                      {t('dashboard.averageScore')}: {calculateAverageScore(interview).toFixed(1)}/5
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {t('dashboard.questionsAnswered')}: {interview.answers.length}/{interview.questions.length}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={<PlayCircleIcon />}
                    onClick={() => handleViewResponses(interview)}
                  >
                    {t('dashboard.viewResponses')}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

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
                          {selectedInterview.answers[index]?.analysis && (
                            <Rating
                              value={selectedInterview.answers[index].analysis!.score / 5}
                              readOnly
                              precision={0.1}
                              size="small"
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Answer: {selectedInterview.answers[index]?.text || selectedInterview.answers[index]?.transcription || 'No answer provided'}
                          </Typography>
                          {selectedInterview.answers[index]?.analysis && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" color="primary">
                                Feedback:
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {selectedInterview.answers[index].analysis?.feedback || 'No feedback available'}
                              </Typography>
                              
                              <Typography variant="subtitle2" color="primary">
                                Strong Points:
                              </Typography>
                              <List>
                                {(selectedInterview.answers[index].analysis?.strongPoints || []).map((point: string, i: number) => (
                                  <ListItem key={i}>
                                    <ListItemText primary={point} />
                                  </ListItem>
                                ))}
                              </List>

                              <Typography variant="subtitle2" color="primary">
                                Areas for Improvement:
                              </Typography>
                              <List>
                                {(selectedInterview.answers[index].analysis?.areasForImprovement || []).map((area: string, i: number) => (
                                  <ListItem key={i}>
                                    <ListItemText primary={area} />
                                  </ListItem>
                                ))}
                              </List>

                              <Typography variant="subtitle2" color="primary">
                                Technical Accuracy:
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {selectedInterview.answers[index].analysis?.technicalAccuracy || 'No technical accuracy analysis available'}
                              </Typography>

                              <Typography variant="subtitle2" color="primary">
                                Communication Style:
                              </Typography>
                              <Typography variant="body2" paragraph>
                                {selectedInterview.answers[index].analysis?.communicationStyle || 'No communication style analysis available'}
                              </Typography>

                              <Typography variant="subtitle2" color="primary">
                                Action Items:
                              </Typography>
                              <List>
                                {(selectedInterview.answers[index].analysis?.actionItems || []).map((item: string, i: number) => (
                                  <ListItem key={i}>
                                    <ListItemText primary={item} />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
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