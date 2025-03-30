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
  useTheme,
  alpha,
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
  SentimentSatisfied as SentimentIcon,
  TrendingUp as RelevanceIcon,
  Star as QualityIcon,
  Lightbulb as SuggestionIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const theme = useTheme();

  const formatScore = (score: number): string => `${(score * 100).toFixed(1)}%`;

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return theme.palette.success.main;
    if (score >= 0.4) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: theme.shadows[10],
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          {t('analysis.title')}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500 }}>
            {t('analysis.question')}
          </Typography>
          <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
            {question}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <Chip
            icon={<SentimentIcon />}
            label={`${t('analysis.sentiment')}: ${Math.round(analysis.sentimentScore * 100)}%`}
            sx={{
              bgcolor: alpha(getSentimentColor(analysis.sentimentScore), 0.1),
              color: getSentimentColor(analysis.sentimentScore),
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />
          <Chip
            icon={<RelevanceIcon />}
            label={`${t('analysis.relevance')}: ${Math.round(analysis.relevanceScore * 100)}%`}
            color="primary"
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />
          <Chip
            icon={<QualityIcon />}
            label={`${t('analysis.quality')}: ${Math.round(analysis.qualityScore * 100)}%`}
            color="secondary"
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, 0.1),
              '& .MuiChip-icon': {
                color: 'inherit',
              },
            }}
          />
        </Box>

        {analysis.feedback.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              {t('analysis.feedback')}
            </Typography>
            <List>
              {analysis.feedback.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {analysis.suggestions.length > 0 && (
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
              {t('analysis.suggestions')}
            </Typography>
            <List>
              {analysis.suggestions.map((item, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <SuggestionIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailedAnalysis; 