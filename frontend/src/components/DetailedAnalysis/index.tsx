import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Paper
} from '@mui/material';
import { analyzeAnswer } from '../../services/aiAnalysis';
import { AIAnalysisResult } from '../../types/interview';

interface DetailedAnalysisProps {
  open: boolean;
  onClose: () => void;
  answer: string;
  question: string;
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({
  open,
  onClose,
  answer,
  question
}) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performAnalysis = async () => {
      if (open && answer) {
        try {
          setLoading(true);
          setError(null);
          const result = await analyzeAnswer(answer, undefined, undefined, question);
          setAnalysis(result);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred during analysis');
        } finally {
          setLoading(false);
        }
      }
    };

    performAnalysis();
  }, [open, answer, question]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Detailed Analysis</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Question
          </Typography>
          <Typography paragraph>{question}</Typography>

          <Typography variant="h6" gutterBottom>
            Your Answer
          </Typography>
          <Typography paragraph>{answer}</Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error">{error}</Typography>
          ) : analysis ? (
            <Paper sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Analysis
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Score: {analysis.score}/5
              </Typography>
              <Typography variant="subtitle1" gutterBottom>
                Feedback:
              </Typography>
              <Typography paragraph>{analysis.feedback}</Typography>
            </Paper>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailedAnalysis; 