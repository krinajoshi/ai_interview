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
  Grid,
  Divider,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  RecordVoiceOver as RecordVoiceOverIcon,
  Psychology as PsychologyIcon,
  Analytics as AnalyticsIcon,
  Speed as SpeedIcon,
  Spellcheck as SpellcheckIcon,
} from '@mui/icons-material';
import { AIAnalysisResult } from '../../types/interview';

interface DetailedAnalysisProps {
  open: boolean;
  onClose: () => void;
  analysis: AIAnalysisResult;
  question: string;
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({
  open,
  onClose,
  analysis,
  question,
}) => {
  const formatScore = (score: number): string => `${(score * 100).toFixed(1)}%`;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AnalyticsIcon />
          <Typography variant="h6">Detailed Analysis</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          {/* Question Section */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Question
              </Typography>
              <Typography variant="body1">{question}</Typography>
            </Paper>
          </Grid>

          {/* Transcription Section */}
          {analysis.transcription && (
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <RecordVoiceOverIcon color="primary" />
                  <Typography variant="subtitle1" color="primary">
                    Transcription
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                  {analysis.transcription}
                </Typography>
              </Paper>
            </Grid>
          )}

          {/* Content Analysis Section */}
          {analysis.content_analysis && (
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PsychologyIcon color="primary" />
                  <Typography variant="subtitle1" color="primary">
                    Content Analysis
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {/* Relevance Score */}
                  <Grid item xs={12}>
                    <Typography variant="body2" gutterBottom>
                      Relevance Score
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <LinearProgress
                        variant="determinate"
                        value={analysis.content_analysis.relevance_score * 100}
                        sx={{ flexGrow: 1 }}
                      />
                      <Typography variant="body2">
                        {formatScore(analysis.content_analysis.relevance_score)}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Relevant Points */}
                  {analysis.content_analysis.feedback.relevant_points.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="success.main" gutterBottom>
                        Relevant Points Covered
                      </Typography>
                      <List dense>
                        {analysis.content_analysis.feedback.relevant_points.map((point, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <CheckCircleIcon color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              disableTypography
                              primary={
                                <Typography variant="body2">
                                  {point}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}

                  {/* Missing Points */}
                  {analysis.content_analysis.feedback.missing_points.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="warning.main" gutterBottom>
                        Points to Consider
                      </Typography>
                      <List dense>
                        {analysis.content_analysis.feedback.missing_points.map((point, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <InfoIcon color="warning" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              disableTypography
                              primary={
                                <Typography variant="body2">
                                  {point}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}

                  {/* Off-topic Content */}
                  {analysis.content_analysis.feedback.off_topic_content.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="error.main" gutterBottom>
                        Off-topic Content
                      </Typography>
                      <List dense>
                        {analysis.content_analysis.feedback.off_topic_content.map((point, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <ErrorIcon color="error" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              disableTypography
                              primary={
                                <Typography variant="body2">
                                  {point}
                                </Typography>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Quality Metrics Section */}
          {analysis.quality_metrics && (
            <Grid item xs={12}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <SpeedIcon color="primary" />
                  <Typography variant="subtitle1" color="primary">
                    Quality Metrics
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Content Structure</Typography>
                      <Chip 
                        label={analysis.quality_metrics.has_meaningful_structure ? "Good" : "Needs Improvement"}
                        color={analysis.quality_metrics.has_meaningful_structure ? "success" : "warning"}
                        size="small"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Content Clarity</Typography>
                      <Chip 
                        label={analysis.quality_metrics.has_gibberish ? "Unclear" : "Clear"}
                        color={analysis.quality_metrics.has_gibberish ? "error" : "success"}
                        size="small"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2">Word Repetition</Typography>
                      <Chip 
                        label={analysis.quality_metrics.excessive_repetition ? "Excessive" : "Good"}
                        color={analysis.quality_metrics.excessive_repetition ? "warning" : "success"}
                        size="small"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Word Count
                    </Typography>
                    <Typography variant="h6">
                      {analysis.quality_metrics.word_count}
                    </Typography>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Sentences
                    </Typography>
                    <Typography variant="h6">
                      {analysis.quality_metrics.sentence_count}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Average Sentence Length
                    </Typography>
                    <Typography variant="h6">
                      {analysis.quality_metrics.avg_sentence_length.toFixed(1)} words
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Overall Feedback Section */}
          <Grid item xs={12}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <SpellcheckIcon color="primary" />
                <Typography variant="subtitle1" color="primary">
                  Overall Feedback
                </Typography>
              </Box>

              {/* Positive Feedback */}
              {analysis.feedback.length > 0 && (
                <Box mb={2}>
                  <Typography variant="body2" color="success.main" gutterBottom>
                    Positive Points
                  </Typography>
                  <List dense>
                    {analysis.feedback.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          disableTypography
                          primary={
                            <Typography variant="body2">
                              {point}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Improvement Points */}
              {analysis.improvement_points.length > 0 && (
                <Box>
                  <Typography variant="body2" color="warning.main" gutterBottom>
                    Areas for Improvement
                  </Typography>
                  <List dense>
                    {analysis.improvement_points.map((point, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <InfoIcon color="warning" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          disableTypography
                          primary={
                            <Typography variant="body2">
                              {point}
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailedAnalysis; 