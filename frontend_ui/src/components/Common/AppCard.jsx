import { Paper } from "@mui/material";

export default function AppCard({ children, sx = {} }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 6,
        background: "#f0dddd",
        boxShadow: "0 15px 35px rgba(37,99,235,.12)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}