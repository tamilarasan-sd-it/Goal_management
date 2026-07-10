import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const neutralPalette = {
  mode: "light",
  primary: { main: "#6d9773", light: "#a6c3a9", dark: "#4c6b50", contrastText: "#fff" },
  secondary: { main: "#b0a990", light: "#d6d1c4", dark: "#7e7861", contrastText: "#fff" },
  background: { default: "#f5f5f2", paper: "#fff" },
  text: { primary: "#2d2d2d", secondary: "#6e6e6e", disabled: "rgba(0,0,0,0.38)" },
  divider: "#e3e3e3",
};

let neutralTheme = createTheme({ palette: neutralPalette });
neutralTheme = responsiveFontSizes(neutralTheme);

export default neutralTheme;
