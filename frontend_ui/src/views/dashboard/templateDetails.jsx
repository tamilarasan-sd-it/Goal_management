import React, { useEffect } from "react";
import { Paper, Box, Typography, Avatar, Skeleton } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import { FileText, Layers, FolderPlus } from "lucide-react";
import { createSelector } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, fetchByIdAction } from '../../StoreRedux/actions/commonActions';

/* -------------------- Selector -------------------- */
const getTemplateData = createSelector(
  state => state?.dataService?.pages,
  (pages) => {
    const dashboardPage = pages?.dashboard || {};
    const dashboardRawData = dashboardPage?.data || {};
    const ReviewerDashboardCountLoad = dashboardPage?.data?.ReviewerDashboardCountLoad || false;
    const ReviewerDashboardCountData = dashboardPage?.data?.ReviewerDashboardCountData || [];
    const TemplateDetailsLoad = dashboardPage?.data?.TemplateDetailsLoad || false;
    const TemplateDetailsCount = dashboardPage?.data?.TemplateDetailsCount || [];
    return {
      dashboard: dashboardRawData,
      loading: dashboardPage?.loading?.DashboardLoad,
      ReviewerDashboardCountLoad: ReviewerDashboardCountLoad,
      ReviewerDashboardCountData: ReviewerDashboardCountData,
      TemplateDetailsLoad: TemplateDetailsLoad,
      TemplateDetailsCount: TemplateDetailsCount
    };
  }
);


/* -------------------- Card Component -------------------- */
const Card = ({ title, total, active, icon, color, to, loading }) => {
  const theme = useTheme();
  const hexColor = theme.palette[color]?.main || theme.palette.primary.main;

  return (
    <Paper
      component={to ? RouterLink : "div"}
      to={to}
      variant="outlined"
      sx={{
        p: 3,
        textDecoration: "none",
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 3,
        width: "100%",
        maxWidth: 420,
        mx: "auto",
        bgcolor: alpha(hexColor, 0.08),
        borderColor: alpha(hexColor, 0.3),
        "&:hover": {
          boxShadow: theme.shadows[3],
          borderColor: hexColor,
          ...(to && { cursor: "pointer" }),
        },
      }}
    >
      <Avatar sx={{ color: hexColor, bgcolor: alpha(hexColor, 0.1) }}>
        {icon}
      </Avatar>

      <Box>
        <Typography
          variant="body1"
          sx={{ fontWeight: 600, color: "text.secondary" }}
        >
          {title}
        </Typography>

        {loading ? (
          <>
            <Skeleton width={80} />
            <Skeleton width={120} />
          </>
        ) : (
          <>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Total: {total}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active: {active}
            </Typography>
          </>
        )}
      </Box>
    </Paper>
  );
};


/* -------------------- Main Component -------------------- */
const TemplateDetails = () => {
  const dispatch = useDispatch();

  const { dashboard, loading } = useSelector(getTemplateData);
  const { user } = useSelector((state) => state.auth);
  const countDetails = dashboard?.TemplateDetailsCount[0] || 0;
  console.log(countDetails,"countDetails")

  useEffect(() => {
    if (!user?.id) return;

    dispatch(setLoading("TemplateDetailsCount", "TemplateDetailsLoad", true));
    dispatch(
      fetchByIdAction(
        "application/json",
        "dashboard",
        "TemplateDetailsCount",
        "TemplateDetailsLoad",
        user.id
      )
    );

  }, [dispatch, user?.id]);

  return (
    <Box
    sx={{
        mt: { xs: 2, md: 3 },
        ml: { xs: 2, md: 3 },
        display: "grid",
        gridTemplateColumns: {
        xs: "1fr",
        sm: "repeat(auto-fit, minmax(360px, max-content))",
        md: "repeat(auto-fit, minmax(360px, max-content))",
        },
        gap: 8,
        justifyContent: "center", // centers the grid
        justifyItems: "center",   // centers each card
    }}
    >

     <Card
        title="Create Category"
        total={countDetails?.total_category_count || 0}
        active={countDetails?.active_category_count || 0}
        icon={<FileText size={22} />}
        color="primary"
        loading={loading}
        to="/add-category"
    />

    <Card
        title="Create Feilds"
        total={countDetails?.total_columns_count || 0}
        active={countDetails?.active_columns_count || 0}
        icon={<Layers size={22} />}
        color="success"
        loading={loading}
        to="/add-fields"
    />

    <Card
        title="Create Template"
        total={countDetails?.total_templates_count || 0}
        active={countDetails?.active_templates_count || 0}
        icon={<FolderPlus size={22} />}
        color="warning"
        loading={loading}
        to="/add-template"
    />

    </Box>
  );
};

export default TemplateDetails;
