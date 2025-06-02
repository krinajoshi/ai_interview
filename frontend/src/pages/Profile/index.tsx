import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../features/auth/authSlice';
import LanguageSelector, { Language } from '../../components/LanguageSelector';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
    
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setLanguage(user.preferred_language as Language || 'en');
    }
  }, [user, isAuthenticated, navigate]);
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setSuccess(false);
    setError('');
    
    try {
      // API call to update profile would go here
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    setLoading(true);
    
    try {
      // API call to delete account would go here
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      dispatch(logout());
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
      setLoading(false);
    }
  };
  
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Profile
        </Typography>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{ width: 64, height: 64, mr: 2 }}
              src={user?.avatar || undefined}
            >
              {user?.name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>Profile updated successfully</Alert>}
          
          <Box component="form" onSubmit={handleUpdateProfile}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Preferred Language</InputLabel>
                  <LanguageSelector 
                    value={language} 
                    onChange={handleLanguageChange} 
                  />
                </FormControl>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Update Profile'}
              </Button>
            </Box>
          </Box>
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setOpenDeleteDialog(true)}
            >
              Delete Account
            </Button>
          </Box>
        </Paper>
        
        <Dialog
          open={openDeleteDialog}
          onClose={() => setOpenDeleteDialog(false)}
        >
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button onClick={handleDeleteAccount} color="error" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Profile;