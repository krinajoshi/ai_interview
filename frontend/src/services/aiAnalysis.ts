import axios from 'axios';
import { AIAnalysisResult } from '../types/interview';
import { API_BASE_URL } from '../config';

// Validate environment variables
console.log('Environment check:', {
  nodeEnv: process.env.NODE_ENV,
  apiUrl: process.env.REACT_APP_API_URL
});

// API endpoints
const SENTIMENT_API_URL = `${API_BASE_URL}/api/v1/sentiment/analyze`;
const TRANSCRIPTION_API_URL = `${API_BASE_URL}/api/v1/transcription/transcribe`;

const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;

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

export const transcribeMedia = async (mediaUrl: string, mediaType: "audio" | "video"): Promise<string> => {
  try {
    // Convert Blob URL to Blob
    const response = await fetch(mediaUrl);
    const blob = await response.blob();

    // Create FormData and append the blob
    const formData = new FormData();
    formData.append('file', blob, `recording.${mediaType === 'audio' ? 'wav' : 'mp4'}`);
    formData.append('mediaType', mediaType);

    const transcriptionResponse = await fetch(`${API_BASE_URL}/api/v1/transcription/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      console.error('Transcription failed:', transcriptionResponse.status, transcriptionResponse.statusText);
      return ''; // Return empty string instead of throwing
    }

    const data = await transcriptionResponse.json();
    return data.transcription || '';
  } catch (error) {
    console.error('Error transcribing media:', error);
    return ''; // Return empty string instead of throwing
  }
};

export const analyzeAnswer = async (
  text: string,
  mediaUrl?: string,
  mediaType?: "audio" | "video",
  question?: string
): Promise<AIAnalysisResult> => {
  try {
    // First, get transcription if media is provided
    let transcription = '';
    if (mediaUrl && mediaType) {
      transcription = await transcribeMedia(mediaUrl, mediaType);
    }

    // Prepare the text for analysis
    const textToAnalyze = transcription || text;

    // Call Cohere API for sentiment analysis
    const sentimentResponse = await fetch('https://api.cohere.ai/v1/classify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'large',
        inputs: [textToAnalyze],
        examples: [
          { text: "This is a great answer with clear examples and professional tone", label: "POSITIVE" },
          { text: "The response is unclear and lacks structure", label: "NEGATIVE" },
          { text: "The answer is okay but could use more details", label: "NEUTRAL" }
        ]
      })
    });

    if (!sentimentResponse.ok) {
      throw new Error('Sentiment analysis failed');
    }

    const sentimentData = await sentimentResponse.json();
    const sentimentScore = sentimentData.classifications[0].confidence;
    const sentimentLabel = sentimentData.classifications[0].prediction;

    // Call Cohere API for text generation to get feedback
    const feedbackResponse = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'large',
        prompt: `Analyze this interview answer and provide constructive feedback:\n\nAnswer: ${textToAnalyze}\n\nProvide feedback in the following format:\nScore (0-5): [number]\nComments: [list of positive points]\nSuggestions: [list of improvement suggestions]\n\nFeedback:`,
        max_tokens: 300,
        temperature: 0.7,
        k: 0,
        stop_sequences: ["\n\n"],
        return_likelihoods: "NONE"
      })
    });

    if (!feedbackResponse.ok) {
      throw new Error('Feedback generation failed');
    }

    const feedbackData = await feedbackResponse.json();
    const feedbackText = feedbackData.generations[0].text;

    // Parse the feedback text
    const scoreMatch = feedbackText.match(/Score \(0-5\): (\d+(\.\d+)?)/);
    const commentsMatch = feedbackText.match(/Comments: (.*?)(?=Suggestions:|$)/);
    const suggestionsMatch = feedbackText.match(/Suggestions: (.*?)$/);

    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 3.0;
    const comments = commentsMatch ? commentsMatch[1].split('\n').filter(Boolean) : [];
    const suggestions = suggestionsMatch ? suggestionsMatch[1].split('\n').filter(Boolean) : [];

    // Calculate improvement points based on sentiment and feedback
    const improvement_points: string[] = [];
    if (sentimentScore < 0.6) {
      improvement_points.push("Consider using a more professional and confident tone");
    }
    if (textToAnalyze.split(' ').length < 50) {
      improvement_points.push("Provide more detailed examples and explanations");
    }
    if (!textToAnalyze.includes('because') && !textToAnalyze.includes('therefore')) {
      improvement_points.push("Add more logical connections between ideas");
    }

    return {
      score,
      feedback: feedbackText,
      comments,
      suggestions,
      sentiment: {
        score: sentimentScore,
        label: sentimentLabel
      },
      improvement_points,
      transcription: transcription || undefined
    };
  } catch (error) {
    console.error('Error analyzing answer:', error);
    return {
      score: 0,
      feedback: "Error analyzing answer. Please try again.",
      comments: [],
      suggestions: ["Please try again with your answer"],
      sentiment: {
        score: 0.5,
        label: "NEUTRAL"
      },
      improvement_points: ["Unable to analyze answer at this time"],
      transcription: undefined
    };
  }
}; 