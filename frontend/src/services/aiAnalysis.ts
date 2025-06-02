import axios from 'axios';
import { AIAnalysisResult } from '../types/interview';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Analyze an interview answer using the AI service
 */
export const analyzeAnswer = async (
  text: string,
  mediaUrl?: string,
  mediaType?: 'audio' | 'video',
  question?: string
): Promise<AIAnalysisResult> => {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Make API call to analyze answer
    const response = await axios.post(
      `${API_URL}/api/v1/analysis/answer`,
      {
        question,
        answer: text,
        reference_answer: "",
        code_submission: null
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error analyzing answer:', error);
    // Return a default analysis if the API call fails
    return {
      score: 0.7,
      feedback: 'Unable to analyze answer at this time. Please try again later.',
      correctness_score: 0.7,
      clarity_score: 0.7,
      depth_score: 0.7,
      confidence_score: 0.7,
      strengths: ['Clear explanation'],
      improvements: ['Could provide more examples'],
      suggestions: ['Consider adding more details'],
      keywords_found: ['experience'],
      keywords_missing: ['specific examples']
    };
  }
};

/**
 * Transcribe audio or video media
 */
export const transcribeMedia = async (
  mediaUrl: string,
  mediaType: 'audio' | 'video'
): Promise<string> => {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Make API call to transcribe media
    const response = await axios.post(
      `${API_URL}/api/v1/transcription`,
      {
        mediaUrl,
        mediaType
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data.transcription;
  } catch (error) {
    console.error('Error transcribing media:', error);
    return 'Transcription failed. Please try again later.';
  }
};

/**
 * Get feedback on interview performance
 */
export const getInterviewFeedback = async (interviewId: string): Promise<any> => {
  try {
    // Get the auth token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Not authenticated');
    }

    // Make API call to get interview feedback
    const response = await axios.get(
      `${API_URL}/api/v1/interviews/${interviewId}/feedback`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error getting interview feedback:', error);
    // Return a default feedback if the API call fails
    return {
      overallScore: 0.7,
      technicalScore: 0.7,
      communicationScore: 0.7,
      feedbackSummary: 'Unable to generate feedback at this time. Please try again later.',
      improvementAreas: ['Communication skills', 'Technical knowledge']
    };
  }
};