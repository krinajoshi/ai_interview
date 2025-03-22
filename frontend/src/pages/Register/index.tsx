import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from '@mui/material';
import { useAppDispatch } from '../../store';
import { loginSuccess } from '../../features/auth/authSlice';

// Replace hardcoded API_URL with environment variable
const API_URL = process.env.REACT_APP_API_URL;

const Register: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to register with:', API_URL);
      
      // First check if the server is available
      try {
        const healthCheck = await fetch(`${API_URL}/health`);
        if (!healthCheck.ok) {
          throw new Error('Server is not responding properly');
        }
      } catch (healthError) {
        console.error('Health check failed:', healthError);
        throw new Error('Unable to connect to the server. Please try again later.');
      }

      // Proceed with registration
      const response = await fetch(`${API_URL}/api/v1/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          preferred_language: "en",
          subscription_status: "free"
        }),
      });

      console.log('Registration response status:', response.status);
      console.log('Registration response headers:', Object.fromEntries(response.headers.entries()));
      
      let data;
      try {
        const textResponse = await response.text();
        console.log('Raw response:', textResponse);
        data = JSON.parse(textResponse);
        console.log('Parsed registration data:', data);
      } catch (jsonError) {
        console.error('Error parsing response:', jsonError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        throw new Error(data.detail || `Registration failed with status: ${response.status}`);
      }

      if (data.user && data.token) {
        dispatch(loginSuccess({ ...data.user, token: data.token }));
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Registration failed. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Create Account
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            autoFocus
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm your password"
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link 
              component="button"
              variant="body2" 
              onClick={() => navigate('/login')}
            >
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Register; 