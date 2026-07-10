import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

export default function AppTable({ children }) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
      }}
    >
     

      {children}
    </Paper>
  );
}