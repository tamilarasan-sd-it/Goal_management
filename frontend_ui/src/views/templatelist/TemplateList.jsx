import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import {
  Typography,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Skeleton,
  Tooltip,
  Chip,
  alpha,
  Grid,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/common.css';

import PageContainer from "../../components/Common/PageContainer";
import AppCard from "../../components/Common/AppCard";
import AppButton from "../../components/Common/AppButton";
import AppHeader from "../../components/Common/AppHeader";
import AppTable from "../../components/Common/AppTable";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import StatCard from "../../components/Common/StatCard";

import {
  FileText,
  Users,
  CheckCircle2
} from "lucide-react";

import targetSvg from "../../assets/images/target.svg";
import clipboardSvg from "../../assets/images/clipboard.svg";
import plantSvg from "../../assets/images/plant.svg";

const SLATE = '#B7BEDD';
const LINE = 'rgba(255,255,255,.08)';

const getTemplateListData = createSelector(
  state => state?.dataService?.pages?.templatelist,
  (templatelistPage) => ({
    loading: templatelistPage?.loading?.TemplateListDataLoad || false,
    templatelist: templatelistPage?.data?.TemplateListDataList || [],
    error: templatelistPage?.error,
  })
);

const TemplateList = () => {
  const dispatch = useDispatch();
  const { loading, templatelist, error } = useSelector(getTemplateListData);
  const { user } = useSelector(state => state?.auth || {});
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (!user?.id) return;
    const payload = { user_id: user.id };
    dispatch(setLoading("templatelist", "TemplateListDataLoad", true));
    dispatch(fetchByIdAction(
      'application/json',
      "templatelist",
      "TemplateListDataList",
      "TemplateListDataLoad",
      payload
    ));
  }, [dispatch, user?.id]);

  const rows = Array.isArray(templatelist)
    ? templatelist
        .filter((item) =>
          item.template_name?.toLowerCase().includes(search.toLowerCase())
        )
        .map((item, index) => ({
          ...item,
          id: item.template_pid || index,
        }))
    : [];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: `
          radial-gradient(circle at 10% 10%, rgba(255,105,180,.26) 0, transparent 22%),
          radial-gradient(circle at 88% 18%, rgba(59,130,246,.28) 0, transparent 20%),
          radial-gradient(circle at 80% 88%, rgba(245,158,11,.18) 0, transparent 18%),
          linear-gradient(135deg, #0A0F2D 0%, #110B3A 35%, #0C1740 70%, #0A0C24 100%)
        `,
        py: 2,
        px: { xs: 1.5, md: 2.5 },
      }}
    >
      <PageContainer sx={{ maxWidth: "100%", py: 0 }}>
        <AppCard
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: "30px",
            background: `
              radial-gradient(circle at 15% 20%, rgba(255,120,180,.18) 0, transparent 24%),
              radial-gradient(circle at 90% 15%, rgba(59,130,246,.22) 0, transparent 22%),
              radial-gradient(circle at 88% 82%, rgba(251,146,60,.18) 0, transparent 18%),
              linear-gradient(135deg, rgba(21,18,62,.96), rgba(12,24,76,.92))
            `,
            border: "1px solid rgba(255,255,255,.08)",
            boxShadow: "0 25px 70px rgba(0,0,0,.40)",
            color: "#fff",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: `
                radial-gradient(circle at 24% 18%, rgba(255,255,255,.08) 0, transparent 10%),
                radial-gradient(circle at 70% 26%, rgba(255,255,255,.06) 0, transparent 8%),
                radial-gradient(circle at 86% 70%, rgba(255,255,255,.07) 0, transparent 10%)
              `,
            }}
          />

          <Grid container spacing={3} sx={{ position: "relative", zIndex: 1 }}>
            <Grid item xs={12} lg={7}>
              <AppHeader
                title="Template Management"
                titleColor="#ffffff"
                subtitleColor="#D7DBFF"
                subtitle="Manage all goal templates in one place with a modern dashboard."
              />

              <Box
                sx={{
                  mt: 2,
                  width: 110,
                  height: 6,
                  borderRadius: 10,
                  background: "linear-gradient(90deg,#F472B6,#8B5CF6,#38BDF8)",
                  boxShadow: "0 0 20px rgba(139,92,246,.45)",
                }}
              />

              <Grid container spacing={2.2} sx={{ mt: 1.5 }}>
                <Grid item xs={12} md={4}>
                  <StatCard
                    title="Templates"
                    value={rows.length}
                    subtitle="Total Templates"
                    icon={<FileText />}
                    color="#EC4899"
                    sx={{
                      background: "linear-gradient(135deg, rgba(244,63,94,.55), rgba(236,72,153,.35))",
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <StatCard
                    title="Owners"
                    value={rows.reduce((a, b) => a + (b.total_assignments || 0), 0)}
                    subtitle="Total Owners"
                    icon={<Users />}
                    color="#3B82F6"
                    sx={{
                      background: "linear-gradient(135deg, rgba(37,99,235,.55), rgba(124,58,237,.34))",
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <StatCard
                    title="Active"
                    value={rows.length}
                    subtitle="Active Templates"
                    icon={<CheckCircle2 />}
                    color="#F59E0B"
                    sx={{
                      background: "linear-gradient(135deg, rgba(249,115,22,.52), rgba(251,146,60,.32))",
                    }}
                  />
                </Grid>
              </Grid>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 2,
                  mt: 3,
                  flexWrap: "wrap",
                }}
              >
                <TextField
                  placeholder="Search template name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  sx={{
                    minWidth: { xs: "100%", md: 360 },
                    flex: 1,
                    "& .MuiOutlinedInput-root": {
                      height: 54,
                      borderRadius: "18px",
                      background: "rgba(0,0,0,.22)",
                      backdropFilter: "blur(14px)",
                      border: "1px solid rgba(255,255,255,.10)",
                      color: "#fff",
                      "& fieldset": { border: "none" },
                      "&:hover": {
                        boxShadow: "0 10px 26px rgba(124,58,237,.15)",
                      },
                    },
                    "& input": { color: "#fff" },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: "#fff" }} />
                      </InputAdornment>
                    )
                  }}
                />

                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                  <AppButton
                    startIcon={<RefreshIcon />}
                    onClick={() => window.location.reload()}
                    sx={{
                      background: "linear-gradient(135deg,#7C3AED,#2563EB)",
                      boxShadow: "0 0 35px rgba(124,58,237,.45)",
                    }}
                  >
                    Refresh
                  </AppButton>

                  <AppButton
                    startIcon={<ArrowBackIcon />}
                    onClick={() => window.history.back()}
                    sx={{
                      background: "linear-gradient(135deg,#334155,#1F2937)",
                      boxShadow: "0 0 28px rgba(59,130,246,.22)",
                    }}
                  >
                    Back
                  </AppButton>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} lg={5}>
              <Box
                sx={{
                  position: "relative",
                  width: "100%",
                  height: { xs: 320, md: 340 },
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  overflow: "hidden",
                  borderRadius: "28px",
                  background: "linear-gradient(135deg, rgba(22,28,70,.85), rgba(10,20,58,.75))",
                  border: "1px solid rgba(255,255,255,.08)",
                }}
              >
               <Box
  sx={{
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,.15)",
    top: 15,
    left: 10,
    zIndex: 1,
  }}
/>
                <Box
                  sx={{
                    position: "absolute",
                  
                    borderRadius: "50%",
                    background: "#4DA6FF",
                    top: 40,
                    left: 35,
                    boxShadow: "0 0 25px #4DA6FF",
                    zIndex: 5,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "#FF7A59",
                    top: 20,
                    right: 40,
                    boxShadow: "0 0 30px #FF7A59",
                    zIndex: 5,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#FFAE42",
                    left: 25,
                    bottom: 80,
                    boxShadow: "0 0 25px #FFAE42",
                    zIndex: 5,
                  }}
                />
                {/* Blue Glow */}
<Box
  sx={{
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: "50%",
    background: "#4DA8FF",
    top: 70,
    left: 35,
    boxShadow: "0 0 25px #4DA8FF",
    zIndex: 2,
  }}
/>

{/* Orange Glow */}
<Box
  sx={{
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "#FFB347",
    bottom: 80,
    left: 50,
    boxShadow: "0 0 20px #FFB347",
    zIndex: 2,
  }}
/>

{/* Purple Glow */}
<Box
  sx={{
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: "#B96CFF",
    top: 180,
    left: 90,
    boxShadow: "0 0 18px #B96CFF",
    zIndex: 2,
  }}
/>
<Box
  sx={{
    position: "absolute",
    left: "-120px",
    top: "40px",
    width: "380px",
    height: "380px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(255,90,180,.28), transparent 75%)",
    filter: "blur(90px)",
    zIndex: 0,
  }}
/>
<Box
  sx={{
    position: "absolute",
    right: "120px",
    top: "80px",
    width: "250px",
    height: "250px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(0,170,255,.18), transparent 75%)",
    filter: "blur(80px)",
    zIndex: 0,
  }}
/>

                <img
  src={targetSvg}
  width="620"
  style={{ }}
/>

                <Box
                  component="img"
                  src={clipboardSvg}
                  alt="Clipboard"
                  sx={{
                    position: "absolute",
                    width: "270px",
                    right: "-31px",
                    top: "50px",
                    zIndex: 3,
                    transform: "rotate(10deg)",
                  }}
                />

                <Box
                  component="img"
                  src={plantSvg}
                  alt="Plant"
                  sx={{
                    position: "absolute",
                   width: "230px",
  height: "150px",
                    right: "1px",
                    bottom: "15px",
                    
                    zIndex: 4,
                    display: "block",
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </AppCard>

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            Failed to load templates: {error.message || 'Unknown error'}
          </Alert>
        )}

        <AppCard
          sx={{
            mt: 2,
            p: 2,
            borderRadius: "26px",
            background: "rgba(8,12,34,.75)",
            border: "1px solid rgba(255,255,255,.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,.35)",
            backdropFilter: "blur(18px)",
          }}
        >
          {loading || rows.length > 0 ? (
            <TableContainer
              sx={{
                borderRadius: "20px",
                overflow: "hidden",
                background: "transparent",
                maxHeight: "calc(100vh - 280px)",
                "&::-webkit-scrollbar": {
                  width: "8px",
                  height: "8px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: alpha('#8B5CF6', 0.35),
                  borderRadius: "4px",
                },
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow
                    sx={{
                      '& .MuiTableCell-root': {
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        letterSpacing: ".04em",
                        border: 'none',
                        padding: '14px 16px',
                        whiteSpace: 'nowrap',
                      },
                    }}
                  >
                    <TableCell sx={{ minWidth: '80px', background: "linear-gradient(90deg,#7C3AED,#A855F7)" }}>S.NO</TableCell>
                    <TableCell sx={{ minWidth: '280px', background: "linear-gradient(90deg,#2563EB,#4F46E5)" }}>TEMPLATE NAME</TableCell>
                    <TableCell sx={{ minWidth: '160px', background: "linear-gradient(90deg,#1D4ED8,#9333EA)" }}>OWNER COUNT</TableCell>
                    <TableCell sx={{ minWidth: '120px', textAlign: 'center', background: "linear-gradient(90deg,#9333EA,#EC4899)" }}>ACTIONS</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index}>
                        {Array.from({ length: 4 }).map((_, i) => (
                          <TableCell key={i} sx={{ padding: '12px 16px', borderColor: "rgba(255,255,255,.06)" }}>
                            <Skeleton height={20} sx={{ borderRadius: '8px' }} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    rows
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((row, index) => (
                        <TableRow
                          key={row.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '& td': {
                              padding: '12px 16px',
                              borderBottom: `1px solid ${LINE}`,
                              fontSize: '0.875rem',
                              color: "#F3F4FF",
                            },
                            background: index % 2 === 0 ? "rgba(255,255,255,.02)" : "rgba(255,255,255,.04)",
                            transition: "all .25s ease",
                            "&:hover": {
                              background: "rgba(124,58,237,.12)",
                              transform: "translateY(-1px)",
                            }
                          }}
                        >
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: "#fff" }}>
                              {row.template_name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${row.total_assignments ?? 0} Owners`}
                              size="small"
                              sx={{
                                background: "linear-gradient(135deg, rgba(22,163,74,.35), rgba(34,197,94,.22))",
                                border: "1px solid rgba(134,239,172,.22)",
                                color: "#EAFBF0",
                                fontWeight: 700,
                                height: '26px',
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                onClick={() => navigate(`/goallist-views/${row.template_pid}`)}
                                size="small"
                                sx={{
                                  width: 36,
                                  height: 36,
                                  background: "linear-gradient(135deg,#F59E0B,#F97316)",
                                  color: "#fff",
                                  boxShadow: "0 0 18px rgba(249,115,22,.35)",
                                  transition: "all .25s ease",
                                  "&:hover": {
                                    transform: "scale(1.12) rotate(8deg)",
                                    background: "linear-gradient(135deg,#FB923C,#F59E0B)",
                                  }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 5, textAlign: "center" }}>
              <Typography variant="h6" fontWeight="700" sx={{ color: "#fff" }} gutterBottom>
                No Templates Found
              </Typography>
              <Typography variant="body1" sx={{ color: SLATE, maxWidth: 400, mx: 'auto' }}>
                There are no goal templates available for creation at the moment.
              </Typography>
            </Box>
          )}

          <TablePagination
            sx={{
              color: "#fff",
              background: "transparent",
              borderTop: "1px solid rgba(255,255,255,.06)",
              "& .MuiTablePagination-toolbar": {
                minHeight: 65
              },
              "& .MuiIconButton-root": {
                color: "#C4B5FD",
              },
              "& .MuiIconButton-root:hover": {
                background: "rgba(124,58,237,.12)"
              }
            }}
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </AppCard>
      </PageContainer>
    </Box>
  );
};

export default TemplateList;