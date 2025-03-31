import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
} from '@mui/material';
import { AIAnalysisResult } from '../../types/interview';

interface DetailedAnalysisProps {
  open: boolean;
  onClose: () => void;
  analysis: AIAnalysisResult;
  question: string;
  answer: {
    text: string;
    mediaUrl?: string;
    mediaType?: 'audio' | 'video';
  };
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({
  open,
  onClose,
  analysis,
  question,
  answer
}) => {
  const {
    score,
    feedback,
    comments,
    suggestions,
    sentiment,
    improvement_points,
    transcription
  } = analysis;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Detailed Analysis</DialogTitle>
      <DialogContent>
        {/* Question */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Question</Typography>
          <Typography variant="body1" color="text.secondary">
            {question}
          </Typography>
        </Box>

        {/* Answer */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Your Answer</Typography>
          {answer.mediaUrl ? (
            <Box sx={{ mb: 2 }}>
              {answer.mediaType === 'video' ? (
                <video controls src={answer.mediaUrl} style={{ maxWidth: '100%', maxHeight: '300px' }} />
              ) : (
                <audio controls src={answer.mediaUrl} />
              )}
            </Box>
          ) : null}
          {answer.text && (
            <Typography variant="body1" color="text.secondary">
              {answer.text}
            </Typography>
          )}
        </Paper>

        {/* Transcription */}
        {transcription && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Transcription</Typography>
            <Typography variant="body1" color="text.secondary">
              {transcription}
            </Typography>
          </Paper>
        )}

        {/* Score */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Overall Score</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={(score / 5) * 100}
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Typography variant="body1">
              {score.toFixed(1)}/5
            </Typography>
          </Box>
        </Paper>

        {/* Sentiment Analysis */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Sentiment Analysis</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={sentiment.score * 100}
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <Typography variant="body1">
              {sentiment.label}
            </Typography>
          </Box>
        </Paper>

        {/* Cohere AI Feedback */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>AI Feedback</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
            {feedback}
          </Typography>
        </Paper>

        {/* Positive Comments */}
        {comments.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Positive Points</Typography>
            <List>
              {comments.map((comment, index) => (
                <ListItem key={index}>
                  <ListItemText primary={comment} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Suggestions for Improvement */}
        {suggestions.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>Suggestions for Improvement</Typography>
            <List>
              {suggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Areas for Improvement */}
        {improvement_points.length > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Areas for Improvement</Typography>
            <List>
              {improvement_points.map((point, index) => (
                <ListItem key={index}>
                  <ListItemText primary={point} />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailedAnalysis; 