/**
 * Calculate a score for an answer based on various metrics
 * 
 * @param text The text of the answer
 * @param expectedKeywords Array of keywords that should be present in a good answer
 * @param minLength Minimum expected length of a good answer
 * @returns Score between 0 and 1
 */
export const calculateAnswerScore = (
  text: string,
  expectedKeywords: string[] = [],
  minLength: number = 50
): number => {
  if (!text) return 0;
  
  // Calculate length score (0-0.3)
  const lengthScore = Math.min(text.length / minLength, 1) * 0.3;
  
  // Calculate keyword score (0-0.5)
  let keywordScore = 0;
  if (expectedKeywords.length > 0) {
    const lowerText = text.toLowerCase();
    const matchedKeywords = expectedKeywords.filter(keyword => 
      lowerText.includes(keyword.toLowerCase())
    );
    keywordScore = (matchedKeywords.length / expectedKeywords.length) * 0.5;
  } else {
    // If no keywords provided, give a default score
    keywordScore = 0.3;
  }
  
  // Calculate structure score (0-0.2)
  // Simple heuristic: sentences with proper punctuation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const structureScore = Math.min(sentences.length / 3, 1) * 0.2;
  
  // Combine scores
  return lengthScore + keywordScore + structureScore;
};

/**
 * Format a score as a percentage
 * 
 * @param score Score between 0 and 1
 * @returns Formatted percentage string
 */
export const formatScoreAsPercentage = (score: number): string => {
  return `${Math.round(score * 100)}%`;
};