import { Answer, AIAnalysisResult } from '../types/interview';

export const calculateAnswerScore = async (
  answer: Answer,
  analysis: AIAnalysisResult,
  language: string
): Promise<{ score: number; comments: string[]; suggestions: string[] }> => {
  let score = 0;
  const comments: string[] = [];
  const suggestions: string[] = [];

  // Word count analysis (0-3 points)
  const wordCount = answer.text.split(/\s+/).length;
  if (wordCount > 200) {
    score += 3;
    comments.push(
      language === 'fr' ? 'Réponse très détaillée et complète' :
      language === 'ar' ? 'إجابة مفصلة وشاملة للغاية' :
      'Very detailed and comprehensive answer'
    );
  } else if (wordCount > 100) {
    score += 2;
    comments.push(
      language === 'fr' ? 'Bonne longueur de réponse' :
      language === 'ar' ? 'طول جيد للإجابة' :
      'Good answer length'
    );
  } else if (wordCount > 50) {
    score += 1;
    comments.push(
      language === 'fr' ? 'Réponse acceptable mais pourrait être plus détaillée' :
      language === 'ar' ? 'إجابة مقبولة ولكن يمكن أن تكون أكثر تفصيلاً' :
      'Acceptable answer but could be more detailed'
    );
  } else {
    suggestions.push(
      language === 'fr' ? 'Essayez de fournir plus de détails dans votre réponse' :
      language === 'ar' ? 'حاول تقديم المزيد من التفاصيل في إجابتك' :
      'Try to provide more details in your answer'
    );
  }

  // Content quality (0-4 points)
  if (analysis.score >= 4) {
    score += 4;
    comments.push(
      language === 'fr' ? 'Excellente qualité de réponse' :
      language === 'ar' ? 'جودة إجابة ممتازة' :
      'Excellent answer quality'
    );
  } else if (analysis.score >= 3) {
    score += 3;
    comments.push(
      language === 'fr' ? 'Bonne qualité de réponse' :
      language === 'ar' ? 'جودة إجابة جيدة' :
      'Good answer quality'
    );
  } else if (analysis.score >= 2) {
    score += 2;
    comments.push(
      language === 'fr' ? 'Qualité de réponse acceptable' :
      language === 'ar' ? 'جودة إجابة مقبولة' :
      'Acceptable answer quality'
    );
  } else {
    score += 1;
    suggestions.push(
      language === 'fr' ? 'Améliorez la qualité de votre réponse' :
      language === 'ar' ? 'حسن جودة إجابتك' :
      'Improve your answer quality'
    );
  }

  return { score, comments, suggestions };
}; 