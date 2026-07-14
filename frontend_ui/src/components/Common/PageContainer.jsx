import { Box } from "@mui/material";

export default function PageContainer({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 4,
       background: `
linear-gradient(
135deg,
#0F172A 0%,
#111827 40%,
#1E1B4B 100%
),
radial-gradient(circle at top right,#7C3AED33,transparent 45%),
radial-gradient(circle at bottom left,#2563EB33,transparent 40%)
`,
      }}
    >
      {children}
    </Box>
  );
}