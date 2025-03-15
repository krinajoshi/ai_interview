import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Typography variant="h2" component="h1" gutterBottom>
        Welcome to AI Interview Platform
      </Typography>
      <Typography variant="h5" component="h2" gutterBottom>
        Prepare for your next interview with AI-powered practice sessions
      </Typography>
      <Box sx={{ mt: 4 }}>
        <Button
          component={Link}
          to="/register"
          variant="contained"
          color="primary"
          size="large"
          sx={{ mr: 2 }}
        >
          Get Started
        </Button>
        <Button
          component={Link}
          to="/login"
          variant="outlined"
          color="primary"
          size="large"
        >
          Login
        </Button>
      </Box>
    </Box>
  );
};

export default Home; 