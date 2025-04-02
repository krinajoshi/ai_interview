import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  ListItemIcon,
  Alert,
  Divider,
} from '@mui/material';
import { CheckCircle, Warning, Assignment, Star, Feedback, TrendingUp, Build, Chat, Task } from '@mui/icons-material';
import { AIAnalysisResult, Answer } from '../../types/interview';
import { analyzeAnswer } from '../../services/aiAnalysis';

interface DetailedAnalysisProps {
  open: boolean;
  onClose: () => void;
  answer: Answer;
  question: string;
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({ open, onClose, answer, question }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const performAnalysis = async () => {
      if (!open) return;

      try {
        setLoading(true);
        setError(null);
        
        // Get the answer text (either from text or transcription)
        const answerText = answer.transcription || answer.text;
        
        if (!answerText) {
          setError('No answer text available for analysis');
          return;
        }

        console.log('Starting analysis for:', { answerText, question });
        
        // Perform analysis
        const analysisResult = await analyzeAnswer(
          answerText,
          answer.mediaUrl,
          answer.mediaType,
          question
        );
        
        console.log('Analysis completed:', analysisResult);
        setAnalysis(analysisResult);
      } catch (err) {
        console.error('Error performing analysis:', err);
        setError('Failed to analyze the answer. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      performAnalysis();
    }
  }, [open, answer, question]);

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h5">Detailed Analysis</Typography>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Question:
            </Typography>
            <Typography>{question}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Your Answer:
            </Typography>
            <Typography>
              {answer.transcription || answer.text}
            </Typography>
          </Box>

          {answer.transcription && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Transcription:
              </Typography>
              <Typography>
                {answer.transcription}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : analysis ? (
            <>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Star color="primary" />
                <Typography variant="h6">
                  Overall Score: {analysis.score}/5
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Feedback color="primary" />
                  Feedback:
                </Typography>
                <Typography>
                  {analysis.feedback}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="success" />
                  Strong Points:
                </Typography>
                <List>
                  {analysis.strong_points.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="warning" />
                  Areas for Improvement:
                </Typography>
                <List>
                  {analysis.improvement_points.map((point, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Build color="primary" />
                  Structure Analysis:
                </Typography>
                <Typography>
                  {analysis.structure_analysis}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Build color="primary" />
                  Technical Accuracy:
                </Typography>
                <Typography>
                  {analysis.technical_accuracy}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chat color="primary" />
                  Communication Style:
                </Typography>
                <Typography>
                  {analysis.communication_style}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Task color="primary" />
                  Action Items:
                </Typography>
                <List>
                  {analysis.action_items.map((item, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <Assignment color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </>
          ) : null}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default DetailedAnalysis; 