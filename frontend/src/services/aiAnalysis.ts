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
    const response = await fetch('https://api.cohere.ai/v1/classify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'large',
        inputs: [text],
        examples: [
          { text: 'This is great!', label: 'POSITIVE' },
          { text: 'This is terrible.', label: 'NEGATIVE' },
          { text: 'This is okay.', label: 'NEUTRAL' }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Sentiment analysis failed');
    }

    const data = await response.json();
    const classification = data.classifications[0];
    
    return {
      sentiment: {
        label: classification.prediction,
        score: classification.confidence
      }
    };
  } catch (error) {
    console.error('Error in sentiment analysis:', error);
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

export const analyzeAnswer = async (
  answer: string,
  mediaUrl?: string,
  mediaType?: string,
  question?: string
): Promise<AIAnalysisResult> => {
  try {
    console.log('Starting analysis with:', {
      answer,
      mediaUrl,
      mediaType,
      question,
      hasCohereKey: !!process.env.REACT_APP_COHERE_API_KEY
    });

    // Get sentiment analysis
    const sentimentResult = await analyzeSentiment(answer);
    console.log('Sentiment analysis result:', sentimentResult);
    
    // Prepare the prompt for Cohere AI
    const prompt = `As an expert technical interviewer, analyze the following interview answer. Provide a detailed analysis with specific feedback.

Question: ${question || 'Not provided'}
Answer: ${answer}

Please provide a comprehensive analysis in the following format:

OVERALL SCORE: [Score out of 5]
FEEDBACK: [Detailed feedback about the answer]
STRONG POINTS:
- [Point 1]
- [Point 2]
- [Point 3]
AREAS FOR IMPROVEMENT:
- [Point 1]
- [Point 2]
- [Point 3]
STRUCTURE ANALYSIS: [Analysis of answer structure]
TECHNICAL ACCURACY: [Analysis of technical content]
COMMUNICATION STYLE: [Analysis of communication]
ACTION ITEMS:
- [Item 1]
- [Item 2]
- [Item 3]`;

    console.log('Sending request to Cohere API with prompt:', prompt);

    // Call Cohere AI API
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.7,
        k: 0,
        stop_sequences: ["\n\n"],
        return_likelihoods: 'NONE'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Cohere API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Cohere API error: ${errorText}`);
    }

    const data = await response.json();
    console.log('Cohere API response:', data);

    // Parse the response into sections
    const sections = data.generations[0].text.split('\n\n');
    console.log('Parsed sections:', sections);

    const sectionMap = new Map<string, string[]>();

    let currentSection = '';
    let currentContent: string[] = [];

    sections.forEach((section: string) => {
      const lines = section.split('\n');
      const firstLine = lines[0].trim();
      
      if (firstLine.includes(':')) {
        if (currentSection && currentContent.length > 0) {
          sectionMap.set(currentSection, currentContent);
        }
        currentSection = firstLine.split(':')[0].trim();
        currentContent = lines.slice(1).map((line: string) => line.trim()).filter((line: string) => line);
      } else {
        currentContent.push(...lines.map((line: string) => line.trim()).filter((line: string) => line));
      }
    });

    if (currentSection && currentContent.length > 0) {
      sectionMap.set(currentSection, currentContent);
    }

    console.log('Section map:', Object.fromEntries(sectionMap));

    // Extract score from the overall score section
    const scoreMatch = sectionMap.get('OVERALL SCORE')?.[0]?.match(/(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 3;

    // Generate fallback content if sections are empty
    const generateFallbackContent = () => {
      const wordCount = answer.split(/\s+/).length;
      const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('instance');
      const hasTechnicalTerms = answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i);
      
      return {
        feedback: wordCount < 50 
          ? 'Your answer is quite brief. Consider providing more details and examples to strengthen your response.'
          : 'Your answer provides a good overview. Consider adding specific examples and technical details where appropriate.',
        strong_points: hasExamples 
          ? ['Good use of examples to illustrate points']
          : ['Clear and concise communication'],
        improvement_points: !hasExamples 
          ? ['Add specific examples to support your points']
          : ['Consider adding more technical details'],
        structure_analysis: 'Your answer could benefit from a clearer structure with introduction, main points, and conclusion.',
        technical_accuracy: hasTechnicalTerms 
          ? 'You effectively use technical terminology.'
          : 'Consider incorporating more technical terms where appropriate.',
        communication_style: 'Your communication is clear but could be more professional in tone.',
        action_items: [
          'Practice providing specific examples in your answers',
          'Work on structuring your responses with clear sections',
          'Incorporate more technical terminology where relevant'
        ]
      };
    };

    // Create the analysis result with fallback content if needed
    const fallbackContent = generateFallbackContent();
    const analysisResult: AIAnalysisResult = {
      score,
      feedback: sectionMap.get('FEEDBACK')?.[0] || fallbackContent.feedback,
      strong_points: sectionMap.get('STRONG POINTS')?.length ? sectionMap.get('STRONG POINTS')! : fallbackContent.strong_points,
      improvement_points: sectionMap.get('AREAS FOR IMPROVEMENT')?.length ? sectionMap.get('AREAS FOR IMPROVEMENT')! : fallbackContent.improvement_points,
      structure_analysis: sectionMap.get('STRUCTURE ANALYSIS')?.[0] || fallbackContent.structure_analysis,
      technical_accuracy: sectionMap.get('TECHNICAL ACCURACY')?.[0] || fallbackContent.technical_accuracy,
      communication_style: sectionMap.get('COMMUNICATION STYLE')?.[0] || fallbackContent.communication_style,
      action_items: sectionMap.get('ACTION ITEMS')?.length ? sectionMap.get('ACTION ITEMS')! : fallbackContent.action_items,
      sentiment: sentimentResult.sentiment,
      transcription: answer
    };

    console.log('Final analysis result:', analysisResult);
    return analysisResult;
  } catch (error) {
    console.error('Error in analyzeAnswer:', error);
    // Return a default analysis result in case of error
    return {
      score: 3,
      feedback: 'Unable to analyze the answer. Please try again.',
      strong_points: ['Analysis temporarily unavailable'],
      improvement_points: ['Please try again later'],
      structure_analysis: 'Analysis temporarily unavailable',
      technical_accuracy: 'Analysis temporarily unavailable',
      communication_style: 'Analysis temporarily unavailable',
      action_items: ['Please try again later'],
      sentiment: { label: 'NEUTRAL', score: 0.5 },
      transcription: answer
    };
  }
};

// Helper function to parse the Cohere AI response into structured sections
const parseAnalysisResponse = (response: string) => {
  const sections: any = {
    score: 0,
    feedback: '',
    comments: [],
    suggestions: [],
    improvement_points: [],
    strong_points: [],
    structure_analysis: '',
    technical_accuracy: '',
    communication_style: '',
    action_items: []
  };

  try {
    // Split response into sections
    const lines = response.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      // Check for numbered sections (1., 2., etc.)
      const sectionMatch = line.match(/^(\d+)\.\s*(.*)/);
      if (sectionMatch) {
        // Save previous section if exists
        if (currentSection && currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n');
          currentContent = [];
        }

        // Start new section
        const sectionNumber = parseInt(sectionMatch[1]);
        const sectionTitle = sectionMatch[2].toLowerCase().trim();
        
        // Map section numbers to section names
        switch (sectionNumber) {
          case 1:
            currentSection = 'overall_score';
            break;
          case 2:
            currentSection = 'strong_points';
            break;
          case 3:
            currentSection = 'improvement_points';
            break;
          case 4:
            currentSection = 'structure_analysis';
            break;
          case 5:
            currentSection = 'technical_accuracy';
            break;
          case 6:
            currentSection = 'communication_style';
            break;
          case 7:
            currentSection = 'action_items';
            break;
          default:
            currentSection = '';
        }
      } else if (line.trim() && currentSection) {
        // Skip bullet points and dashes
        const cleanLine = line.trim().replace(/^[-•*]\s*/, '');
        if (cleanLine) {
          currentContent.push(cleanLine);
        }
      }
    }

    // Save last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n');
    }

    // Extract score from overall_score section
    const scoreMatch = sections.overall_score?.match(/score:\s*(\d+)/i);
    if (scoreMatch) {
      sections.score = parseInt(scoreMatch[1]);
    }

    // Convert sections to arrays where appropriate
    sections.strong_points = sections.strong_points?.split('\n').filter(Boolean) || [];
    sections.improvement_points = sections.improvement_points?.split('\n').filter(Boolean) || [];
    sections.action_items = sections.action_items?.split('\n').filter(Boolean) || [];
    sections.suggestions = sections.improvement_points || [];

    // Set feedback as the overall analysis
    sections.feedback = sections.overall_score || '';

    // Log the parsed sections for debugging
    console.log('Parsed sections:', sections);

  } catch (error) {
    console.error('Error parsing analysis response:', error);
  }

  return sections;
};

// Helper functions to generate unique feedback based on the answer content
const generateUniqueFeedback = (answer: string, question?: string): string => {
  const wordCount = answer.split(/\s+/).length;
  const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('instance');
  const hasTechnicalTerms = answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i);
  
  let feedback = '';
  
  if (wordCount < 50) {
    feedback += 'Your answer is quite brief. ';
  } else if (wordCount < 100) {
    feedback += 'Your answer provides a good overview. ';
  } else {
    feedback += 'Your answer is detailed and comprehensive. ';
  }
  
  if (hasExamples) {
    feedback += 'Good use of examples to illustrate your points. ';
  } else {
    feedback += 'Consider adding specific examples to strengthen your response. ';
  }
  
  if (hasTechnicalTerms) {
    feedback += 'You effectively use technical terminology. ';
  } else {
    feedback += 'Try incorporating more technical terms where appropriate. ';
  }
  
  return feedback.trim();
};

const generateUniqueSuggestions = (answer: string): string[] => {
  const suggestions: string[] = [];
  const wordCount = answer.split(/\s+/).length;
  const hasStructure = answer.match(/\b(first|second|finally|in conclusion|to summarize)\b/i);
  
  if (wordCount < 50) {
    suggestions.push('Expand your answer with more details and examples');
  }
  
  if (!hasStructure) {
    suggestions.push('Structure your response with clear sections: introduction, main points, and conclusion');
  }
  
  if (!answer.match(/\b(because|therefore|thus|hence|consequently)\b/i)) {
    suggestions.push('Add logical connections between your ideas using transition words');
  }
  
  return suggestions;
};

const generateUniqueStrongPoints = (answer: string): string[] => {
  const strongPoints: string[] = [];
  
  if (answer.match(/\b(example|instance|case|scenario)\b/i)) {
    strongPoints.push('Effective use of examples to illustrate points');
  }
  
  if (answer.match(/\b(because|therefore|thus|hence|consequently)\b/i)) {
    strongPoints.push('Good logical flow and reasoning');
  }
  
  if (answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i)) {
    strongPoints.push('Strong technical vocabulary usage');
  }
  
  return strongPoints;
};

const generateUniqueStructureAnalysis = (answer: string): string => {
  const hasStructure = answer.match(/\b(first|second|finally|in conclusion|to summarize)\b/i);
  const hasTransitions = answer.match(/\b(because|therefore|thus|hence|consequently)\b/i);
  
  if (hasStructure && hasTransitions) {
    return 'Your answer is well-structured with clear sections and smooth transitions between ideas.';
  } else if (hasStructure) {
    return 'Your answer has a good structure but could benefit from better transitions between ideas.';
  } else if (hasTransitions) {
    return 'Your answer flows well but could be better organized with clear sections.';
  } else {
    return 'Consider organizing your answer into clear sections with proper transitions.';
  }
};

const generateUniqueTechnicalAnalysis = (answer: string): string => {
  const technicalTerms = answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/gi);
  
  if (technicalTerms && technicalTerms.length > 3) {
    return 'Your answer demonstrates strong technical knowledge with appropriate use of technical terminology.';
  } else if (technicalTerms && technicalTerms.length > 0) {
    return 'Your answer includes some technical terms but could benefit from more technical depth.';
  } else {
    return 'Consider incorporating more technical terminology to demonstrate your expertise.';
  }
};

const generateUniqueCommunicationAnalysis = (answer: string): string => {
  const hasProfessionalTone = answer.match(/\b(professional|efficient|effective|optimal|robust|scalable)\b/i);
  const hasClarity = answer.match(/\b(clear|simple|straightforward|understandable)\b/i);
  
  if (hasProfessionalTone && hasClarity) {
    return 'Your communication style is professional and clear.';
  } else if (hasProfessionalTone) {
    return 'Your tone is professional but could be clearer in explaining concepts.';
  } else if (hasClarity) {
    return 'Your explanation is clear but could be more professional in tone.';
  } else {
    return 'Consider improving both the clarity and professionalism of your communication.';
  }
};

const generateUniqueActionItems = (answer: string): string[] => {
  const actionItems: string[] = [];
  
  if (!answer.match(/\b(example|instance|case|scenario)\b/i)) {
    actionItems.push('Practice providing specific examples in your answers');
  }
  
  if (!answer.match(/\b(algorithm|function|method|class|interface|variable|loop|condition|database|api|framework|library)\b/i)) {
    actionItems.push('Study and incorporate more technical terminology');
  }
  
  if (!answer.match(/\b(because|therefore|thus|hence|consequently)\b/i)) {
    actionItems.push('Work on using transition words to improve answer flow');
  }
  
  return actionItems;
}; 