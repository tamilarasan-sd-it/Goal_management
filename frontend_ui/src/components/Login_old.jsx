import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Fade,
  Zoom,
  alpha,
  IconButton,
  InputAdornment,
  Divider
} from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import LoginIcon from "@mui/icons-material/Login";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupsIcon from "@mui/icons-material/Groups";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import VpnKeyIcon from "@mui/icons-material/VpnKey";

import { login, loginByExternalApplicationUser } from "../StoreRedux/actions/AuthActions";

// Import your logo
import logo from "../assets/images/pdmr_logo1.png";

const Login = () => {
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, token } = useSelector((state) => state.auth);

  const params = new URLSearchParams(window.location.search);
  const externalEmpId = atob(params.get('emp_id')); //decoded using base64
  const userbypts = params.get('user');

  useEffect(() => {

    if (externalEmpId && userbypts) {
      dispatch(loginByExternalApplicationUser(externalEmpId));
    } else {
      console.log("No empId found in the URL.");
    }
  }, [dispatch, externalEmpId]);

  useEffect(() => {
    if (status === 'succeeded' && token) {
      navigate('/');
    }
  }, [status, token, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ emp_id: empId, emp_pass: password }));
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
sx={{
height:"100vh",
display:"flex",
background:
"linear-gradient(135deg,#0F172A,#1E3A8A,#2563EB)",
overflow:"hidden"
}}
>

      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[...Array(15)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: Math.random() * 80 + 20,
              height: Math.random() * 80 + 20,
              background: `linear-gradient(135deg, ${alpha('#667eea', Math.random() * 0.1 + 0.05)}, ${alpha('#764ba2', Math.random() * 0.1 + 0.05)})`,
              borderRadius: '20%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
              filter: 'blur(20px)',
              opacity: 0.3,
            }}
          />
        ))}
      </Box>

      {/* Left Side  */}
      <Box
sx={{
flex:1,
display:{xs:"none",lg:"flex"},
justifyContent:"center",
alignItems:"center",
flexDirection:"column",
p:8,
position:"relative",
color:"#fff"
}}
>

<Box
component="img"
src={logo}
alt="PDMR"
sx={{
width:260,
mb:4,
filter:"drop-shadow(0px 20px 40px rgba(0,0,0,.35))"
}}
/>

<Typography
variant="h3"
fontWeight={800}
textAlign="center"
>
Goal Management
</Typography>

<Typography
variant="h6"
sx={{
opacity:.9,
mb:5
}}
>
Employee Performance Portal
</Typography>

<Box
sx={{
display:"flex",
flexDirection:"column",
gap:3,
width:"100%",
maxWidth:420
}}
>

{
[
{
icon:<AssignmentTurnedInIcon/>,
text:"Goal Planning"
},
{
icon:<TrendingUpIcon/>,
text:"Performance Analytics"
},
{
icon:<GroupsIcon/>,
text:"Manager Reviews"
},
{
icon:<CalendarMonthIcon/>,
text:"Monthly Progress"
}
].map((item,index)=>(
<Box
key={index}
sx={{
display:"flex",
alignItems:"center",
gap:2
}}
>

<Box
sx={{
width:45,
height:45,
borderRadius:"50%",
background:"rgba(255,255,255,.15)",
display:"flex",
justifyContent:"center",
alignItems:"center"
}}
>

{item.icon}

</Box>

<Typography
fontWeight={500}
>

{item.text}

</Typography>

</Box>

))
}

</Box>

</Box>

      {/* Right Side */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 4 },
          position: 'relative',
          height: '100vh',
          overflowY: 'auto',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        <Zoom in timeout={1000}>
          <Paper
            elevation={0}
            sx={{
              width: '100%',
              maxWidth: 420,
              p: { xs: 3, sm: 4, md: 5 },
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: `
                0 20px 60px rgba(102, 126, 234, 0.15),
                0 8px 32px rgba(102, 126, 234, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.6)
              `,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #667eea, #764ba2, #667eea)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3s infinite linear',
              },
            }}
          >

            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, transparent 50%, rgba(102, 126, 234, 0.1) 50%)',
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  sx={{
                    width: 70,
                    height: 70,
                    margin: '0 auto 20px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.3)',
                    animation: 'pulse 3s infinite',
                  }}
                >
                  <LockOutlinedIcon sx={{ fontSize: 32, color: '#fff' }} />
                </Box>
                <Typography
                  variant="h5"
                  component="h2"
                  fontWeight="700"
                  sx={{
                    color: '#1a237e',
                    mb: 1,
                  }}
                >
                  Welcome Back
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    opacity: 0.8,
                    fontSize: '0.95rem'
                  }}
                >
                  Sign in to your  dashboard
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Fade in timeout={1200}>
                  <TextField
                    fullWidth
                    required
                    margin="normal"
                    id="empId"
                    label="Employee ID"
                    name="empId"
                    autoComplete="off"
                    autoFocus
                    value={empId}
                    onChange={(e) => setEmpId(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                          '& fieldset': {
                            borderColor: '#667eea',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                        },
                        '&.Mui-focused': {
                          '& fieldset': {
                            borderWidth: 2,
                            borderColor: '#667eea',
                            boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#667eea',
                      },
                      '& .MuiInputLabel-shrink': {
                        zIndex: 2,
                        background: 'rgba(255, 255, 255, 0.95)', // Match paper background to create cut-out effect
                        paddingRight: '5px',
                        paddingLeft: '5px',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <LockOutlinedIcon sx={{ color: '#667eea', fontSize: 18 }} />
                          </Box>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Fade>

                <Fade in timeout={1400}>
                  <TextField
                    fullWidth
                    required
                    margin="normal"
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        '&:hover': {
                          '& fieldset': {
                            borderColor: '#667eea',
                            boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)',
                          },
                        },
                        '&.Mui-focused': {
                          '& fieldset': {
                            borderWidth: 2,
                            borderColor: '#667eea',
                            boxShadow: '0 0 0 4px rgba(102, 126, 234, 0.2)',
                          },
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#667eea',
                      },
                      '& .MuiInputLabel-shrink': {
                        zIndex: 2,
                        background: 'rgba(255, 255, 255, 0.95)', // Match paper background to create cut-out effect
                        paddingRight: '4px',
                        paddingLeft: '4px',
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea20, #764ba220)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <VpnKeyIcon sx={{ color: '#667eea', fontSize: 18 }} />
                          </Box>
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                            size="small"
                            sx={{
                              color: '#667eea',
                              '&:hover': {
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                              },
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Fade>

                <Fade in timeout={1600}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={status === 'loading'}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      fontSize: '1rem',
                      fontWeight: '600',
                      letterSpacing: '0.5px',
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        transition: 'left 0.7s',
                      },
                      '&:hover::before': {
                        left: '100%',
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(102, 126, 234, 0.6)',
                      },
                      '&:active': {
                        transform: 'translateY(0)',
                      },
                      '&.Mui-disabled': {
                        background: '#e0e0e0',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    {status === 'loading' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: 'rgba(255,255,255,0.3)',
                            borderTopColor: '#fff',
                            animation: 'spin 1s linear infinite',
                          }}
                        />
                        Authenticating...
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                        <LoginIcon sx={{ fontSize: 20 }} />
                        Login
                      </Box>
                    )}
                  </Button>
                </Fade>

                {status === 'failed' && (
                  <Fade in timeout={500}>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(244, 67, 54, 0.05))',
                        borderLeft: '4px solid #f44336',
                        animation: 'shake 0.5s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: 'rgba(244, 67, 54, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <LockOutlinedIcon sx={{ color: '#f44336', fontSize: 14 }} />
                      </Box>
                      <Typography color="error" variant="body2" sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        {error}
                      </Typography>
                    </Box>
                  </Fade>
                )}
              </Box>
              <Fade in timeout={1800}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 4, opacity: 0.7, fontSize: '0.8rem' }}
                >
                  Developed by Web Team
                </Typography>
              </Fade>
            </Box>
          </Paper>
        </Zoom>
      </Box>
    </Box>
  );
};

export default Login;