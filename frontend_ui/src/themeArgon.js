import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// --- Palette: Argon-Inspired ---
const palette = {
  mode: "light",
  primary: {
    main: "#5E72E4",      // Argon Blue
    light: "#8A95F5",
    dark: "#3245C7",
    contrastText: "#fff",
  },
  secondary: {
    main: "#F7FAFC",      // Light background
    light: "#FFFFFF",
    dark: "#E3E6F0",
    contrastText: "#2F3E4D",
  },
  background: {
    default: "#F8F9FE",   // Soft light gray
    paper: "#FFFFFF",
  },
  text: {
    primary: "#32325D",    // Dark gray
    secondary: "#5E72E4",  // Accent color
    disabled: "rgba(0,0,0,0.38)",
  },
  error: { main: "#F5365C" },
  warning: { main: "#FB6340" },
  info: { main: "#11CDEF" },
  success: { main: "#2DCE89" },
  divider: "#E9ECEF",
};

// --- Typography ---
const typography = {
  fontFamily: '"Open Sans", "Helvetica Neue", "Arial", sans-serif',
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

// --- Shape & Shadows ---
const shape = { borderRadius: 10 };
const spacing = 8;
const shadows = [
  "none",
  "0 1px 2px rgba(0,0,0,0.05)",
  "0 4px 6px rgba(0,0,0,0.08)",
  "0 8px 12px rgba(0,0,0,0.12)",
  "0 12px 24px rgba(0,0,0,0.15)",
  ...Array(21).fill("none"),
];

// --- Component Overrides ---
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: { backgroundColor: palette.background.default },
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
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: "#FFFFFF",
        color: palette.text.primary,
        width: 260,
      },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
        fontWeight: 600,
        padding: "10px 20px",
        transition: "all 0.2s ease-in-out",
      },
      containedPrimary: {
        backgroundColor: palette.primary.main,
        "&:hover": { backgroundColor: palette.primary.dark },
        boxShadow: "0 4px 6px rgba(94,114,228,0.4)",
      },
      containedSecondary: {
        backgroundColor: palette.secondary.main,
        "&:hover": { backgroundColor: palette.secondary.dark },
      },
      outlinedPrimary: {
        borderColor: palette.divider,
        color: palette.primary.main,
        "&:hover": { backgroundColor: `${palette.primary.main}15`, borderColor: palette.primary.main },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
        boxShadow: shadows[2],
        border: "none",
        transition: "all 0.3s ease-in-out",
        "&:hover": { boxShadow: shadows[3] },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
        fontWeight: 500,
        backgroundColor: `${palette.primary.light}20`,
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
          fontSize: "0.85rem",
          textTransform: "uppercase",
          letterSpacing: 0.8,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: { borderBottom: `1px solid ${palette.divider}`, padding: "12px 16px" },
    },
  },
  MuiDivider: { styleOverrides: { root: { borderColor: palette.divider } } },
};

// --- Create Theme ---
let themeArgon = createTheme({
  palette,
  typography,
  shape,
  spacing,
  shadows,
  components,
});

themeArgon = responsiveFontSizes(themeArgon);

export default themeArgon;
