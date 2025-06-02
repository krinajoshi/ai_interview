import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';
import Navbar from '../Navbar';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, py: 2 }}>
        <Container maxWidth="lg">
          <Outlet />
        </Container>
      </Box>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: 'auto',
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[200]
              : theme.palette.grey[800],
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            © {new Date().getFullYear()} AI Interview Preparation App
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;