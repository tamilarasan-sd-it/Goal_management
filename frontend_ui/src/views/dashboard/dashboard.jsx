import React, { useEffect } from 'react';
import {
  Fade, Container, Typography, Grid, Card, CardActionArea,
  CardContent, Box, Skeleton, Chip, Paper, Avatar, alpha,
  LinearProgress, useTheme, useMediaQuery, Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton, Button,
} from '@mui/material';

import {
  FolderPlus, FilePlus, FileText, Files, UserCheck, CheckCircle,
  XCircle, Clock, Edit3, Send, Users, Layers, FileCheck, TrendingUp,
  ChevronRight, Star, Target, BarChart3, PieChart, Activity,
  Zap, Shield, Globe, Rocket, TrendingDown, AlertCircle
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import AccessTimeIcon from "@mui/icons-material/AccessTime";





const getDashboardData = createSelector(
  state => state?.dataService?.pages,
  (pages) => {
    const dashboardPage = pages?.dashboard || {};
    const dashboardRawData = dashboardPage?.data || {};
    const ReviewerDashboardCountLoad = dashboardPage?.data?.ReviewerDashboardCountLoad || false;
    const ReviewerDashboardCountData = dashboardPage?.data?.ReviewerDashboardCountData || [];
    return {
      dashboard: dashboardRawData,
      loading: dashboardPage?.loading?.DashboardLoad,
      ReviewerDashboardCountLoad: ReviewerDashboardCountLoad,
      ReviewerDashboardCountData: ReviewerDashboardCountData
    };
  }
);

const Dashboard = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const { dashboard, loading, ReviewerDashboardCountLoad, ReviewerDashboardCountData} = useSelector(getDashboardData);
  const { user } = useSelector((state) => state.auth);
  const dashboardCount = dashboard?.DashboardData

  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString() : "-";

  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned":
        return "info";
      case "In_Progress":
        return "primary";
      case "Submitted":
        return "warning";
      case "Under_Review":
        return "secondary";
      case "Approved":
        return "success";
      case "Need_More_Information_Reviewer":
        return "error";
      default:
        return "default";
    }
  };



  console.log(user?.id, "user?.id")
  const isAdmin = user?.id == 12345;
  console.log(isAdmin, "isAdmin")
  // useEffect(() => {
  //   if (user?.id) {
  //     dispatch(setLoading("dashboard", "dashboardLoad", true));
  //     dispatch(fetchAction('application/json', 'dashboard', 'DashboardData', 'dashboardLoad'));
  //   }
  // }, [dispatch, user?.id]);

  useEffect(() => {
    dispatch(setLoading("dashboard", "DashboardLoad", true));
    dispatch(fetchByIdAction('application/json', "dashboard", "DashboardData", "DashboardLoad", user?.id));


    if (user?.id != 12345) {
      dispatch(setLoading("dashboard", "ReviewerDashboardCountLoad", true));
      dispatch(fetchByIdAction('application/json', "dashboard", "ReviewerDashboardCountData", "ReviewerDashboardCountLoad", user?.id));
    }
  }, [dispatch]);

  const CompactStatCard = ({ title, value, icon, color, to }) => {
    const hexColor = theme.palette[color]?.main || theme.palette.primary.main;
    return (
      <Box sx={{
        flex: '1 1 auto',
        minWidth: { xs: '100%', sm: 280 },
        width: {
          xs: '100%',
          sm: `calc(50% - ${theme.spacing(1.5)})`,
          md: `calc(33.333% - ${theme.spacing(2)})`
        },
        display: 'flex',
      }}>
        <Paper
          component={to ? RouterLink : 'div'}
          to={to}
          variant="outlined"
          sx={{
            p: 2,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            borderRadius: 3,
            width: '100%',
            bgcolor: alpha(hexColor, 0.08),
            borderColor: alpha(hexColor, 0.3),
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            '&:hover': {
              boxShadow: theme.shadows[3],
              borderColor: hexColor,
              ...(to && { cursor: 'pointer' })
            }
          }}
        >
          <Avatar sx={{ color: hexColor, bgcolor: alpha(hexColor, 0.1) }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
              {title}
            </Typography>
            {loading ? (
              <Skeleton width={50} height={28} />
            ) : (
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {value}
              </Typography>
            )}
          </Box>
        </Paper>
      </Box>
    );
  };


  const StatCard = ({ title, value, icon, color, to, subtitle, trend = 'up' }) => {
    const hexColor = theme.palette[color]?.main || color || theme.palette.primary.main;

    return (
      <Box sx={{
        flex: '1 1 auto',
        width: {
          xs: '100%',
          sm: `calc(50% - ${theme.spacing(1.5)})`,
          md: `calc(33.333% - ${theme.spacing(2)})`,
          lg: `calc(25% - ${theme.spacing(2.25)})`
        }
      }}>
        <Paper
          component={to ? RouterLink : 'div'}
          to={to}
          variant="outlined"
          sx={{
            textDecoration: 'none',
            height: '100%',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            borderColor: theme.palette.divider,
            borderRadius: 3,
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            '&:hover': {
              boxShadow: theme.shadows[4],
              borderColor: 'primary.main',
              ...(to && { cursor: 'pointer' })
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ color: hexColor, mr: 2, bgcolor: 'transparent', border: `1px solid ${hexColor}` }}>
              {icon}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          </Box>

          {loading ? (
            <Skeleton width="60%" height={40} />
          ) : (
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {value}
            </Typography>
          )}

          {subtitle && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
              {trend === 'up' ? (
                <TrendingUp size={16} color={theme.palette.success.main} />
              ) : (
                <TrendingDown size={16} color={theme.palette.error.main} />
              )}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: 'text.secondary',
                }}
              >
                {subtitle}
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    );
  };

  // Animated Status Indicator
  const StatusIndicator = ({ icon, label, count, color, percentage, to, delay = 0 }) => {
    const hexColor = theme.palette[color]?.main || color || theme.palette.primary.main;
    const statusIndicatorWidths = {
      xs: `calc(50% - ${theme.spacing(1)})`,
      sm: `calc(33.333% - ${theme.spacing(1.33)})`,
      md: `calc(20% - ${theme.spacing(1.6)})`,
    };

    const flexBasis = `calc(20% - ${theme.spacing(1.6)})`;

    return (
      <Grid item xs={6} sm={4} md={2.4}>
        <Paper
          component={to ? RouterLink : 'div'}
          to={to}
          variant="outlined"
          sx={{
            textDecoration: 'none',
            p: 1.5,
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
            '&:hover': {
              boxShadow: theme.shadows[3],
              borderColor: hexColor,
              ...(to && { cursor: 'pointer' })
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: 'transparent',
                  color: hexColor,
                }}
              >
                {icon}
              </Avatar>
              <Box>
                <Typography variant="caption" sx={{ color: alpha(theme.palette.text.primary, 0.7), fontWeight: 600, display: 'block' }}>
                  {label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {count || 0}
                </Typography>
              </Box>
            </Box>

            {percentage !== undefined && (
              <Box sx={{ textAlign: 'right' }}>
                <Chip
                  label={`${percentage}%`}
                  size="small"
                  sx={{
                    bgcolor: 'transparent',
                    color: theme.palette.getContrastText(hexColor),
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: 24,
                  }}
                />
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    mt: 1,
                    width: 60,
                    height: 4,
                    borderRadius: 3,
                    bgcolor: alpha(hexColor, 0.2),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: hexColor,
                      borderRadius: 3,
                    }
                  }}
                />
              </Box>
            )}
          </Box>
        </Paper>
      </Grid>
    );
  };

  // Modern Welcome Header
  const WelcomeHeader = () => (
    <Box sx={{
      mb: 6,
      p: { xs: 3, md: 4 },
      borderBottom: `1px solid ${theme.palette.divider}`,
      borderRadius: 0,
    }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                mb: 1,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                color: 'text.primary'
              }}
            >
              Welcome back, {user?.emp_name || 'User'}!
            </Typography>
            <Typography sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              fontSize: { xs: '0.9rem', md: '1rem' }
            }}>
              {isAdmin
                ? "Track your platform's performance with real-time analytics"
                : "Manage your templates and review requests efficiently"
              }
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* <Chip 
              icon={<Zap size={16} />}
              label={isAdmin ? "Admin Panel" : "User Dashboard"}
              sx={{ 
                fontWeight: 600,
              }}
              variant="outlined"
            /> */}
            {/* <Chip 
              icon={<Activity size={14} />}
              label="Live"
              size="small"
              sx={{ 
                fontWeight: 700,
              }}
              color="success"
            /> */}
          </Box>
        </Box>

        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Globe size={16} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last updated: Just now
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Shield size={16} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              All systems operational
            </Typography>
          </Box> */}
        {/* </Box> */}
      </Box>
    </Box>
  );

  const AdminView = () => {
    const totalTemplates = dashboard?.all_assigned_data?.counts?.total || 0;

    return (
      <>
        <Box sx={{ px: { xs: 3, md: 4 } }}> {/* Wrapper Box for consistent horizontal padding */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
            <CompactStatCard
              title="Template Management"
              // value={dashboardCount[0]?.total_templates}
              to="/template-details"
              icon={<Target size={24} />}
              color="primary"
            />
            <CompactStatCard
              title="Goal Management"
              // value={dashboardCount[0]?.total_goals}
              to="/view-goals"
              icon={<FilePlus size={24} />}
              color="info"
            />
            <CompactStatCard
              title="Goal Settings"
              // value={dashboardCount[0]?.active_assignments}
              to="/goal-settings"
              icon={<FolderPlus size={24} />}
              color="success"
            />
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
                <Avatar sx={{ color: 'primary.main', mr: 2, bgcolor: 'transparent', border: `1px solid ${theme.palette.primary.main}` }}>
                  <Layers size={24} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Total Assignments
                  </Typography>
                  {loading ? (
                    <Skeleton width="60%" height={40} />
                  ) : (
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      {dashboardCount[0]?.active_assignments}
                    </Typography>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <StatusIndicator to={`/goal-views?status=Assigned`} icon={<FilePlus size={20} />} label="Assigned" count={dashboardCount[0]?.assigned_count} color="info" />
                <StatusIndicator to={`/goal-views?status=Goals_Pending`} icon={<Target size={20} />} label="Goals Pending" count={dashboardCount[0]?.goals_pending_count} color="secondary" />
                <StatusIndicator to={`/goal-views?status=In_Progress`} icon={<Activity size={20} />} label="In Progress" count={dashboardCount[0]?.in_progress_count} color="primary" />
                <StatusIndicator to={`/goal-views?status=Submitted`} icon={<Send size={20} />} label="Submitted" count={dashboardCount[0]?.submitted_count} color="warning" />
                <StatusIndicator to={`/goal-views?status=Under_Review`} icon={<UserCheck size={20} />} label="Under Review" count={dashboardCount[0]?.under_review_count} color="secondary" />
                <StatusIndicator to={`/goal-views?status=Approved`} icon={<CheckCircle size={20} />} label="Approved" count={dashboardCount[0]?.approved_assignments} color="success" />
                
                <StatusIndicator to={`/goal-views?status=Rejected`} icon={<XCircle size={20} />} label="Rejected" count={dashboardCount[0]?.rejected_count} color="error" />
                <StatusIndicator to={`/goal-views?status=Approve_Reviewer`} icon={<CheckCircle size={20} />} label="Reviewer Approved" count={dashboardCount[0]?.approve_reviewer_count} color="success" />
                <StatusIndicator to={`/goal-views?status=Modify_Correction_Reviewer`} icon={<Edit3 size={20} />} label="Reviewer Modify" count={dashboardCount[0]?.modify_correction_reviewer_count} color="warning" />
                <StatusIndicator to={`/goal-views?status=Need_More_Information_Reviewer`} icon={<AlertCircle size={20} />} label="Reviewer Need Info" count={dashboardCount[0]?.need_more_information_reviewer_count} color="error" />
                <StatusIndicator to={`/goal-views?status=Modify_Correction_Super_Admin`} icon={<Edit3 size={20} />} label="Admin Modify" count={dashboardCount[0]?.modify_correction_super_admin_count} color="error" />
                <StatusIndicator to={`/goal-views?status=Need_More_Information_Super_Admin`} icon={<AlertCircle size={20} />} label="Admin Need Info" count={dashboardCount[0]?.need_more_information_super_admin_count} color="error" />
                <StatusIndicator to={`/goal-views?status=Completed`} icon={<AlertCircle size={20} />} label="Completed" count={dashboardCount[0]?.completed_count} color="error" />
              </Box>
            </Paper>
          </Box>
        </Box>
      </>
    );
  };

  const UserView = () => {
    const userCounts = dashboard?.assigned_user?.counts || {};
    const totalTemplates = userCounts.total || 0;

    return (
      <>
        <Box sx={{ px: { xs: 3, md: 4 } }}> {/* Wrapper Box for consistent horizontal padding */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Assignments
            </Typography>
            <Typography sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
              Manage your templates and track progress
            </Typography>
          </Box>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, borderBottom: `1px solid ${theme.palette.divider}`, pb: 2 }}>
              <Avatar sx={{ color: 'primary.main', mr: 2, bgcolor: 'transparent', border: `1px solid ${theme.palette.primary.main}` }}>
                <Layers size={24} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total Assignments
                </Typography>
                {loading ? (
                  <Skeleton width="60%" height={40} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {dashboardCount[0]?.total_assignments}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <StatusIndicator to={`/goal-views?status=Assigned`} icon={<FilePlus size={20} />} label="Assigned" count={dashboardCount[0]?.assigned_count} color="info" />
              <StatusIndicator to={`/goal-views?status=Goals_Pending`} icon={<Target size={20} />} label="Goals Pending" count={dashboardCount[0]?.goals_pending_count} color="secondary" />
              <StatusIndicator to={`/goal-views?status=In_Progress`} icon={<Activity size={20} />} label="In Progress" count={dashboardCount[0]?.in_progress_count} color="primary" />
              <StatusIndicator to={`/goal-views?status=Submitted`} icon={<Send size={20} />} label="Submitted" count={dashboardCount[0]?.submitted_count} color="warning" />
              <StatusIndicator to={`/goal-views?status=Under_Review`} icon={<UserCheck size={20} />} label="Under Review" count={dashboardCount[0]?.under_review_count} color="secondary" />
              <StatusIndicator to={`/goal-views?status=Approved`} icon={<CheckCircle size={20} />} label="Approved" count={dashboardCount[0]?.approved_assignments} color="success" />
              
              <StatusIndicator to={`/goal-views?status=Rejected`} icon={<XCircle size={20} />} label="Rejected" count={dashboardCount[0]?.rejected_count} color="error" />
              <StatusIndicator to={`/goal-views?status=Approve_Reviewer`} icon={<CheckCircle size={20} />} label="Reviewer Approved" count={dashboardCount[0]?.approve_reviewer_count} color="success" />
              <StatusIndicator to={`/goal-views?status=Modify_Correction_Reviewer`} icon={<Edit3 size={20} />} label="Reviewer Modify" count={dashboardCount[0]?.modify_correction_reviewer_count} color="warning" />
              <StatusIndicator to={`/goal-views?status=Need_More_Information_Reviewer`} icon={<AlertCircle size={20} />} label="Reviewer Need Info" count={dashboardCount[0]?.need_more_information_reviewer_count} color="error" />
              <StatusIndicator to={`/goal-views?status=Modify_Correction_Super_Admin`} icon={<Edit3 size={20} />} label="Admin Modify" count={dashboardCount[0]?.modify_correction_super_admin_count} color="error" />
              <StatusIndicator to={`/goal-views?status=Need_More_Information_Super_Admin`} icon={<AlertCircle size={20} />} label="Admin Need Info" count={dashboardCount[0]?.need_more_information_super_admin_count} color="error" />
              <StatusIndicator to={`/goal-views?status=Completed`} icon={<AlertCircle size={20} />} label="Completed" count={dashboardCount[0]?.completed_count} color="error" />
            </Box>
          </Paper>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, px: { xs: 3, md: 4 } }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Goal Details
              </Typography>
              <Typography sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                Manage your Goals and track progress
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
              <CompactStatCard
                title="Total Sub Goals"
                value={dashboardCount[0]?.total_goals}
                to="/view-goals"
                icon={<FilePlus size={24} />}
                color="warning"
              />
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                Need To Review
              </Typography>
              <Typography sx={{ color: alpha(theme.palette.text.primary, 0.7) }}>
                Manage your templates and track progress
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
              <CompactStatCard
                title="Review Templates"
                value={dashboardCount[0]?.pending_reviews}
                to="/goal-reviews"
                icon={<FolderPlus size={24} />}
                color="success"
              />
            </Box>
            <Paper>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>

                <StatusIndicator to={`goal-reviews?status=Under_Review`} icon={<UserCheck size={20} />} label="Under Review" count={ReviewerDashboardCountData[0]?.under_review_count} color="secondary" />
                {/* <StatusIndicator to={`/goal-views?status=Rejected`} icon={<XCircle size={20} />} label="Rejected" count={dashboardCount[0]?.rejected_count} color="error" /> */}
                <StatusIndicator to={`/goal-reviews?status=Approve_Reviewer`} icon={<CheckCircle size={20} />} label="Reviewer Approved" count={ReviewerDashboardCountData[0]?.approve_reviewer_count} color="success" />
                <StatusIndicator to={`/goal-reviews?status=Modify_Correction_Reviewer`} icon={<Edit3 size={20} />} label="Reviewer Modify" count={ReviewerDashboardCountData[0]?.modify_correction_reviewer_count} color="warning" />
                <StatusIndicator to={`/goal-reviews?status=Need_More_Information_Reviewer`} icon={<AlertCircle size={20} />} label="Reviewer Need Info" count={ReviewerDashboardCountData[0]?.need_more_information_reviewer_count} color="error" />
              </Box>
            </Paper>
          </Box>
        </Box>
      </>
    );
  };

  return (
    <Fade in timeout={500}>
      <Box sx={{
        flexGrow: 1,
        minHeight: '100vh',
        bgcolor: 'background.default',
      }}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          {/* <WelcomeHeader /> */}
          {isAdmin ? <AdminView /> : <UserView />}
        </Container>
      </Box>
    </Fade>
  );
};

export default Dashboard;