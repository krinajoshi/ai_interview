import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Tooltip,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  AccountCircle,
  Menu as MenuIcon,
  Language,
  Dashboard,
  Person,
  ExitToApp,
  PlayArrow,
  Assessment,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store';
import { logout } from '../../features/auth/authSlice';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isAuthenticated = useAppSelector((state) => state.auth?.isAuthenticated);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleLangMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLangClose = () => {
    setLangAnchorEl(null);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    handleLangClose();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    handleClose();
  };

  const menuItems = [
    { label: t('common.dashboard'), icon: <Dashboard />, onClick: () => navigate('/dashboard') },
    { label: t('common.profile'), icon: <Person />, onClick: () => navigate('/profile') },
    { label: t('common.logout'), icon: <ExitToApp />, onClick: handleLogout },
  ];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.grey[200]}`,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, sm: 70 } }}>
          {/* Mobile Menu */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              onClick={handleMobileMenu}
              sx={{ color: theme.palette.text.primary }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={mobileMenuAnchor}
              open={Boolean(mobileMenuAnchor)}
              onClose={handleMobileMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                  mt: 1.5,
                },
              }}
            >
              {isAuthenticated ? (
                menuItems.map((item) => (
                  <MenuItem
                    key={item.label}
                    onClick={() => {
                      item.onClick();
                      handleMobileMenuClose();
                    }}
                    sx={{
                      py: 1,
                      px: 2.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <Box component="span" sx={{ mr: 2, color: theme.palette.text.secondary }}>
                      {item.icon}
                    </Box>
                    {item.label}
                  </MenuItem>
                ))
              ) : (
                <>
                  <MenuItem onClick={() => navigate('/login')}>
                    <Box component="span" sx={{ mr: 2, color: theme.palette.text.secondary }}>
                      <PlayArrow />
                    </Box>
                    {t('common.login')}
                  </MenuItem>
                  <MenuItem onClick={() => navigate('/register')}>
                    <Box component="span" sx={{ mr: 2, color: theme.palette.text.secondary }}>
                      <Person />
                    </Box>
                    {t('common.register')}
                  </MenuItem>
                </>
              )}
            </Menu>
          </Box>

          {/* Logo */}
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: { xs: 1, md: 0 },
              mr: { md: 4 },
              fontWeight: 700,
              color: theme.palette.primary.main,
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <Assessment sx={{ mr: 1 }} />
            AI Interview Prep
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {isAuthenticated && (
              <>
                <Button
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    color: theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    },
                  }}
                  startIcon={<Dashboard />}
                >
                  {t('common.dashboard')}
                </Button>
              </>
            )}
          </Box>

          {/* Language Selector */}
          <Tooltip title={t('common.changeLanguage')}>
            <IconButton
              onClick={handleLangMenu}
              sx={{
                ml: 1,
                color: theme.palette.text.primary,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Language />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLangClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                mt: 1.5,
              },
            }}
          >
            <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
            <MenuItem onClick={() => handleLanguageChange('fr')}>Français</MenuItem>
            <MenuItem onClick={() => handleLanguageChange('ar')}>العربية</MenuItem>
          </Menu>

          {/* User Menu */}
          {isAuthenticated ? (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', ml: 2 }}>
              <Tooltip title={t('common.userMenu')}>
                <IconButton onClick={handleMenu} sx={{ p: 0.5 }}>
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '1.2rem',
                    }}
                  >
                    <AccountCircle />
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                onClick={handleClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
                    mt: 1.5,
                    '& .MuiMenuItem-root': {
                      px: 2.5,
                      py: 1,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {menuItems.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <MenuItem
                      onClick={item.onClick}
                      sx={{
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    >
                      <Box component="span" sx={{ mr: 2, color: theme.palette.text.secondary }}>
                        {item.icon}
                      </Box>
                      {item.label}
                    </MenuItem>
                    {index < menuItems.length - 1 && (
                      <Divider sx={{ my: 0.5 }} />
                    )}
                  </React.Fragment>
                ))}
              </Menu>
            </Box>
          ) : (
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/login')}
                startIcon={<PlayArrow />}
              >
                {t('common.login')}
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                startIcon={<Person />}
              >
                {t('common.register')}
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 