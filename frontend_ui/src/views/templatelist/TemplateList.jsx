import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import {
    Typography,
    Box,
    Alert,
    Fade,
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
} from '@mui/material';
import FileStackIcon from '@mui/icons-material/FileCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/common.css';

import PageContainer from "../../components/Common/PageContainer";
import AppCard from "../../components/Common/AppCard";
import AppButton from "../../components/Common/AppButton";
import AppHeader from "../../components/Common/AppHeader";
import AppTable from "../../components/Common/AppTable";

// ---- Design tokens (shared with GoalViewPage) ----
const INDIGO = '#4F46E5';
const INDIGO_DARK = '#3730A3';
const CORAL = '#FF6B6B';
const MINT = '#2EC4B6';
const INK = '#292B3D';
const SLATE = '#767A94';
const LINE = '#ECEDF6';

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
        dispatch(fetchByIdAction('application/json', "templatelist", "TemplateListDataList", "TemplateListDataLoad", payload));
    }, [dispatch, user?.id]);

    const rows = Array.isArray(templatelist)
        ? templatelist.map((item, index) => ({ ...item, id: item?.template_pid || index }))
        : [];

    return (
       <Box>
           <PageContainer
    sx={{
        minHeight: "100vh",
        background:
            "linear-gradient(180deg,#F4F8FF 0%,#EEF5FF 50%,#F8FBFF 100%)",
        py: 3,
    }}
>

                {/* Header */}
                
<AppCard
    sx={{
        mb:3,
        p:3,
        borderRadius:5,
        background:"linear-gradient(135deg,#FFFFFF,#F8FBFF)",
        boxShadow:"0 12px 35px rgba(37,99,235,.10)"
    }}
>

<Box
display="flex"
justifyContent="space-between"
alignItems="center"
>

<AppHeader
title="All Template List"
subtitle="A complete list of all Goal Settings"
/>

<AppButton
    startIcon={<ArrowBackIcon />}
    onClick={() => window.history.back()}
    sx={{
        height: 48,
        px: 4,
        borderRadius: "16px",
        fontWeight: 700,
    }}
>
    Back
</AppButton>

</Box>

</AppCard>

                {error && !loading && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                        Failed to load templates: {error.message || 'Unknown error'}
                    </Alert>
                )}

                {/* Table Section */}
                <Box>
                    {loading || rows.length > 0 ? (
                      <AppTable
sx={{
overflow:"hidden",
borderRadius:5,
boxShadow:"0 12px 35px rgba(37,99,235,.10)"
}}
>
                    
                            <TableContainer sx={{
                                maxHeight: 'calc(100vh - 280px)',
                                '&::-webkit-scrollbar': { width: '8px', height: '8px' },
                                '&::-webkit-scrollbar-thumb': { background: alpha(INDIGO, 0.3), borderRadius: '4px' },
                                '&::-webkit-scrollbar-thumb:hover': { background: INDIGO },
                            }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{
                                            '& .MuiTableCell-root': {
                                                background:"linear-gradient(135deg,#2563EB,#4F46E5)",
                                               color:"#ffffff",
                                                fontWeight: 700,
                                                fontSize: '0.82rem',
                                                fontFamily: "'Poppins', sans-serif",
                                                border: 'none',
                                                padding: '14px 16px',
                                                height: '52px',
                                                whiteSpace: 'nowrap',
                                            },
                                        }}>
                                            <TableCell sx={{ minWidth: '70px' }}>S.No</TableCell>
                                            <TableCell sx={{ minWidth: '260px' }}>Template Name</TableCell>
                                            <TableCell sx={{ minWidth: '160px' }}>Owner Count</TableCell>
                                            <TableCell sx={{ minWidth: '120px', textAlign: 'center' }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {loading ? (
                                            Array.from({ length: 5 }).map((_, index) => (
                                                <TableRow key={index}>
                                                    {Array.from({ length: 4 }).map((_, i) => (
                                                        <TableCell key={i} sx={{ padding: '12px 16px' }}>
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
                                                        className="goal-row"
                                                        style={{
                                                            animationDelay: `${index * 0.04}s`,
                                                           backgroundColor:
index % 2 === 0
? "#FFFFFF"
: "#F8FBFF"
                                                        }}
                                                        sx={{
                                                            '&:last-child td, &:last-child th': { border: 0 },
                                                            '& td': {
                                                                padding: '12px 16px',
                                                                borderBottom: `1px solid ${LINE}`,
                                                                fontSize: '0.875rem',
                                                                color: INK,
                                                            },
                                                            transition:"all .25s ease",

"&:hover": {
background:"#EEF5FF",
transform:"translateY(-2px)",
boxShadow:"0 8px 20px rgba(37,99,235,.12)",
},                                   }}
                                                    >
                                                        <TableCell>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: SLATE }}>
                                                                {page * rowsPerPage + index + 1}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, color: INK }}>
                                                                {row.template_name}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={`${row.total_assignments ?? 0} Owners`}
                                                                size="small"
                                                                sx={{
                                                                   background:"#DCFCE7",
border:"1px solid #BBF7D0",
color:"#15803D",
                                                                    fontWeight: 700,
                                                                    height: '24px',
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Tooltip title="View Details">
                                                                <IconButton
                                                                    className="goal-icon-btn"
                                                                    onClick={() => navigate(`/goallist-views/${row.template_pid}`)}
                                                                    size="small"
                                                                   sx={{
    bgcolor: "#EEF5FF",
    color: "#2563EB",
    transition: "all .25s ease",

    "&:hover": {
        background: "#2563EB",
        color: "#fff",
        transform: "scale(1.15) rotate(8deg)",
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
                            <TablePagination
sx={{
background:"#FBFDFF",
borderTop:"1px solid rgba(37,99,235,.08)",

"& .MuiTablePagination-toolbar":{
minHeight:65
},

"& .MuiIconButton-root:hover":{
background:"#EEF5FF"
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
                       </AppTable>
                    ) : (
                        <AppTable
sx={{
p:5,
textAlign:"center"
}}
>
                            <Box sx={{
                                width: 100,
                                height: 100,
                                margin: '0 auto 20px',
                                borderRadius: '50%',
                                background: `linear-gradient(135deg, ${alpha(INDIGO, 0.12)} 0%, ${alpha(MINT, 0.12)} 100%)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <FileStackIcon sx={{ fontSize: 44, color: INDIGO }} />
                            </Box>
                            <Typography variant="h6" fontWeight="700" sx={{ color: INK, fontFamily: "'Poppins', sans-serif" }} gutterBottom>
                                No Templates Found
                            </Typography>
                            <Typography variant="body1" sx={{ color: SLATE, maxWidth: 400, mx: 'auto' }}>
                                There are no goal templates available for creation at the moment.
                            </Typography>
                        </AppTable>
                    )}
                </Box>
            </PageContainer>
        </Box>
    );
};

export default TemplateList;