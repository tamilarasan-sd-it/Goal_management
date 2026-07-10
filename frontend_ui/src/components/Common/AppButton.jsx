import Button from "@mui/material/Button";

export default function AppButton({
  children,
  sx = {},
  startIcon,
  endIcon,
  ...props
}) {
  return (
    <Button
      variant="contained"
      startIcon={startIcon}
      endIcon={endIcon}
      {...props}
      sx={{
        borderRadius: "16px",
        height: 52,
        px: 4,
        fontWeight: 700,
        fontSize: 16,
        textTransform: "none",

        background:
          "linear-gradient(135deg,#2563EB,#4F46E5)",

        boxShadow:
          "0 12px 30px rgba(37,99,235,.30)",

        transition: ".3s",

        "&:hover": {
          transform: "translateY(-3px)",
          background:
            "linear-gradient(135deg,#1D4ED8,#4338CA)",

          boxShadow:
            "0 18px 40px rgba(37,99,235,.40)",
        },

        ...sx,
      }}
    >
      {children}
    </Button>
  );
}