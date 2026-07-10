import { createTheme } from "@mui/material/styles";

import colors from "./colors";
import typography from "./typography";
import shadows from "./shadows";

const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
    },

    secondary: {
      main: colors.secondary,
    },

    background: {
      default: colors.background,
      paper: colors.card,
    },

    text: {
      primary: colors.text,
      secondary: colors.textSecondary,
    },
  },

  typography,

  shape: {
    borderRadius: 16,
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: shadows.medium,
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 700,
          textTransform: "none",
          height: 50,
        },

        contained: {
          background:
            "linear-gradient(135deg,#2563EB,#4F46E5)",

          "&:hover": {
            background:
              "linear-gradient(135deg,#1D4ED8,#4338CA)",
          },
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
          },
        },
      },
    },
  },
});

export default theme;