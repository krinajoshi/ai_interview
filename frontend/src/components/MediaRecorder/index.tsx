import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import VideocamIcon from '@mui/icons-material/Videocam';
import StopIcon from '@mui/icons-material/Stop';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';

interface MediaRecorderProps {
  onRecordingComplete: (mediaBlob: Blob | null, type: 'audio' | 'video' | null) => void;
  questionId: string;
  existingRecording?: {
    url: string;
    type: 'audio' | 'video';
  };
}

// Define minimal types needed for MediaRecorder
interface CustomBlobEvent extends Event {
  data: Blob;
}

const MediaRecorderComponent: React.FC<MediaRecorderProps> = ({ 
  onRecordingComplete, 
  questionId,
  existingRecording 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [mediaBlob, setMediaBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaElementRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastQuestionIdRef = useRef<string>(questionId);

  // Reset state when moving to a new question
  useEffect(() => {
    if (questionId !== lastQuestionIdRef.current) {
      handleDelete();
      lastQuestionIdRef.current = questionId;
    }
  }, [questionId]);

  // Set up existing recording if provided
  useEffect(() => {
    if (existingRecording) {
      setRecordingType(existingRecording.type);
      setMediaBlob(null); // We don't have the blob, but we have the URL
      if (mediaElementRef.current) {
        mediaElementRef.current.src = existingRecording.url;
      }
    }
  }, [existingRecording]);

  const startRecording = async (type: 'audio' | 'video') => {
    try {
      // Clear any existing recording first
      handleDelete();

      const constraints = {
        audio: true,
        video: type === 'video',
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Use any type for MediaRecorder since TypeScript doesn't have built-in types for it
      const mediaRecorder = new (window as any).MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event: CustomBlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: type === 'video' ? 'video/webm' : 'audio/webm',
        });
        setMediaBlob(blob);
        onRecordingComplete(blob, type);
        
        // Stop all tracks
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingType(type);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to start recording. Please ensure you have granted permission to use your microphone/camera.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlay = () => {
    if ((mediaBlob || existingRecording) && mediaElementRef.current) {
      if (mediaBlob) {
        mediaElementRef.current.src = URL.createObjectURL(mediaBlob);
      }
      mediaElementRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (mediaElementRef.current) {
      mediaElementRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleDelete = () => {
    setMediaBlob(null);
    setRecordingType(null);
    setIsPlaying(false);
    if (mediaElementRef.current) {
      mediaElementRef.current.src = '';
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    // Notify parent that recording was deleted
    onRecordingComplete(null, null);
  };

  const hasRecording = mediaBlob || existingRecording;

  return (
    <Box sx={{ mt: 2 }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {!isRecording && !hasRecording && (
          <>
            <IconButton
              color="primary"
              onClick={() => startRecording('audio')}
              size="large"
            >
              <MicIcon />
            </IconButton>
            <IconButton
              color="primary"
              onClick={() => startRecording('video')}
              size="large"
            >
              <VideocamIcon />
            </IconButton>
          </>
        )}
        
        {isRecording && (
          <>
            <CircularProgress size={24} sx={{ mr: 1 }} />
            <Typography color="error">Recording {recordingType}...</Typography>
            <IconButton onClick={stopRecording} color="error">
              <StopIcon />
            </IconButton>
          </>
        )}

        {hasRecording && !isRecording && (
          <>
            <IconButton
              onClick={isPlaying ? handlePause : handlePlay}
              color="primary"
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
            <IconButton onClick={handleDelete} color="error">
              <DeleteIcon />
            </IconButton>
            <Typography>
              {recordingType === 'video' ? 'Video' : 'Audio'} recorded
            </Typography>
          </>
        )}
      </Stack>

      {recordingType === 'video' && (
        <video
          ref={mediaElementRef as React.RefObject<HTMLVideoElement>}
          controls
          style={{ display: hasRecording ? 'block' : 'none', maxWidth: '100%' }}
        />
      )}
      
      {recordingType === 'audio' && (
        <audio
          ref={mediaElementRef as React.RefObject<HTMLAudioElement>}
          controls
          style={{ display: hasRecording ? 'block' : 'none', width: '100%' }}
        />
      )}
    </Box>
  );
};

export default MediaRecorderComponent;