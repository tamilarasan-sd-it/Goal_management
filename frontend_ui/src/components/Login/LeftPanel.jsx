import { Box, Typography, Divider } from "@mui/material";

import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

import logo from "../../assets/images/pdmr_logo.png";
import dashboard from "../../assets/images/dashboard.svg";

const features = [
  {
    icon: <TrackChangesIcon />,
    title: "Goal Planning",
    desc: "Define and organize your goals",
  },
  {
    icon: <TrendingUpIcon />,
    title: "Performance Tracking",
    desc: "Monitor progress in real-time",
  },
  {
    icon: <GroupsIcon />,
    title: "Monthly Reviews",
    desc: "Evaluate and improve continuously",
  },
  {
    icon: <CalendarMonthIcon />,
    title: "Team Collaboration",
    desc: "Work together and achieve more",
  },
];

const LeftPanel = () => {
  return (
    <Box
      sx={{
        flex: 1.15,
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        justifyContent: "center",
        px: 8,
        pt: 6,
        pb: 6,
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Glow */}

      <Box
        sx={{
          position: "absolute",
          right: 140,
          bottom: 120,
          width: 320,
          height: 380,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(97,218,251,.35), transparent 70%)",
          filter: "blur(70px)",
          zIndex: 0,
        }}
      />

      {/* Decorative Circle */}

      <Box
        sx={{
          position: "absolute",
          right: 120,
          top: 100,
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: "2px solid rgba(255,255,255,.08)",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          right: 420,
          top: 220,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#61DAFB",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          right: 300,
          top: 180,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "#00E5FF",
        }}
      />

      {/* Logo */}

      <Box
  sx={{
    display: "flex",
    justifyContent: "center",
    mt: -2.5,
    mb: 3.5,
    zIndex: 2,
  }}
>
  <Box
    component="img"
    src={logo}
    alt="PDMR"
    sx={{
      width: 500,
    }}
  />
</Box>

      {/* Heading */}

     <Typography
  sx={{
    fontSize: 50,
    fontWeight: 800,
    lineHeight: 1,
    zIndex: 2,
    color: "#FFFFFF",   // <-- Add this
    textShadow: "0 2px 10px rgba(0,0,0,0.25)", // Optional: makes it look premium
  }}
>
  Goal
</Typography>

      <Typography
        sx={{
          fontSize: 58,
          fontWeight: 800,
          color: "#67E8F9",
          lineHeight: 1,
          mb: 2,
          zIndex: 2,
        }}
      >
        Management System
      </Typography>

      <Typography
        sx={{
          color: "#fff",
          fontSize: 22,
          mb: 2,
          zIndex: 2,
        }}
      >
        Plan • Track • Review • Achieve
      </Typography>

      {/* Features */}

      <Box sx={{ width: 480, zIndex: 2 }}>
        {features.map((item, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 55,
                  height: 55,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,.12)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {item.icon}
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: 24,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {item.title}
                </Typography>

                <Typography
                  sx={{
                    color: "rgba(255,255,255,.75)",
                  }}
                >
                  {item.desc}
                </Typography>
              </Box>
            </Box>

            <Divider
              sx={{
                mt: 1,
                borderColor: "rgba(255,255,255,.12)",
              }}
            />
          </Box>
        ))}
      </Box>

      <Box
  sx={{
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -40,
    height: 180,
    background:
      "radial-gradient(circle at 20% 0%, rgba(59,130,246,.45), transparent 55%),\
       radial-gradient(circle at 60% 0%, rgba(37,99,235,.55), transparent 60%),\
       radial-gradient(circle at 100% 0%, rgba(29,78,216,.5), transparent 60%)",
    borderTopLeftRadius: "50%",
    borderTopRightRadius: "50%",
    zIndex: 0,
  }}
/>

      {/* Dashboard Illustration */}

      <Box
        sx={{
          position: "absolute",
          right: -10,
          bottom: 100,
          width: 460,
          animation: "float 6s ease-in-out infinite",
          zIndex: 1,

          "@keyframes float": {
            "0%,100%": {
              transform: "translateY(0px)",
            },
            "50%": {
              transform: "translateY(-15px)",
            },
          },
        }}
      >
        <Box
          component="img"
          src={dashboard}
          alt="Dashboard"
          sx={{
            width: "100%",
            filter: "drop-shadow(0 25px 40px rgba(0,0,0,.35))",
          }}
        />
      </Box>
    </Box>
  );
};

export default LeftPanel;
