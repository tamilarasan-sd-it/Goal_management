import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const customPalette = {
  mode: "light",
  primary: {
    main: "#1562db",           // Dark Blue
    light: "#5472D3",
    dark: "#002171",
    contrastText: "#FFFFFF",
  },
  secondary: {
    main: "#F57C00",           // Orange
    light: "#FFAD42",
    dark: "#BB4D00",
    contrastText: "#FFFFFF",
  },
  background: {
    default: "#F5F5F5",
    paper: "#FFFFFF",
  },
  text: {
    primary: "#1A1A1A",
    secondary: "#555555",
    disabled: "rgba(0,0,0,0.38)",
  },
  divider: "#E0E0E0",
};

let customTheme = createTheme({
  palette: customPalette,
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#1562db",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#1562db",
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
    },
    body2: {
      fontSize: "0.875rem",
      color: "#555555",
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          color: "#fff",
        },
        containedPrimary: {
          background: "linear-gradient(90deg, #1562db, #5472D3)", // double blue
          "&:hover": {
            background: "linear-gradient(90deg, #002171, #1562db)", // darker hover
          },
        },
        containedSecondary: {
          background: "linear-gradient(90deg, #F57C00, #FFAD42)", // double orange
          "&:hover": {
            background: "linear-gradient(90deg, #BB4D00, #F57C00)", // darker hover
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(90deg, #1562db, #5472D3)", // gradient header
          color: "#FFFFFF",
          boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        },
      },
    },
  },
});

customTheme = responsiveFontSizes(customTheme);

export default customTheme;
