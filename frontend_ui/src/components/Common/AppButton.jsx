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
"linear-gradient(135deg,#7C3AED,#2563EB)",

        boxShadow:
          "0 12px 30px rgba(37,99,235,.30)",

        transition: ".3s",

        "&:hover": {
          transform: "translateY(-3px)",
          background:
            "linear-gradient(135deg,#9333EA,#4338CA)",

          boxShadow:
            "0 18px 45px rgba(124,58,237,.45)",
        },

        ...sx,
      }}
    >
      {children}
    </Button>
  );
}