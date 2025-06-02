import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import { useAppSelector } from '../../store';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" gutterBottom>
              AI Interview Preparation
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              Practice interviews in multiple languages with AI feedback
            </Typography>
            <Typography variant="body1" paragraph>
              Prepare for job interviews with our AI-powered platform. Get personalized questions based on your target role and receive detailed feedback on your responses.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleGetStarted}
                sx={{ mr: 2 }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/about')}
              >
                Learn More
              </Button>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              sx={{
                height: 400,
                backgroundColor: 'grey.200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant="h5" color="text.secondary">
                App Screenshot
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ mt: 8 }}>
          <Typography variant="h4" gutterBottom textAlign="center">
            Key Features
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Personalized Questions
                </Typography>
                <Typography variant="body2">
                  Get interview questions tailored to your specific job role and description.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Multilingual Support
                </Typography>
                <Typography variant="body2">
                  Practice interviews in English, French, and Arabic with seamless language switching.
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  AI-Powered Feedback
                </Typography>
                <Typography variant="body2">
                  Receive detailed feedback on your responses, including content quality, language proficiency, and communication style.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;