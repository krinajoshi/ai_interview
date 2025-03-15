import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';

const Interview: React.FC = () => {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = React.useState(0);
  const [answer, setAnswer] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  // Mock interview questions
  const questions = [
    'Tell me about yourself and your experience.',
    'What are your strengths and weaknesses?',
    'Where do you see yourself in 5 years?',
    'Why do you want to work for our company?',
    'Describe a challenging situation you faced at work.',
  ];

  const handleNext = async () => {
    setLoading(true);
    // TODO: Implement API call to analyze answer
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call
    setLoading(false);
    
    if (activeStep < questions.length - 1) {
      setActiveStep((prev) => prev + 1);
      setAnswer('');
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('interview.start')}
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {questions.map((_, index) => (
            <Step key={index}>
              <StepLabel>Question {index + 1}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {questions[activeStep]}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            sx={{ mt: 2 }}
          />

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              onClick={handlePrevious}
              disabled={activeStep === 0 || loading}
            >
              {t('interview.previous')}
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={!answer.trim() || loading}
              endIcon={loading && <CircularProgress size={20} />}
            >
              {activeStep === questions.length - 1
                ? t('interview.end')
                : t('interview.next')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Interview; 