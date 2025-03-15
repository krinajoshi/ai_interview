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
import { useAppDispatch, useAppSelector } from '../../store';
import { loginStart, loginSuccess, loginFailure } from '../../features/auth/authSlice';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart());

    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      if (data.status === 'success' && data.user) {
        dispatch(loginSuccess(data.user));
        navigate('/dashboard');
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      dispatch(loginFailure(error instanceof Error ? error.message : 'Login failed'));
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
          {t('common.login')}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('auth.email')}
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label={t('auth.password')}
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Loading...' : t('common.login')}
          </Button>
          <Box sx={{ textAlign: 'center' }}>
            <Link href="#" variant="body2" onClick={() => navigate('/forgot-password')}>
              {t('auth.forgotPassword')}
            </Link>
            <Box sx={{ mt: 1 }}>
              <Link href="#" variant="body2" onClick={() => navigate('/register')}>
                {t('auth.noAccount')}
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default Login; 