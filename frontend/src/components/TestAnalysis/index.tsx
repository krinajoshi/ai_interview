import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress
} from '@mui/material';
import { analyzeAnswer } from '../../services/aiAnalysis';

const TestAnalysis: React.FC = () => {
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    try {
      setLoading(true);
      setError(null);
      const analysisResult = await analyzeAnswer(answer);
      setResult(analysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Test Analysis
      </Typography>
      
      <TextField
        fullWidth
        multiline
        rows={4}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Enter your answer to analyze..."
        sx={{ mb: 2 }}
      />
      
      <Button
        variant="contained"
        onClick={handleAnalyze}
        disabled={loading || !answer.trim()}
        sx={{ mb: 3 }}
      >
        Analyze Answer
      </Button>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analysis Results
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            Score: {result.score}/5
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            Feedback:
          </Typography>
          <Typography paragraph>{result.feedback}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TestAnalysis; 