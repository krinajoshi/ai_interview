import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { 
  setJobTitle, 
  setJobDescription, 
  generateQuestions, 
  startInterview,
  setLanguage
} from '../../features/interview/interviewSlice';
import LanguageSelector, { Language } from '../../components/LanguageSelector';

interface SetupProps {
  onComplete: () => void;
}

const Setup: React.FC<SetupProps> = ({ onComplete }) => {
  const dispatch = useAppDispatch();
  const { jobTitle, jobDescription, loading, error, selectedLanguage } = useAppSelector(
    (state) => state.interview
  );
  
  const [formError, setFormError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!jobTitle.trim()) {
      setFormError('Job title is required');
      return;
    }
    
    setFormError('');
    
    try {
      // Generate questions
      await dispatch(generateQuestions({ 
        jobTitle, 
        jobDescription: jobDescription || undefined,
        language: selectedLanguage 
      })).unwrap();
      
      // Start interview
      dispatch(startInterview());
      
      // Notify parent component
      onComplete();
    } catch (err) {
      console.error('Failed to generate questions:', err);
    }
  };
  
  const handleLanguageChange = (lang: Language) => {
    dispatch(setLanguage(lang));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Interview Setup
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
      
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Required Information
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="jobTitle"
              label="Job Title"
              value={jobTitle}
              onChange={(e) => dispatch(setJobTitle(e.target.value))}
              disabled={loading}
              helperText="Enter the job title you're interviewing for"
            />
          </Grid>
          
          <Grid item xs={12}>
            <LanguageSelector 
              value={selectedLanguage} 
              onChange={handleLanguageChange}
              label="Preferred Language" 
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Optional Information
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              id="jobDescription"
              label="Job Description"
              multiline
              rows={4}
              value={jobDescription || ''}
              onChange={(e) => dispatch(setJobDescription(e.target.value))}
              disabled={loading}
              helperText="Paste the job description here to generate more relevant questions"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} sx={{ mr: 1 }} />
                  Generating Questions...
                </>
              ) : (
                'Start Interview'
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default Setup;