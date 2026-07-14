import { Paper, Typography, Box } from "@mui/material";

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "#2563EB",
}) {
  return (
    <Paper
      className="app-slide-up app-icon-float"
      sx={{
        p: 4,
        borderRadius: "24px",
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
animation:
"app-slide-up .6s ease",
       background:
"rgba(255,255,255,.12)",
backdropFilter:"blur(18px)",

WebkitBackdropFilter:"blur(18px)",

        border:"1px solid rgba(255,255,255,.22)",

        boxShadow:
`0 20px 45px ${color}30`,

        transition: "all .35s ease",

        "&:hover": {
          transform:
"translateY(-12px) scale(1.03)",
          boxShadow: `0 28px 55px ${color}35`,
        },

        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          width: 7,
          height: "100%",
          background: `linear-gradient(180deg,${color},${color}80)`,
        },

        "&::after": {
          content: '""',
          position: "absolute",
          width: 180,
          height: 180,
          right: -80,
          top: -80,
          borderRadius: "50%",
          background: `${color}12`,
        },
        "&::before":{
content:'""',
position:"absolute",
width:220,
height:220,
left:-100,
bottom:-100,
borderRadius:"50%",
background:`${color}18`,
filter:"blur(45px)"
},
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color:"#FFFFFF",
              textTransform: "uppercase",
              letterSpacing: ".08em",
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontSize: 48,
              fontWeight: 900,
background:
`linear-gradient(135deg,#FFFFFF,${color})`,

              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",

              lineHeight: 1,
            }}
          >
            {value}
          </Typography>

          {subtitle && (
            <Typography
              sx={{
                mt: 1,
                fontSize: 13,
                color: "#CBD5E1",
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>

        {icon && (
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: "22px",
animation:"float 3s ease-in-out infinite",
             background:
`linear-gradient(
135deg,
${color},
#ffffff30
)`,
color:"#fff",

              backdropFilter: "blur(15px)",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",
boxShadow:
`0 0 35px ${color}60`,

              transition: ".35s",

              "& svg": {
                width: 34,
                height: 34,
              },

              "&:hover": {
                transform: "rotate(10deg) scale(1.1)",
              },
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Paper>
  );
}