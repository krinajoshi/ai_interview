import axios from 'axios';
import { AIAnalysisResult } from '../types/interview';

// Validate environment variables
console.log('Environment check:', {
  nodeEnv: process.env.NODE_ENV,
  apiUrl: process.env.REACT_APP_API_URL
});

// API endpoints
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const SENTIMENT_API_URL = `${API_BASE_URL}/api/v1/sentiment/analyze`;
const TRANSCRIPTION_API_URL = `${API_BASE_URL}/api/v1/transcription/transcribe`;

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

export async function transcribeMedia(mediaUrl: string, mediaType: 'audio' | 'video'): Promise<string> {
  try {
    console.log(`Starting ${mediaType} transcription...`);
    
    // Convert blob URL to File object
    const mediaFile = await blobUrlToFile(mediaUrl, mediaType);
    console.log('File prepared for upload:', {
      name: mediaFile.name,
      type: mediaFile.type,
      size: mediaFile.size
    });
    
    // Validate file before upload
    if (mediaFile.size === 0) {
      throw new Error('File is empty');
    }

    if (mediaFile.size > 10 * 1024 * 1024) { // 10MB limit
      throw new Error('File is too large. Please keep recordings under 10MB.');
    }
    
    // Create FormData and append the file
    const formData = new FormData();
    formData.append('file', mediaFile);
    
    let lastError = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        console.log(`Attempt ${attempts + 1} of ${maxAttempts}...`);
        
        const response = await axios.post(
          TRANSCRIPTION_API_URL,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 60000 // 60 seconds timeout for large files
          }
        );

        console.log('Transcription response:', response.data);

        if (!response.data.transcription && response.data.message) {
          console.warn('Transcription warning:', response.data.message);
          throw new Error(response.data.message);
        }

        return response.data.transcription || '';
      } catch (error: any) {
        lastError = error;
        attempts++;
        
        // If it's a 503 error (service unavailable), wait before retrying
        if (error.response?.status === 503) {
          console.log(`Service unavailable (attempt ${attempts}/${maxAttempts}), waiting before retry...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // Exponential backoff
          continue;
        }
        
        // For other errors, throw immediately
        throw error;
      }
    }
    
    // If we get here, all attempts failed
    throw new Error(`Transcription failed after ${maxAttempts} attempts: ${lastError?.message}`);
  } catch (error: any) {
    console.error('Transcription error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Provide a more user-friendly error message
    let errorMessage = 'Error transcribing audio';
    if (error.response?.status === 503) {
      errorMessage = 'The transcription service is temporarily unavailable. Please try again in a few moments.';
    } else if (error.response?.status === 400) {
      errorMessage = 'Invalid audio format. Please try recording again.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'The transcription request timed out. Please try a shorter recording.';
    }
    
    throw new Error(errorMessage);
  }
}

export const analyzeAnswer = async (
  text: string,
  mediaUrl?: string,
  mediaType?: 'audio' | 'video',
  question?: string
): Promise<AIAnalysisResult> => {
  try {
    let transcription: string | undefined;
    
    console.log('analyzeAnswer called with:', {
      text: text.substring(0, 100),
      mediaUrl: mediaUrl ? 'present' : 'absent',
      mediaType,
      question
    });
    
    // If media URL is provided, transcribe it first
    if (mediaUrl && mediaType) {
      try {
        console.log('Starting media transcription...');
        transcription = await transcribeMedia(mediaUrl, mediaType);
        console.log('Transcription completed:', transcription?.substring(0, 100));
      } catch (error) {
        console.error('Transcription failed:', error);
        // Continue with analysis even if transcription fails
      }
    }

    // Send both text and transcription for analysis
    const response = await retry(async () => {
      console.log('Sending analysis request with:', {
        text: text.substring(0, 100),
        transcription: transcription?.substring(0, 100),
        question,
        mediaUrl: mediaUrl ? 'present' : 'absent',
        mediaType
      });

      const result = await axios.post(SENTIMENT_API_URL, {
        text,
        question,
        transcription
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      console.log('Raw API response:', result.data);
      return result;
    });

    // Log the response data before transformation
    console.log('API response data:', {
      sentiment: response.data.sentiment,
      hasTranscription: !!response.data.transcription,
      hasContentAnalysis: !!response.data.content_analysis,
      hasQualityMetrics: !!response.data.quality_metrics,
      feedback: response.data.feedback?.length,
      improvementPoints: response.data.improvement_points?.length
    });

    // Validate and transform the response
    const analysisResult: AIAnalysisResult = {
      sentiment: {
        label: response.data.sentiment.label || 'NEUTRAL',
        score: response.data.sentiment.score || 0.5
      },
      transcription: transcription || response.data.transcription,
      content_analysis: response.data.content_analysis ? {
        relevance_score: response.data.content_analysis.relevance_score || 0,
        similarity_score: response.data.content_analysis.similarity_score || 0,
        rerank_score: response.data.content_analysis.rerank_score || 0,
        feedback: {
          relevant_points: response.data.content_analysis.feedback?.relevant_points || [],
          missing_points: response.data.content_analysis.feedback?.missing_points || [],
          off_topic_content: response.data.content_analysis.feedback?.off_topic_content || []
        }
      } : undefined,
      quality_metrics: response.data.quality_metrics ? {
        has_gibberish: response.data.quality_metrics.has_gibberish || false,
        has_meaningful_structure: response.data.quality_metrics.has_meaningful_structure || false,
        avg_sentence_length: response.data.quality_metrics.avg_sentence_length || 0,
        sentence_count: response.data.quality_metrics.sentence_count || 0,
        excessive_repetition: response.data.quality_metrics.excessive_repetition || false,
        word_count: response.data.quality_metrics.word_count || 0
      } : undefined,
      score: response.data.score || 0,
      feedback: response.data.feedback || [],
      improvement_points: response.data.improvement_points || []
    };

    console.log('Transformed analysis result:', {
      hasTranscription: !!analysisResult.transcription,
      hasContentAnalysis: !!analysisResult.content_analysis,
      hasQualityMetrics: !!analysisResult.quality_metrics,
      feedback: analysisResult.feedback.length,
      improvementPoints: analysisResult.improvement_points.length
    });

    return analysisResult;
  } catch (error) {
    console.error('Error analyzing answer:', error);
    throw new Error('Failed to analyze answer');
  }
}; 