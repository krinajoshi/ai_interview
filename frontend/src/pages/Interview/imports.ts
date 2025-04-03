import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  TextField,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import { Mic, Stop, Videocam, Send } from '@mui/icons-material';
import { Answer, AIAnalysisResult } from '../../types/interview';
import { analyzeAnswer } from '../../services/aiAnalysis';
import { Language } from '../../components/LanguageSelector';
import { calculateAnswerScore } from '../../utils/scoreCalculator'; 