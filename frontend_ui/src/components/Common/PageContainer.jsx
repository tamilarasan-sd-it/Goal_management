import { Box } from "@mui/material";

export default function PageContainer({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 3,
        background: `
          radial-gradient(circle at top,
          rgba(37,99,235,.12),
          transparent 40%),
          linear-gradient(
          180deg,
          #EEF5FF,
          #F9FBFF)
        `,
      }}
    >
      {children}
    </Box>
  );
}