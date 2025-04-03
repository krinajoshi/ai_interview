import axios from 'axios';
import { AIAnalysisResult } from '../types/interview';
import { API_BASE_URL } from '../config';

// Validate environment variables
console.log('Environment check:', {
  nodeEnv: process.env.NODE_ENV,
  apiUrl: process.env.REACT_APP_API_URL,
  hasCohereKey: !!process.env.REACT_APP_COHERE_API_KEY
});

// API endpoints
const SENTIMENT_API_URL = `${API_BASE_URL}/api/v1/sentiment/analyze`;
const TRANSCRIPTION_API_URL = `${API_BASE_URL}/api/v1/transcription/transcribe`;

const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;

if (!COHERE_API_KEY) {
  console.error('Cohere API key is not set. Please set REACT_APP_COHERE_API_KEY in your .env file');
}

// Add retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error('API call failed:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (retries > 0) {
      console.log(`Retrying... ${retries} attempts remaining`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay);
    }
    throw error;
  }
}

const analyzeSentiment = async (text: string) => {
  try {
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: `Analyze the sentiment of this text and respond with only one word: POSITIVE, NEGATIVE, or NEUTRAL.

Text: ${text}`,
        max_tokens: 10,
        temperature: 0.3,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Sentiment analysis error:', errorData);
      throw new Error('Sentiment analysis failed');
    }

    const data = await response.json();
    const sentiment = data.generations[0].text.trim().toUpperCase();
    
    // Map the sentiment to our expected format
    const label = sentiment.includes('POSITIVE') ? 'POSITIVE' : 
                 sentiment.includes('NEGATIVE') ? 'NEGATIVE' : 'NEUTRAL';
    
    return {
      sentiment: {
        label,
        score: label === 'POSITIVE' ? 0.8 : label === 'NEGATIVE' ? 0.2 : 0.5
      }
    };
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    // Return neutral sentiment as fallback
    return {
      sentiment: {
        label: 'NEUTRAL',
        score: 0.5
      }
    };
  }
};

async function blobUrlToFile(blobUrl: string, mediaType: 'audio' | 'video'): Promise<File> {
  try {
    console.log('Converting blob URL to file:', {
      blobUrl: blobUrl.substring(0, 50) + '...',
      mediaType
    });

    const response = await fetch(blobUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    console.log('Blob details:', {
      size: blob.size,
      type: blob.type,
      mediaType
    });

    if (blob.size === 0) {
      throw new Error('Received empty blob');
    }

    // Create a new filename with timestamp
    const timestamp = new Date().getTime();
    
    // For audio files, use the original blob type
    if (mediaType === 'audio') {
      // Get the extension from the blob type or default to .wav
      let extension = '.wav';
      let mimeType = 'audio/wav';
      
      if (blob.type) {
        if (blob.type.includes('webm')) {
          extension = '.webm';
          mimeType = 'audio/webm';
        } else if (blob.type.includes('mp4')) {
          extension = '.m4a';
          mimeType = 'audio/mp4';
        } else if (blob.type.includes('mp3')) {
          extension = '.mp3';
          mimeType = 'audio/mpeg';
        } else if (blob.type.includes('ogg')) {
          extension = '.ogg';
          mimeType = 'audio/ogg';
        }
      }
      
      const filename = `recording_${timestamp}${extension}`;
      const file = new File([blob], filename, { 
        type: mimeType,
        lastModified: timestamp
      });
      
      console.log('Created audio file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      return file;
    } else {
      // For video files, keep the original format
      const extension = blob.type.includes('webm') ? '.webm' : '.mp4';
      const mimeType = blob.type || 'video/mp4';
      const filename = `recording_${timestamp}${extension}`;
      
      const file = new File([blob], filename, { 
        type: mimeType,
        lastModified: timestamp
      });
      
      console.log('Created video file:', {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified
      });

      return file;
    }
  } catch (error: any) {
    console.error('Error in blobUrlToFile:', error);
    throw new Error(`Failed to convert blob URL to file: ${error.message}`);
  }
}

export const transcribeMedia = async (mediaUrl: string, mediaType: "audio" | "video"): Promise<string> => {
  try {
    const response = await fetch(mediaUrl);
    const blob = await response.blob();

    const formData = new FormData();
    formData.append('file', blob, `recording.${mediaType === 'audio' ? 'wav' : 'mp4'}`);
    formData.append('mediaType', mediaType);

    const transcriptionResponse = await fetch(TRANSCRIPTION_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      console.error('Transcription failed:', transcriptionResponse.status);
      return '';
    }

    const data = await transcriptionResponse.json();
    return data.transcription || '';
  } catch (error) {
    console.error('Error transcribing media:', error);
    return '';
  }
};

const COHERE_API_URL = 'https://api.cohere.ai/v1/generate';

export const analyzeAnswer = async (
  answer: string,
  mediaUrl?: string,
  mediaType?: 'audio' | 'video',
  question?: string
): Promise<AIAnalysisResult> => {
  try {
    // If there's media, transcribe it first
    let textToAnalyze = answer;
    if (mediaUrl && mediaType) {
      const transcription = await transcribeMedia(mediaUrl, mediaType);
      if (transcription) {
        textToAnalyze = transcription;
      }
    }

    // Get sentiment analysis
    const sentiment = await analyzeSentiment(textToAnalyze);

    // Prepare the prompt for Cohere
    const prompt = `Analyze the following interview answer and provide a comprehensive analysis. Focus on the quality of the answer, clarity, and relevance to the question.

Question: ${question || 'Not provided'}
Answer: ${textToAnalyze}

Please provide your analysis in the following format:

Overall Score: [score]/5
Feedback: [detailed feedback about the answer]

The score should be a number between 1 and 5, where:
1 = Poor
2 = Below Average
3 = Average
4 = Good
5 = Excellent

The feedback should be detailed and constructive, focusing on:
- Clarity of the answer
- Relevance to the question
- Depth of explanation
- Use of examples or evidence
- Overall effectiveness`;

    const response = await fetch(COHERE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt,
        max_tokens: 1000,
        temperature: 0.7,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to analyze answer');
    }

    const data = await response.json();
    const analysisText = data.generations[0].text;

    // Extract score and feedback
    const scoreMatch = analysisText.match(/Overall Score: (\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 3;
    const feedbackMatch = analysisText.match(/Feedback: ([\s\S]*?)(?=\n|$)/);
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'No feedback available';

    return {
      score,
      feedback
    };
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return {
      score: 3,
      feedback: 'An error occurred while analyzing the answer. Please try again.'
    };
  }
};

// Helper function to parse the Cohere AI response into structured sections
const parseAnalysisResponse = (response: string) => {
  const sections: any = {
    score: 0,
    feedback: '',
    strong_points: [],
    improvement_points: [],
    structure_analysis: '',
    technical_accuracy: '',
    communication_style: '',
    action_items: []
  };

  try {
    // Split response into lines
    const lines = response.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check for section headers
      if (trimmedLine.match(/^(OVERALL SCORE|FEEDBACK|STRONG POINTS|AREAS FOR IMPROVEMENT|TECHNICAL ACCURACY|COMMUNICATION STYLE|ACTION ITEMS):$/i)) {
        // Save previous section if exists
        if (currentSection && currentContent.length > 0) {
          if (currentSection === 'overall_score') {
            const scoreMatch = currentContent[0].match(/(\d+)/);
            sections.score = scoreMatch ? parseInt(scoreMatch[1]) : 3;
          } else if (currentSection === 'strong_points' || currentSection === 'improvement_points' || currentSection === 'action_items') {
            sections[currentSection] = currentContent
              .filter(item => item.startsWith('-') || item.startsWith('*'))
              .map(item => item.replace(/^[-*]\s*/, ''));
          } else {
            sections[currentSection] = currentContent.join(' ');
          }
        }

        // Start new section
        currentSection = trimmedLine.toLowerCase().replace(':', '').replace(/\s+/g, '_');
        currentContent = [];
      } else if (trimmedLine && currentSection) {
        currentContent.push(trimmedLine);
      }
    }

    // Save last section
    if (currentSection && currentContent.length > 0) {
      if (currentSection === 'overall_score') {
        const scoreMatch = currentContent[0].match(/(\d+)/);
        sections.score = scoreMatch ? parseInt(scoreMatch[1]) : 3;
      } else if (currentSection === 'strong_points' || currentSection === 'improvement_points' || currentSection === 'action_items') {
        sections[currentSection] = currentContent
          .filter(item => item.startsWith('-') || item.startsWith('*'))
          .map(item => item.replace(/^[-*]\s*/, ''));
      } else {
        sections[currentSection] = currentContent.join(' ');
      }
    }

    // Ensure all sections have content
    if (!sections.strong_points.length) {
      sections.strong_points = ['Clear communication', 'Good structure'];
    }
    if (!sections.improvement_points.length) {
      sections.improvement_points = ['Add more technical details', 'Include specific examples'];
    }
    if (!sections.technical_accuracy) {
      sections.technical_accuracy = 'The answer demonstrates basic technical understanding but could benefit from more specific technical details and examples.';
    }
    if (!sections.communication_style) {
      sections.communication_style = 'The communication is clear but could be more technical and detailed.';
    }
    if (!sections.action_items.length) {
      sections.action_items = [
        'Practice including more technical terminology',
        'Add specific examples to support your points',
        'Work on structuring your responses with clear sections'
      ];
    }

    // Log the parsed sections for debugging
    console.log('Parsed sections:', sections);

  } catch (error) {
    console.error('Error parsing analysis response:', error);
  }

  return sections;
};

// Helper functions for generating unique analysis content
const generateUniqueFeedback = (answer: string, question?: string): string => {
  const wordCount = answer.split(/\s+/).length;
  const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('instance');
  const hasTechnicalTerms = answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i);
  
  if (wordCount < 50) {
    return 'Your answer is quite brief. Consider providing more details and examples to strengthen your response.';
  } else if (!hasExamples) {
    return 'Your answer provides a good overview but could be strengthened with specific examples and real-world scenarios.';
  } else if (!hasTechnicalTerms) {
    return 'Your answer is well-structured but could benefit from more technical terminology and specific implementation details.';
  } else {
    return 'Your answer demonstrates strong technical knowledge and effective communication. Consider adding more specific implementation details or edge cases.';
  }
};

const generateUniqueStrongPoints = (answer: string): string[] => {
  const strongPoints: string[] = [];
  
  if (answer.toLowerCase().includes('example') || answer.toLowerCase().includes('instance')) {
    strongPoints.push('Good use of examples to illustrate points');
  }
  
  if (answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i)) {
    strongPoints.push('Effective use of technical terminology');
  }
  
  if (answer.includes('```') || answer.includes('code')) {
    strongPoints.push('Inclusion of code examples demonstrates practical knowledge');
  }
  
  if (answer.toLowerCase().includes('first') || answer.toLowerCase().includes('second') || answer.toLowerCase().includes('finally')) {
    strongPoints.push('Well-structured response with clear organization');
  }
  
  if (strongPoints.length === 0) {
    strongPoints.push('Clear and concise communication');
  }
  
  return strongPoints;
};

const generateUniqueSuggestions = (answer: string): string[] => {
  const suggestions: string[] = [];
  
  if (!answer.toLowerCase().includes('example') && !answer.toLowerCase().includes('instance')) {
    suggestions.push('Add specific examples to support your points');
  }
  
  if (!answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i)) {
    suggestions.push('Incorporate more technical terminology where appropriate');
  }
  
  if (!answer.includes('```') && !answer.includes('code')) {
    suggestions.push('Consider including code snippets to demonstrate implementation');
  }
  
  if (!answer.toLowerCase().includes('first') && !answer.toLowerCase().includes('second') && !answer.toLowerCase().includes('finally')) {
    suggestions.push('Structure your response with clear sections (introduction, main points, conclusion)');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Consider adding more specific implementation details');
    suggestions.push('Include edge cases and potential challenges');
  }
  
  return suggestions;
};

const generateUniqueStructureAnalysis = (answer: string): string => {
  const hasStructure = answer.toLowerCase().includes('first') || answer.toLowerCase().includes('second') || answer.toLowerCase().includes('finally');
  const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('instance');
  
  if (hasStructure && hasExamples) {
    return 'Your answer is well-structured with clear organization and supporting examples. The flow is logical and easy to follow.';
  } else if (hasStructure) {
    return 'Your answer has a good structure but could benefit from more specific examples to support each point.';
  } else if (hasExamples) {
    return 'Your answer includes good examples but could be better organized with clear sections and transitions.';
  } else {
    return 'Consider organizing your response with clear sections (introduction, main points, conclusion) and supporting examples.';
  }
};

const generateUniqueTechnicalAnalysis = (answer: string): string => {
  const hasTechnicalTerms = answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i);
  const hasCodeSnippets = answer.includes('```') || answer.includes('code');
  
  if (hasTechnicalTerms && hasCodeSnippets) {
    return 'Your answer demonstrates strong technical knowledge with appropriate terminology and practical code examples.';
  } else if (hasTechnicalTerms) {
    return 'You effectively use technical terminology but could strengthen your response with code examples or implementation details.';
  } else if (hasCodeSnippets) {
    return 'Your code examples are helpful, but consider incorporating more technical terminology to better explain the concepts.';
  } else {
    return 'Consider adding more technical details, including specific terminology and implementation examples.';
  }
};

const generateUniqueCommunicationAnalysis = (answer: string): string => {
  const wordCount = answer.split(/\s+/).length;
  const hasStructure = answer.toLowerCase().includes('first') || answer.toLowerCase().includes('second') || answer.toLowerCase().includes('finally');
  
  if (wordCount > 100 && hasStructure) {
    return 'Your communication is clear, professional, and well-structured. You effectively convey complex technical concepts.';
  } else if (wordCount > 100) {
    return 'Your communication is detailed but could benefit from better organization to improve clarity.';
  } else if (hasStructure) {
    return 'Your communication is well-structured but could be more detailed to fully explain the concepts.';
  } else {
    return 'Consider providing more detailed explanations and organizing your response for better clarity.';
  }
};

const generateUniqueActionItems = (answer: string): string[] => {
  const actionItems: string[] = [];
  
  if (!answer.toLowerCase().includes('example') && !answer.toLowerCase().includes('instance')) {
    actionItems.push('Practice providing specific examples in your answers');
  }
  
  if (!answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i)) {
    actionItems.push('Expand your technical vocabulary and use appropriate terminology');
  }
  
  if (!answer.includes('```') && !answer.includes('code')) {
    actionItems.push('Include code snippets to demonstrate practical implementation');
  }
  
  if (!answer.toLowerCase().includes('first') && !answer.toLowerCase().includes('second') && !answer.toLowerCase().includes('finally')) {
    actionItems.push('Work on structuring your responses with clear sections');
  }
  
  if (actionItems.length === 0) {
    actionItems.push('Consider adding more specific implementation details');
    actionItems.push('Include edge cases and potential challenges');
    actionItems.push('Practice explaining complex technical concepts clearly');
  }
  
  return actionItems;
};

// Test function to demonstrate dynamic analysis
export const testAnalysis = async (): Promise<AIAnalysisResult> => {
  const sampleAnswer = `When implementing a binary search algorithm, I first check if the array is sorted. Then, I use a while loop to repeatedly divide the array in half. For example, if we have an array [1, 3, 5, 7, 9] and we're searching for 5, we first check the middle element. Since 5 is greater than 3, we search the right half. Finally, we find 5 in the middle of the remaining elements.

Here's a code example:
\`\`\`python
def binary_search(arr, target):
    left, right = 0, len(arr) - 1
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1
\`\`\`

This implementation has O(log n) time complexity and is very efficient for large datasets.`;

  console.log('Testing analysis with sample answer:', sampleAnswer);
  const result = await analyzeAnswer(sampleAnswer, undefined, undefined, 'Explain how you would implement a binary search algorithm.');
  console.log('Analysis result:', result);
  return result;
}; 