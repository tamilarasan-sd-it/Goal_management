import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { login } from "../../StoreRedux/actions/AuthActions";
import { useState, useEffect } from "react";

import CircularProgress from "@mui/material/CircularProgress";

import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
} from "@mui/material";

import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import logo from "../../assets/images/pdmr_logo2.png";

import { showNotification } from "../../StoreRedux/constants/actionTypes";

const LoginCard = () => {
    const [empId, setEmpId] = useState("");
const [password, setPassword] = useState("");
const [showPassword, setShowPassword] = useState(false);
const [remember, setRemember] = useState(false);
const [formError, setFormError] = useState("");
const dispatch = useDispatch();
const navigate = useNavigate();

const { status, token, error } = useSelector(
  (state) => state.auth
);
const handleSubmit = (e) => {
  e.preventDefault();

  if (!empId.trim() && !password.trim()) {
    dispatch(
      showNotification({
        type: "error",
        message: "Please enter Employee ID and Password.",
      })
    );
    return;
  }

  if (!empId.trim()) {
    dispatch(
      showNotification({
        type: "error",
        message: "Please enter Employee ID.",
      })
    );
    return;
  }

  if (!password.trim()) {
    dispatch(
      showNotification({
        type: "error",
        message: "Please enter Password.",
      })
    );
    return;
  }

  dispatch(
    login({
      emp_id: empId.trim(),
      emp_pass: password,
    })
  );
};

useEffect(() => {
  if (status === "succeeded" && token) {
    navigate("/");
  }
}, [status, token, navigate]);
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      background: `
radial-gradient(circle at top,
rgba(80,120,255,.18),
transparent 45%),
linear-gradient(180deg,#D6E6FF,#EDF4FF)
`,
       px: {
    xs: 3,
    sm: 4,
    md: 5,
},

py: {
    xs: 4,
    sm: 5,
},
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: {
            
    xs: "92%",
    sm: 700,
    md: 700,
    lg: 700,
},
maxWidth: 500,

          borderRadius: "30px",
         pt: 4,
pb: 4,
px: 5,
       background:
"linear-gradient(180deg,#E3EEFF,#D8E8FF)",
backdropFilter:
"blur(28px)",
WebkitBackdropFilter: "blur(35px)",
       border: "1px solid rgba(120,160,255,.35)",
         boxShadow:
"0 35px 80px rgba(37,99,235,.22)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",

          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: "linear-gradient(90deg,#2563EB,#7C3AED)",
          },
        }}
      >
        {/* Company Logo */}
        <Box
          component="img"
          src={logo}
          alt="PDMR Logo"
          sx={{
          width: 100,
height: 100,
objectFit: "contain",
filter:"drop-shadow(0 8px 16px rgba(37,99,235,.18))",

mb: 2,
          }}
        />

        {/* Heading */}
        <Typography
          sx={{
           fontSize: {
    xs: 28,
    sm: 34,
    md: 40,
},
letterSpacing:"-.5px",
fontWeight:800,
lineHeight:1.1,
            color: "#1E293B",
            mb: 1,
          }}
        >
          Welcome Back
        </Typography>

        {/* Subtitle */}
        <Typography
          sx={{fontSize:16,
fontWeight:400,
color:"#64748B",
letterSpacing:".3px",
            mb: 1,
          }}
        >
          Sign in to continue to
        </Typography>

        {/* Portal Name */}
        <Typography
          sx={{
           fontSize:{
    xs:18,
    sm:20,
    md:22,
},
letterSpacing:".2px",
fontWeight: 700,
            color: "#2563EB",
            mb: 5,
          }}
        >
          Goal Management System
        </Typography>

     <Box
  component="form"
  onSubmit={handleSubmit}
  sx={{ mt: 2 }}
>

  <Typography
    sx={{
      textAlign: "left",
      fontSize:15,
fontWeight:600,
      mb: 1
    }}
  >

    Employee ID
  </Typography>

  <TextField
  
    fullWidth
    placeholder="Enter your Employee ID"
    value={empId}
   onChange={(e) => {
  setEmpId(e.target.value);
  setFormError("");
}}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <PersonOutlineIcon color="primary" />
        </InputAdornment>
      ),
    }}
    sx={{
      mb: 3,
      transition:"all .25s ease",

      "&.Mui-focused":{

transform:"translateY(-2px)",

},

      "& .MuiOutlinedInput-root": {
        borderRadius: "16px",
        height:58,
        background:"#FAFBFF",

        "& fieldset": {
          borderColor: "#D6E2FF",
        },

        "&:hover fieldset": {
          borderColor: "#2563EB",
        },

        "&.Mui-focused fieldset": {
          borderWidth: 2,
        },
      },
    }}
  />

  <Typography
    sx={{
      textAlign: "left",
      fontWeight: 600,
      mb: 1
    }}
  >
    Password
  </Typography>

  <TextField
    fullWidth
    type={showPassword ? "text" : "password"}
    placeholder="Enter your password"
    value={password}
    onChange={(e) => {
  setPassword(e.target.value);
  setFormError("");
}}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <LockOutlinedIcon color="primary" />
        </InputAdornment>
      ),

      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    }}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: "16px",
       height: {
  xs: 52,
  sm: 56,
  md: 58,
},
background:"#FAFBFF",

        "& fieldset": {
          borderColor: "#D6E2FF",
        },

        "&:hover fieldset": {
          borderColor: "#2563EB",
        },

        "&.Mui-focused fieldset": {
          borderColor:"#2563EB",
boxShadow:"0 0 0 4px rgba(37,99,235,.08)",
          borderWidth: 2,
        },
      },
    }}
  />



{/*<Box
  sx={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    mt: 2,
    mb: 4,
  }}
>
  <FormControlLabel
    control={
      <Checkbox
        checked={remember}
        onChange={(e) => setRemember(e.target.checked)}
        size="small"
        sx={{
          color: "#2563EB",
          "&.Mui-checked": {
            color: "#2563EB",
          },
        }}
      />
    }
    
    label={
      <Typography
        sx={{
          fontSize: 14,
          color: "#64748B",
        }}
      >
        Remember Me
      </Typography>
    }
  />

  <Typography
    sx={{
      fontSize: 14,
      fontWeight: 600,
      color: "#2563EB",
      cursor: "pointer",

      "&:hover": {
        textDecoration: "underline",
      },
    }}
  >
    Forgot Password?
  </Typography>
</Box> */}

<Button
  type="submit"
  fullWidth
  variant="contained"
  endIcon={<ArrowForwardIcon />}
  sx={{
    mt:3,
    height:{
    xs:52,
    sm:56,
    md:60,
},
    borderRadius:"18px",
    textTransform:"none",
    fontSize:19,
    fontWeight:700,

    background:
      "linear-gradient(135deg,#2563EB,#4F46E5)",

    boxShadow:
      "0 16px 35px rgba(37,99,235,.35)",

    transition:"all .3s ease",

    "&:hover":{
        background:
        "linear-gradient(135deg,#1D4ED8,#4338CA)",

        transform:"translateY(-3px)",

        boxShadow:
        "0 20px 45px rgba(37,99,235,.45)",
    },

    "&:active":{
        transform:"scale(.98)",
    }
}}
>
 <>
{status==="loading" ? (
<>
<CircularProgress
size={20}
color="inherit"
sx={{mr:2}}
/>
Signing In...
</>
) : (
"Sign In"
)}
</>
</Button>

<Typography
  color="error"
  sx={{
    mt: 2,
    textAlign: "center",
    fontWeight: 600,
    minHeight: 24,
  }}
>
  {formError ||
    (status === "failed" &&
      (error === "Request failed with status code 401"
        ? "Invalid Employee ID or Password."
        : error))}
</Typography>
</Box>
        <Typography
          sx={{
            mt: 5,
            fontSize: 12,
            color: "#94A3B8",
          }}
        >
          © 2026 Perfect Digital Media Resources Pvt. Ltd.
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#2563EB",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Version 2.0
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginCard;