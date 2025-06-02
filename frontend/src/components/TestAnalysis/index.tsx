import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { formatScoreAsPercentage } from '../../utils/scoreCalculator';

interface TestAnalysisProps {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  strengths: string[];
  weaknesses: string[];
  language: 'en' | 'fr' | 'ar';
}

const TestAnalysis: React.FC<TestAnalysisProps> = ({
  overallScore,
  technicalScore,
  communicationScore,
  strengths,
  weaknesses,
  language,
}) => {
  // Determine score color
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success.main';
    if (score >= 0.6) return 'info.main';
    if (score >= 0.4) return 'warning.main';
    return 'error.main';
  };

  return (
    <Paper sx={{ p: 3, mb: 3, direction: language === 'ar' ? 'rtl' : 'ltr' }}>
      <Typography variant="h5" gutterBottom>
        {language === 'fr' ? 'Résumé de l\'entretien' :
         language === 'ar' ? 'ملخص المقابلة' :
         'Interview Summary'}
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {language === 'fr' ? 'Score global' :
               language === 'ar' ? 'النتيجة الإجمالية' :
               'Overall Score'}
            </Typography>
            <Typography 
              variant="h3" 
              color={getScoreColor(overallScore)}
              sx={{ fontWeight: 'bold' }}
            >
              {formatScoreAsPercentage(overallScore)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={overallScore * 100} 
              color={
                overallScore >= 0.8 ? 'success' :
                overallScore >= 0.6 ? 'info' :
                overallScore >= 0.4 ? 'warning' : 'error'
              }
              sx={{ height: 10, borderRadius: 5, mt: 1 }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {language === 'fr' ? 'Score technique' :
               language === 'ar' ? 'النتيجة التقنية' :
               'Technical Score'}
            </Typography>
            <Typography 
              variant="h3" 
              color={getScoreColor(technicalScore)}
              sx={{ fontWeight: 'bold' }}
            >
              {formatScoreAsPercentage(technicalScore)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={technicalScore * 100} 
              color={
                technicalScore >= 0.8 ? 'success' :
                technicalScore >= 0.6 ? 'info' :
                technicalScore >= 0.4 ? 'warning' : 'error'
              }
              sx={{ height: 10, borderRadius: 5, mt: 1 }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {language === 'fr' ? 'Score de communication' :
               language === 'ar' ? 'نتيجة التواصل' :
               'Communication Score'}
            </Typography>
            <Typography 
              variant="h3" 
              color={getScoreColor(communicationScore)}
              sx={{ fontWeight: 'bold' }}
            >
              {formatScoreAsPercentage(communicationScore)}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={communicationScore * 100} 
              color={
                communicationScore >= 0.8 ? 'success' :
                communicationScore >= 0.6 ? 'info' :
                communicationScore >= 0.4 ? 'warning' : 'error'
              }
              sx={{ height: 10, borderRadius: 5, mt: 1 }}
            />
          </Box>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 3 }} />
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom color="success.main">
            {language === 'fr' ? 'Points forts' :
             language === 'ar' ? 'نقاط القوة' :
             'Strengths'}
          </Typography>
          <List dense>
            {strengths.map((strength, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircleIcon color="success" />
                </ListItemIcon>
                <ListItemText primary={strength} />
              </ListItem>
            ))}
          </List>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom color="error.main">
            {language === 'fr' ? 'Points à améliorer' :
             language === 'ar' ? 'نقاط الضعف' :
             'Areas for Improvement'}
          </Typography>
          <List dense>
            {weaknesses.map((weakness, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ErrorIcon color="error" />
                </ListItemIcon>
                <ListItemText primary={weakness} />
              </ListItem>
            ))}
          </List>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <Chip 
          label={language === 'fr' ? 'Entretien terminé' : 
                language === 'ar' ? 'تمت المقابلة' : 
                'Interview Completed'} 
          color="success" 
          variant="outlined" 
        />
        <Chip 
          label={language === 'fr' ? 'Analyse disponible' : 
                language === 'ar' ? 'التحليل متاح' : 
                'Analysis Available'} 
          color="info" 
          variant="outlined" 
        />
      </Box>
    </Paper>
  );
};

export default TestAnalysis;