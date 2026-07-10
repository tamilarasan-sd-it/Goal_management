import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const warmPalette = {
  mode: "light",
  primary: { main: "#c97b63", light: "#e4b09a", dark: "#8e4a39", contrastText: "#fff" },
  secondary: { main: "#d9b382", light: "#f1d7b6", dark: "#a27f57", contrastText: "#fff" },
  background: { default: "#faf6f2", paper: "#fff" },
  text: { primary: "#3d2f27", secondary: "#6a5b52", disabled: "rgba(0,0,0,0.38)" },
  divider: "#e7dcd3",
};

let warmTheme = createTheme({ palette: warmPalette });
warmTheme = responsiveFontSizes(warmTheme);

export default warmTheme;
