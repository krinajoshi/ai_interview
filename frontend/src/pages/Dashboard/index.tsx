import React from 'react';
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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  // Mock data for recent interviews
  const recentInterviews = [
    { id: 1, title: 'Frontend Developer Interview', date: '2024-03-20', score: 85 },
    { id: 2, title: 'Backend Developer Interview', date: '2024-03-18', score: 92 },
    { id: 3, title: 'Full Stack Developer Interview', date: '2024-03-15', score: 78 },
  ];

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

          {/* Recent Interviews */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Recent Interviews
            </Typography>
            <Grid container spacing={2}>
              {recentInterviews.map((interview) => (
                <Grid item xs={12} md={4} key={interview.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {interview.title}
                      </Typography>
                      <Typography color="text.secondary">
                        Date: {interview.date}
                      </Typography>
                      <Typography color="text.secondary">
                        Score: {interview.score}%
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small" onClick={() => navigate(`/interview/${interview.id}`)}>
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Quick Stats */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Total Interviews
              </Typography>
              <Typography variant="h4">15</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Average Score
              </Typography>
              <Typography variant="h4">85%</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Skills Assessed
              </Typography>
              <Typography variant="h4">8</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Dashboard; 