import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setJobTitle,
  setResume,
  setJobDescription,
  setQuestions,
  startInterview,
  setLoading,
  setError,
} from '../../features/interview/interviewSlice';

const API_URL = 'http://localhost:8001';

const InterviewSetup: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.interview);

  const [jobTitleInput, setJobTitleInput] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [storedResumeFile, setStoredResumeFile] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        dispatch(setResume(text));
      };
      reader.readAsText(file);
    }
  };

  const handleStartInterview = async () => {
    if (!jobTitleInput.trim()) {
      dispatch(setError('Job title is required'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      dispatch(setJobTitle(jobTitleInput));
      dispatch(setJobDescription(jobDescriptionText || null));

      const response = await fetch(`${API_URL}/api/v1/interview/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobTitle: jobTitleInput,
          resume: resumeFile ? await resumeFile.text() : null,
          jobDescription: jobDescriptionText || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview questions');
      }

      const data = await response.json();
      if (data.resumeFileName) {
        setStoredResumeFile(data.resumeFileName);
      }
      dispatch(setQuestions(data.questions));
      dispatch(startInterview());
      navigate('/interview');
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to start interview'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Interview Setup
          </Typography>
          <Button
            variant="outlined"
            onClick={handleBack}
          >
            Back to Dashboard
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {storedResumeFile && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Resume stored successfully: {storedResumeFile}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Required Information
            </Typography>
            <TextField
              fullWidth
              label="Job Title"
              value={jobTitleInput}
              onChange={(e) => setJobTitleInput(e.target.value)}
              required
              placeholder="e.g., Senior Frontend Developer"
              sx={{ mb: 2 }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Optional Information
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Providing your resume and job description will help generate more relevant questions.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <input
                accept=".txt,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="resume-file"
                type="file"
                onChange={handleResumeUpload}
              />
              <label htmlFor="resume-file">
                <Button variant="outlined" component="span" fullWidth>
                  Upload Resume
                </Button>
              </label>
              {resumeFile && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  File selected: {resumeFile.name}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Job Description"
              value={jobDescriptionText}
              onChange={(e) => setJobDescriptionText(e.target.value)}
              placeholder="Paste the job description here..."
            />
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleStartInterview}
            disabled={loading || !jobTitleInput.trim()}
            sx={{ mt: 2 }}
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
        </Paper>
      </Box>
    </Container>
  );
};

export default InterviewSetup; 