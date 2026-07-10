import { createTheme, responsiveFontSizes } from "@mui/material/styles";

const pastelPalette = {
  mode: "light",
  primary: { main: "#a3c4f3", light: "#d2e3fb", dark: "#7397c3", contrastText: "#fff" },
  secondary: { main: "#f6c1c1", light: "#fbe2e2", dark: "#c08e8e", contrastText: "#fff" },
  background: { default: "#fdfdfd", paper: "#fff" },
  text: { primary: "#333", secondary: "#666", disabled: "rgba(0,0,0,0.38)" },
  divider: "#ececec",
};

let pastelTheme = createTheme({ palette: pastelPalette });
pastelTheme = responsiveFontSizes(pastelTheme);

export default pastelTheme;
