import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Box, Typography, CircularProgress } from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store';
import { resetInterview } from '../../features/interview/interviewSlice';
import Setup from './Setup';
import Interview from './Interview';

const InterviewPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const interviewState = useAppSelector((state) => state.interview);
  const { 
    isInterviewStarted, 
    isInterviewComplete, 
    loading, 
    questions 
  } = interviewState;
  
  const [showSetup, setShowSetup] = useState(!isInterviewStarted);
  
  useEffect(() => {
    // If interview is complete, save to localStorage and redirect to dashboard
    if (isInterviewComplete) {
      const interviewData = JSON.stringify({
        ...interviewState,
        completedAt: new Date().toISOString()
      });
      
      // Save to localStorage
      const pastInterviews = JSON.parse(localStorage.getItem('pastInterviews') || '[]');
      pastInterviews.push(JSON.parse(interviewData));
      localStorage.setItem('pastInterviews', JSON.stringify(pastInterviews));
      localStorage.setItem('lastInterview', interviewData);
      
      // Reset interview state
      dispatch(resetInterview());
      
      // Redirect to dashboard
      navigate('/dashboard');
    }
  }, [isInterviewComplete, interviewState, dispatch, navigate]);
  
  const handleSetupComplete = () => {
    setShowSetup(false);
  };
  
  if (loading && questions.length === 0) {
    return (
      <Container maxWidth="md">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '60vh' 
        }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h6">Generating Questions...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {showSetup ? (
          <Setup onComplete={handleSetupComplete} />
        ) : (
          <Interview />
        )}
      </Box>
    </Container>
  );
};

export default InterviewPage;