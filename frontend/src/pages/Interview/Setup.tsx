import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  setJobTitle,
  setResume,
  setJobDescription,
  setQuestions,
  startInterview,
  setLoading,
  setError,
} from '../../features/interview/interviewSlice';
import LanguageSelector from '../../components/LanguageSelector';

const API_URL = process.env.REACT_APP_API_URL;

interface InterviewSetupProps {
  onStart: () => void;
}

const InterviewSetup: React.FC<InterviewSetupProps> = ({ onStart }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error, selectedLanguage } = useAppSelector((state) => state.interview);

  const [jobTitleInput, setJobTitleInput] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescriptionText, setJobDescriptionText] = useState('');
  const [storedResumeFile, setStoredResumeFile] = useState<string | null>(null);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        dispatch(setResume(text));
      };
      reader.readAsText(file);
    }
  };

  const handleStartInterview = async () => {
    if (!jobTitleInput.trim()) {
      dispatch(setError('Please enter a job title'));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      // Prepare the request payload
      const payload = {
        jobTitle: jobTitleInput,
        resume: resumeFile ? await resumeFile.text() : null,
        jobDescription: jobDescriptionText || null,
        language: selectedLanguage,
      };

      // Make API call to generate questions
      const response = await fetch(`${API_URL}/api/v1/interview/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate interview questions');
      }

      const data = await response.json();
      console.log("Response data:", data);
      console.log("Questions data:", data.questions);
      
      // Save the resume file name if returned
      if (data.resumeFileName) {
        setStoredResumeFile(data.resumeFileName);
      }

      // Validate the questions format
      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        console.error("Questions is not an array or is empty:", data.questions);
        throw new Error('Invalid questions format received from server');
      }

      // Ensure each question has the required structure
      const validQuestions = data.questions.every((q: any) => {
        const isValid = q.id && q.text && typeof q.text === 'object' && q.text[selectedLanguage] && q.type;
        if (!isValid) {
          console.error("Invalid question format:", q);
          console.error(`id: ${Boolean(q.id)}, text: ${Boolean(q.text)}, text object: ${q.text && typeof q.text === 'object'}, selected language: ${q.text && q.text[selectedLanguage]}, type: ${Boolean(q.type)}`);
        }
        return isValid;
      });

      if (!validQuestions) {
        throw new Error('Invalid question format received from server');
      }

      // Set the interview state
      dispatch(setJobTitle(jobTitleInput));
      dispatch(setJobDescription(jobDescriptionText || null));
      dispatch(setQuestions(data.questions));
      dispatch(startInterview());
      
      // Navigate to the interview page
      navigate('/interview');
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to start interview'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleStart = () => {
    onStart();
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {selectedLanguage === 'fr' ? 'Configuration de l\'entretien' :
             selectedLanguage === 'ar' ? 'إعداد المقابلة' :
             'Interview Setup'}
          </Typography>
          <Button
            variant="outlined"
            onClick={handleBack}
          >
            {selectedLanguage === 'fr' ? 'Retour au tableau de bord' :
             selectedLanguage === 'ar' ? 'العودة إلى لوحة التحكم' :
             'Back to Dashboard'}
          </Button>
        </Box>

        <Paper sx={{ p: 3, mb: 3, direction: selectedLanguage === 'ar' ? 'rtl' : 'ltr' }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {storedResumeFile && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {selectedLanguage === 'fr' ? 'CV enregistré avec succès : ' :
               selectedLanguage === 'ar' ? ' :تم حفظ السيرة الذاتية بنجاح' :
               'Resume stored successfully: '}
              {storedResumeFile}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedLanguage === 'fr' ? 'Informations requises' :
               selectedLanguage === 'ar' ? 'المعلومات المطلوبة' :
               'Required Information'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedLanguage === 'fr' ? 'Veuillez entrer le titre du poste pour lequel vous postulez.' :
               selectedLanguage === 'ar' ? '.يرجى إدخال المسمى الوظيفي الذي تتقدم له' :
               'Please enter the job title you are applying for.'}
            </Typography>
            <TextField
              fullWidth
              label={
                selectedLanguage === 'fr' ? 'Titre du poste' :
                selectedLanguage === 'ar' ? 'المسمى الوظيفي' :
                'Job Title'
              }
              value={jobTitleInput}
              onChange={(e) => setJobTitleInput(e.target.value)}
              error={!!error}
              helperText={error}
              disabled={loading}
              sx={{ mb: 2 }}
              InputProps={{
                style: { textAlign: selectedLanguage === 'ar' ? 'right' : 'left' }
              }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedLanguage === 'fr' ? 'Informations optionnelles' :
               selectedLanguage === 'ar' ? 'معلومات اختيارية' :
               'Optional Information'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedLanguage === 'fr' ? 
                'Fournir votre CV et la description du poste aidera à générer des questions plus pertinentes.' :
               selectedLanguage === 'ar' ?
                '.تقديم سيرتك الذاتية ووصف الوظيفة سيساعد في توليد أسئلة أكثر صلة' :
                'Providing your resume and job description will help generate more relevant questions.'}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <input
                accept=".txt,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="resume-file"
                type="file"
                onChange={handleResumeUpload}
              />
              <label htmlFor="resume-file">
                <Button variant="outlined" component="span" fullWidth>
                  {selectedLanguage === 'fr' ? 'Télécharger le CV' :
                   selectedLanguage === 'ar' ? 'تحميل السيرة الذاتية' :
                   'Upload Resume'}
                </Button>
              </label>
              {resumeFile && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {selectedLanguage === 'fr' ? 'Fichier sélectionné : ' :
                   selectedLanguage === 'ar' ? ' :الملف المحدد' :
                   'File selected: '}
                  {resumeFile.name}
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={4}
              label={
                selectedLanguage === 'fr' ? 'Description du poste' :
                selectedLanguage === 'ar' ? 'وصف الوظيفة' :
                'Job Description'
              }
              value={jobDescriptionText}
              onChange={(e) => setJobDescriptionText(e.target.value)}
              placeholder={
                selectedLanguage === 'fr' ? 'Collez la description du poste ici...' :
                selectedLanguage === 'ar' ? '...الصق وصف الوظيفة هنا' :
                'Paste the job description here...'
              }
              InputProps={{
                style: { textAlign: selectedLanguage === 'ar' ? 'right' : 'left' }
              }}
            />
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleStartInterview}
            disabled={loading || !jobTitleInput.trim()}
            sx={{ mt: 2 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                {selectedLanguage === 'fr' ? 'Génération des questions...' :
                 selectedLanguage === 'ar' ? '...جاري توليد الأسئلة' :
                 'Generating Questions...'}
              </>
            ) : (
              selectedLanguage === 'fr' ? 'Commencer l\'entretien' :
              selectedLanguage === 'ar' ? 'بدء المقابلة' :
              'Start Interview'
            )}
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default InterviewSetup; 