import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Avatar,
  Divider,
  Alert,
} from '@mui/material';
import { useAppSelector } from '../../store';

const Profile: React.FC = () => {
  const { t } = useTranslation();
  const user = useAppSelector((state) => state.auth.user);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isEditing, setIsEditing] = React.useState(false);

  const [formData, setFormData] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Implement API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      setLoading(false);
      return;
    }

    try {
      // TODO: Implement API call to change password
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setSuccess(true);
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('common.profile')}
        </Typography>

        <Grid container spacing={3}>
          {/* Profile Information */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{ width: 64, height: 64, mr: 2 }}
                  src={user?.avatar}
                >
                  {user?.name?.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6">{user?.name}</Typography>
                  <Typography color="text.secondary">{user?.email}</Typography>
                </Box>
              </Box>

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Profile updated successfully!
                </Alert>
              )}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleUpdateProfile}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Full Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  label="Email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Updating...' : t('profile.updateProfile')}
                </Button>
              </form>
            </Paper>
          </Grid>

          {/* Change Password */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('profile.changePassword')}
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleChangePassword}>
                <TextField
                  fullWidth
                  margin="normal"
                  type="password"
                  label="Current Password"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  type="password"
                  label="New Password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  margin="normal"
                  type="password"
                  label="Confirm New Password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Updating...' : t('profile.changePassword')}
                </Button>
              </form>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default Profile; 