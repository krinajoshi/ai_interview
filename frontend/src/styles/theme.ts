import { createTheme, alpha } from '@mui/material/styles';

// Professional color palette
const colors = {
  primary: {
    main: '#2563EB', // Modern blue
    light: '#60A5FA',
    dark: '#1E40AF',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#4F46E5', // Indigo
    light: '#818CF8',
    dark: '#3730A3',
    contrastText: '#FFFFFF',
  },
  success: {
    main: '#059669', // Emerald
    light: '#34D399',
    dark: '#065F46',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#DC2626', // Modern red
    light: '#F87171',
    dark: '#991B1B',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#D97706', // Amber
    light: '#FBBF24',
    dark: '#92400E',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#0284C7', // Sky blue
    light: '#38BDF8',
    dark: '#075985',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};

const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    grey: colors.grey,
    background: {
      default: colors.grey[100],
      paper: '#FFFFFF',
    },
    text: {
      primary: colors.grey[900],
      secondary: colors.grey[600],
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.57,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.05)',
    '0px 4px 6px rgba(0, 0, 0, 0.07)',
    '0px 6px 8px rgba(0, 0, 0, 0.08)',
    '0px 8px 12px rgba(0, 0, 0, 0.09)',
    '0px 12px 16px rgba(0, 0, 0, 0.10)',
    '0px 14px 20px rgba(0, 0, 0, 0.12)',
    '0px 16px 24px rgba(0, 0, 0, 0.14)',
    '0px 18px 28px rgba(0, 0, 0, 0.16)',
    '0px 20px 32px rgba(0, 0, 0, 0.18)',
    '0px 22px 36px rgba(0, 0, 0, 0.20)',
    '0px 24px 40px rgba(0, 0, 0, 0.22)',
    '0px 26px 44px rgba(0, 0, 0, 0.24)',
    '0px 28px 48px rgba(0, 0, 0, 0.26)',
    '0px 30px 52px rgba(0, 0, 0, 0.28)',
    '0px 32px 56px rgba(0, 0, 0, 0.30)',
    '0px 34px 60px rgba(0, 0, 0, 0.32)',
    '0px 36px 64px rgba(0, 0, 0, 0.34)',
    '0px 38px 68px rgba(0, 0, 0, 0.36)',
    '0px 40px 72px rgba(0, 0, 0, 0.38)',
    '0px 42px 76px rgba(0, 0, 0, 0.40)',
    '0px 44px 80px rgba(0, 0, 0, 0.42)',
    '0px 46px 84px rgba(0, 0, 0, 0.44)',
    '0px 48px 88px rgba(0, 0, 0, 0.46)',
    '0px 50px 92px rgba(0, 0, 0, 0.48)'
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontSize: '0.9375rem',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedPrimary: {
          background: `linear-gradient(145deg, ${colors.primary.main}, ${colors.primary.dark})`,
          '&:hover': {
            background: `linear-gradient(145deg, ${colors.primary.dark}, ${colors.primary.main})`,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
          border: `1px solid ${colors.grey[200]}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: colors.grey[300],
            },
            '&:hover fieldset': {
              borderColor: colors.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary.main,
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: colors.grey[900],
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: alpha(colors.primary.main, 0.08),
            '&:hover': {
              backgroundColor: alpha(colors.primary.main, 0.12),
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
  },
});

export default theme; 