import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { formatScoreAsPercentage } from '../../utils/scoreCalculator';

interface DetailedAnalysisProps {
  questionText: string;
  answerText: string;
  transcription?: string;
  analysis: {
    score: number;
    feedback: string;
    strengths?: string[];
    weaknesses?: string[];
    suggestions?: string[];
    keywords?: {
      expected: string[];
      found: string[];
      missing: string[];
    };
  };
  language: 'en' | 'fr' | 'ar';
}

const DetailedAnalysis: React.FC<DetailedAnalysisProps> = ({
  questionText,
  answerText,
  transcription,
  analysis,
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
        {language === 'fr' ? 'Analyse détaillée' :
         language === 'ar' ? 'تحليل مفصل' :
         'Detailed Analysis'}
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          {language === 'fr' ? 'Question:' :
           language === 'ar' ? ':السؤال' :
           'Question:'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {typeof questionText === 'object' && questionText !== null
            ? (questionText as Record<string, string>)[language] || 
              (questionText as Record<string, string>)['en'] || 
              'Question not available' 
            : questionText}
        </Typography>
        
        <Typography variant="subtitle1" fontWeight="bold">
          {language === 'fr' ? 'Votre réponse:' :
           language === 'ar' ? ':إجابتك' :
           'Your Answer:'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {answerText || (transcription ? `(Transcribed) ${transcription}` : 'No answer provided')}
        </Typography>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6">
              {language === 'fr' ? 'Score global' :
               language === 'ar' ? 'النتيجة الإجمالية' :
               'Overall Score'}
            </Typography>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Typography 
                variant="h3" 
                color={getScoreColor(analysis.score)}
                sx={{ fontWeight: 'bold' }}
              >
                {formatScoreAsPercentage(analysis.score)}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={analysis.score * 100} 
              color={
                analysis.score >= 0.8 ? 'success' :
                analysis.score >= 0.6 ? 'info' :
                analysis.score >= 0.4 ? 'warning' : 'error'
              }
              sx={{ height: 10, borderRadius: 5, mt: 1 }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            {language === 'fr' ? 'Commentaires' :
             language === 'ar' ? 'التعليقات' :
             'Feedback'}
          </Typography>
          <Typography variant="body1">
            {analysis.feedback}
          </Typography>
        </Grid>
      </Grid>
      
      <Divider sx={{ my: 2 }} />
      
      <Grid container spacing={3}>
        {analysis.strengths && analysis.strengths.length > 0 && (
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="success.main">
              {language === 'fr' ? 'Points forts' :
               language === 'ar' ? 'نقاط القوة' :
               'Strengths'}
            </Typography>
            <List dense>
              {analysis.strengths.map((strength, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText primary={strength} />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}
        
        {analysis.weaknesses && analysis.weaknesses.length > 0 && (
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="error.main">
              {language === 'fr' ? 'Points à améliorer' :
               language === 'ar' ? 'نقاط الضعف' :
               'Areas for Improvement'}
            </Typography>
            <List dense>
              {analysis.weaknesses.map((weakness, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <ErrorIcon color="error" />
                  </ListItemIcon>
                  <ListItemText primary={weakness} />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}
        
        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom color="info.main">
              {language === 'fr' ? 'Suggestions' :
               language === 'ar' ? 'اقتراحات' :
               'Suggestions'}
            </Typography>
            <List dense>
              {analysis.suggestions.map((suggestion, index) => (
                <ListItem key={index}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <InfoIcon color="info" />
                  </ListItemIcon>
                  <ListItemText primary={suggestion} />
                </ListItem>
              ))}
            </List>
          </Grid>
        )}
      </Grid>
      
      {analysis.keywords && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {language === 'fr' ? 'Mots-clés' :
               language === 'ar' ? 'الكلمات الرئيسية' :
               'Keywords'}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {language === 'fr' ? 'Mots-clés trouvés:' :
                 language === 'ar' ? ':الكلمات الرئيسية الموجودة' :
                 'Keywords Found:'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analysis.keywords.found.length > 0 ? (
                  analysis.keywords.found.map((keyword, index) => (
                    <Chip 
                      key={index} 
                      label={keyword} 
                      color="success" 
                      size="small" 
                      variant="outlined" 
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {language === 'fr' ? 'Aucun mot-clé trouvé' :
                     language === 'ar' ? 'لم يتم العثور على كلمات رئيسية' :
                     'No keywords found'}
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {language === 'fr' ? 'Mots-clés manquants:' :
                 language === 'ar' ? ':الكلمات الرئيسية المفقودة' :
                 'Missing Keywords:'}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {analysis.keywords.missing.length > 0 ? (
                  analysis.keywords.missing.map((keyword, index) => (
                    <Chip 
                      key={index} 
                      label={keyword} 
                      color="error" 
                      size="small" 
                      variant="outlined" 
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {language === 'fr' ? 'Tous les mots-clés attendus ont été mentionnés' :
                     language === 'ar' ? 'تم ذكر جميع الكلمات الرئيسية المتوقعة' :
                     'All expected keywords were mentioned'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default DetailedAnalysis;