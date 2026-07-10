import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// --- Neutral Professional Palette (no blues, no harsh dark colors) ---
const palette = {
  mode: "light",
  primary: {
    main: "#6d9773",       // Muted professional green
    light: "#a6c3a9",
    dark: "#4c6b50",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#b0a990",       // Warm neutral taupe
    light: "#d6d1c4",
    dark: "#7e7861",
    contrastText: "#ffffff",
  },
  background: {
    default: "#f5f5f2",    // Very light neutral background
    paper: "#ffffff",      // White cards/panels
  },
  text: {
    primary: "#2d2d2d",    // Neutral dark gray
    secondary: "#6e6e6e",  // Softer medium gray
    disabled: "rgba(0,0,0,0.38)",
  },
  error: {
    main: "#d64545",       // Muted red
    light: "#ef7a7a",
    dark: "#9e2f2f",
  },
  warning: {
    main: "#f0a202",       // Soft orange
    light: "#ffcd70",
    dark: "#b87400",
  },
  info: {
    main: "#8a8a8a",       // Neutral gray instead of blue
    light: "#b5b5b5",
    dark: "#5e5e5e",
  },
  success: {
    main: "#6c9a8b",       // Calm muted green
    light: "#a3c5b6",
    dark: "#4a6d60",
  },
  divider: "#e3e3e3",
};

// --- Professional Typography ---
const typography = {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: {
    fontSize: "2.25rem",
    fontWeight: 700,
    lineHeight: 1.3,
    color: palette.text.primary,
  },
  h2: {
    fontSize: "1.75rem",
    fontWeight: 600,
    lineHeight: 1.35,
    color: palette.text.primary,
  },
  h3: {
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.4,
    color: palette.text.primary,
  },
  h4: {
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1.4,
    color: palette.text.primary,
  },
  h5: {
    fontSize: "1rem",
    fontWeight: 500,
    color: palette.text.primary,
  },
  subtitle1: {
    fontSize: "1rem",
    fontWeight: 500,
    color: palette.text.secondary,
  },
  subtitle2: {
    fontSize: "0.9rem",
    fontWeight: 500,
    color: palette.text.secondary,
  },
  body1: {
    fontSize: "0.95rem",
    lineHeight: 1.6,
    color: palette.text.primary,
  },
  body2: {
    fontSize: "0.85rem",
    lineHeight: 1.5,
    color: palette.text.secondary,
  },
  button: {
    textTransform: "none",
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  caption: {
    fontSize: "0.75rem",
    color: palette.text.secondary,
  },
  overline: {
    fontSize: "0.7rem",
    fontWeight: 600,
    textTransform: "uppercase",
    color: palette.text.secondary,
  },
};

// --- Shape, Spacing, Shadows ---
const shape = {
  borderRadius: 4, // softer than sharp but still modern
};

const spacing = 8;

const shadows = [
  "none",
  "0px 1px 3px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.24)",
  "0px 3px 6px rgba(0,0,0,0.15), 0px 2px 4px rgba(0,0,0,0.12)",
  "0px 6px 12px rgba(0,0,0,0.1)",
  "0px 10px 20px rgba(0,0,0,0.1)",
  "0px 15px 25px rgba(0,0,0,0.08)",
  ...Array(19).fill("none"),
];

// --- Component Overrides ---
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        backgroundColor: palette.background.default,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        background: `linear-gradient(90deg, ${palette.primary.main}, ${palette.primary.dark})`,
        color: palette.primary.contrastText,
      },
    },
  },
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 4,
        paddingLeft: 16,
        paddingRight: 16,
        fontWeight: 600,
      },
      containedPrimary: {
        background: `linear-gradient(90deg, ${palette.primary.main}, ${palette.primary.dark})`,
        "&:hover": {
          backgroundColor: palette.primary.dark,
        },
      },
      containedSecondary: {
        backgroundColor: palette.secondary.main,
        "&:hover": {
          backgroundColor: palette.secondary.dark,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: palette.background.default,
        "& .MuiTableCell-head": {
          fontWeight: 600,
          color: palette.text.primary,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${palette.divider}`,
      },
    },
  },
  MuiDivider: {
    styleOverrides: {
      root: {
        borderColor: palette.divider,
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 4,
        fontSize: "0.75rem",
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        fontWeight: 500,
      },
    },
  },
};

// --- Create theme ---
let theme = createTheme({
  palette,
  typography,
  shape,
  spacing,
  shadows,
  components,
});

// --- Responsive Typography ---
theme = responsiveFontSizes(theme);

export default theme;
