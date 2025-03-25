import axios from 'axios';

// Validate environment variables
console.log('Environment check:', {
  nodeEnv: process.env.NODE_ENV,
  apiUrl: process.env.REACT_APP_API_URL
});

interface SentimentAnalysis {
  label: string;
  score: number;
  star_rating?: number;
  confidence?: number;
}

interface EmotionAnalysis {
  label: string;
  score: number;
}

export interface AIAnalysisResult {
  sentiment: SentimentAnalysis;
  emotions: EmotionAnalysis[];
  feedback: string[];
  improvement_points: string[];
  confidence: number;
  transcription?: string;
  score?: number;
  rating_explanation?: string;
  error?: string;
}

// API endpoints
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const SENTIMENT_API_URL = `${API_BASE_URL}/api/v1/sentiment/analyze`;
const TRANSCRIPTION_API_URL = `${API_BASE_URL}/api/v1/transcription/analyze`;

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

async function analyzeSentiment(text: string, question?: string): Promise<any> {
  try {
    if (!text.trim()) {
      console.warn('Empty text provided for sentiment analysis');
      return {
        sentiment: { label: 'NEUTRAL', score: 0.5 },
        feedback: ['No text provided for analysis'],
        improvement_points: ['Please provide some text to analyze'],
        score: 1,
        rating_explanation: 'No answer provided'
      };
    }

    console.log('Starting sentiment analysis...', { text: text.substring(0, 100), question });
    
    const response = await retry(async () => {
      console.log('Sending request to backend proxy...');
      const result = await axios.post(
        SENTIMENT_API_URL,
        { text, question },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      console.log('Raw sentiment response:', result.data);
      return result;
    });

    return response.data;
  } catch (error: any) {
    console.error('Sentiment analysis error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Return a graceful error response
    return {
      sentiment: { label: 'NEUTRAL', score: 0.5 },
      feedback: ['Error analyzing your answer. Please try again.'],
      improvement_points: ['If the error persists, try rephrasing your answer'],
      score: 3,
      rating_explanation: 'Unable to provide accurate rating due to analysis error'
    };
  }
}

async function blobUrlToFile(blobUrl: string, mediaType: 'audio' | 'video'): Promise<File> {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Get the correct file extension based on media type and content type
    let extension = '';
    if (blob.type.includes('webm')) {
      extension = '.webm';
    } else if (blob.type.includes('mp4')) {
      extension = '.mp4';
    } else if (blob.type.includes('wav')) {
      extension = '.wav';
    } else if (mediaType === 'audio') {
      extension = '.mp3';
    } else {
      extension = '.mp4';
    }
    
    // Create a new filename with timestamp to avoid caching issues
    const timestamp = new Date().getTime();
    const filename = `recording_${timestamp}${extension}`;
    
    return new File([blob], filename, { type: blob.type });
  } catch (error) {
    console.error('Error converting blob URL to file:', error);
    throw error;
  }
}

async function transcribeMedia(mediaUrl: string, mediaType: 'audio' | 'video'): Promise<string> {
  try {
    console.log(`Starting ${mediaType} transcription...`);
    
    // Convert blob URL to File object
    const mediaFile = await blobUrlToFile(mediaUrl, mediaType);
    console.log('File prepared for upload:', {
      name: mediaFile.name,
      type: mediaFile.type,
      size: mediaFile.size
    });
    
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('file', mediaFile);
    formData.append('media_type', mediaType);
    
    const response = await retry(async () => {
      console.log('Sending media file to backend...');
      const result = await axios.post(
        TRANSCRIPTION_API_URL,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 60000 // 60 seconds timeout for large files
        }
      );
      console.log('Transcription response:', result.data);
      return result;
    });

    if (!response.data.transcription && response.data.message) {
      console.warn('Transcription warning:', response.data.message);
      throw new Error(response.data.message);
    }

    return response.data.transcription || '';
  } catch (error: any) {
    console.error('Transcription error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Error transcribing audio';
    throw new Error(errorMessage);
  }
}

export async function analyzeAnswer(
  text: string,
  mediaUrl?: string,
  mediaType?: 'audio' | 'video',
  question?: string
): Promise<AIAnalysisResult> {
  console.log('Starting answer analysis with:', { text, mediaUrl, mediaType, question });
  
  try {
    // Handle media transcription if provided
    let transcription: string | undefined;
    let transcriptionError: string | undefined;
    
    if (mediaUrl && mediaType) {
      try {
        transcription = await transcribeMedia(mediaUrl, mediaType);
        console.log('Transcription result:', transcription);
      } catch (error: any) {
        console.error('Transcription failed:', error);
        transcriptionError = error.message;
        // Continue with text analysis even if transcription fails
      }
    }

    // Analyze both text and transcription if available
    const textToAnalyze = transcription 
      ? `${text}\n\nTranscribed content: ${transcription}`
      : text;

    const analysisResult = await analyzeSentiment(textToAnalyze, question);
    
    // Calculate confidence based on sentiment score
    const confidence = analysisResult.sentiment.confidence || analysisResult.sentiment.score;

    // Map emotions based on sentiment
    const emotions: EmotionAnalysis[] = [
      { 
        label: analysisResult.sentiment.label.toLowerCase(),
        score: analysisResult.sentiment.score
      },
      {
        label: 'confidence',
        score: confidence
      }
    ];

    return {
      sentiment: analysisResult.sentiment,
      emotions,
      feedback: analysisResult.feedback || [],
      improvement_points: analysisResult.improvement_points || [],
      confidence,
      transcription,
      score: analysisResult.score,
      rating_explanation: analysisResult.rating_explanation,
      error: transcriptionError // Include any transcription error in the response
    };
  } catch (error: any) {
    console.error('Analysis failed:', error);
    return {
      sentiment: { label: 'NEUTRAL', score: 0.5 },
      emotions: [
        { label: 'neutral', score: 0.5 },
        { label: 'confidence', score: 0.5 }
      ],
      feedback: ['Error analyzing your answer. Please try again.'],
      improvement_points: ['If the error persists, try rephrasing your answer'],
      confidence: 0.5,
      score: 3,
      rating_explanation: 'Unable to provide accurate rating due to analysis error',
      error: error.message
    };
  }
} 