import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0064B2',
    },
    secondary: {
      main: '#19857b',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '1.8rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.2rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          // Admin interface constraint
          '&.admin-container': {
            maxWidth: '900px',
          },
        },
      },
    },
  },
});

export default theme;