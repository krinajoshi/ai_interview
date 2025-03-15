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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';

interface Interview {
  jobTitle: string;
  questions: Array<{ id: string; text: string; type: string }>;
  answers: Record<string, string>;
  completedAt: string;
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

  const handleViewResponses = (interview: Interview) => {
    setSelectedInterview(interview);
  };

  const handleCloseDialog = () => {
    setSelectedInterview(null);
  };

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
                Welcome back, {user?.fullName}!
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate('/interview')}
                sx={{ mt: 2 }}
              >
                {t('Start Interview')}
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
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleViewResponses(interview)}
                      >
                        View Responses
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
            Interview Responses - {selectedInterview?.jobTitle}
          </DialogTitle>
          <DialogContent>
            <List>
              {selectedInterview?.questions.map((question, index) => (
                <React.Fragment key={question.id}>
                  <ListItem>
                    <ListItemText
                      primary={`Q${index + 1}: ${question.text}`}
                      secondary={
                        <Typography
                          component="div"
                          variant="body2"
                          color="text.primary"
                          sx={{ mt: 1, whiteSpace: 'pre-wrap' }}
                        >
                          {selectedInterview.answers[question.id] || 'No answer provided'}
                        </Typography>
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