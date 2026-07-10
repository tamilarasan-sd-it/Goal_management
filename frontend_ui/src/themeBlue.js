import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// --- Elegant Soft Palette ---
const palette = {
  mode: "light",
  primary: {
    main: "#4C6EF5",   // Soft Indigo Blue
    light: "#DCE3FA",  // Misty Blue
    dark: "#364FC7",   // Deep Indigo
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#94D2BD",   // Muted Mint Green
    light: "#DFF5EC",  // Pale Mint
    dark: "#5C9D8A",   // Earthy Green
    contrastText: "#ffffff",
  },
  background: {
    default: "#F8FAFC", // Gentle Off-White
    paper: "#ffffff",   // Crisp White
  },
  text: {
    primary: "#2F3E4D",   // Slate Gray
    secondary: "#6C7A89", // Muted Gray
    disabled: "rgba(0,0,0,0.38)",
  },
  error: {
    main: "#D64545",
    light: "#F2B8B5",
    dark: "#A83232",
  },
  warning: {
    main: "#F4A261",
    light: "#FFE3C4",
    dark: "#C97C3E",
  },
  info: {
    main: "#3A86FF",
    light: "#B3D4FF",
    dark: "#2B6EDC",
    contrastText: "#ffffff",
  },
  success: {
    main: "#6FCF97",
    light: "#D2F2E3",
    dark: "#4BAF73",
  },
  divider: "#E3E8EF",
};

// --- Typography: Clean & Professional ---
const typography = {
  fontFamily: '"Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontSize: "2.5rem", fontWeight: 700, color: palette.text.primary },
  h2: { fontSize: "2rem", fontWeight: 600, color: palette.text.primary },
  h3: { fontSize: "1.75rem", fontWeight: 600, color: palette.text.primary },
  h4: { fontSize: "1.5rem", fontWeight: 500, color: palette.text.primary },
  h5: { fontSize: "1.25rem", fontWeight: 500, color: palette.text.primary },
  h6: { fontSize: "1rem", fontWeight: 500, color: palette.text.primary },
  subtitle1: { fontSize: "1rem", fontWeight: 500, color: palette.text.secondary },
  subtitle2: { fontSize: "0.9rem", fontWeight: 500, color: palette.text.secondary },
  body1: { fontSize: "1rem", lineHeight: 1.6, color: palette.text.primary },
  body2: { fontSize: "0.9rem", lineHeight: 1.5, color: palette.text.secondary },
  button: { textTransform: "none", fontWeight: 600 },
  caption: { fontSize: "0.75rem", color: palette.text.secondary },
  overline: { fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: palette.text.secondary },
};

// --- Shape, Spacing, Shadows ---
const shape = { borderRadius: 4 };
const spacing = 8;
const shadows = [
  "none",
  "0px 2px 4px rgba(0,0,0,0.04)",
  "0px 4px 8px rgba(0,0,0,0.06)",
  "0px 8px 16px rgba(0,0,0,0.08)",
  ...Array(21).fill("none"),
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
    defaultProps: { elevation: 0 },
    styleOverrides: {
      root: {
        backgroundColor: palette.background.paper,
        color: palette.text.primary,
        borderBottom: `1px solid ${palette.divider}`,
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
        padding: '10px 20px',
        fontWeight: 600,
        transition: 'all 0.2s ease-in-out',
      },
      containedPrimary: {
        backgroundColor: palette.primary.main,
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
      outlinedPrimary: {
        borderColor: palette.divider,
        color: palette.primary.main,
        "&:hover": {
          backgroundColor: `${palette.primary.main}10`,
          borderColor: palette.primary.main,
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
        boxShadow: shadows[2],
        border: `1px solid ${palette.divider}`,
        transition: 'box-shadow 0.3s ease-in-out',
        "&:hover": {
          boxShadow: shadows[3],
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
        fontWeight: 500,
        backgroundColor: `${palette.primary.light}30`,
        color: palette.primary.dark,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: palette.background.default,
        "& .MuiTableCell-head": {
          fontWeight: 700,
          color: palette.text.secondary,
          fontSize: '0.85rem',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${palette.divider}`,
        padding: '10px 16px',
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
};

// --- Create Theme ---
let themeSoftElegant = createTheme({
  palette,
  typography,
  shape,
  spacing,
  shadows,
  components,
});

// --- Responsive Typography ---
themeSoftElegant = responsiveFontSizes(themeSoftElegant);

export default themeSoftElegant;
