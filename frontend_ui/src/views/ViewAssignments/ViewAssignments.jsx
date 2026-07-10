import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from '@reduxjs/toolkit';
import { fetchAction, updateAction, deleteAction, fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import {
    Container,
    Typography,
    Paper,
    Box,
    CircularProgress,
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
    Button,
} from '@mui/material';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import FileStackIcon from '@mui/icons-material/FileCopy'; // Using a suitable icon
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Block from '@mui/icons-material/Block';
import PendingActions from '@mui/icons-material/PendingActions';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Send from '@mui/icons-material/Send';
import Badge from '@mui/icons-material/Badge';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { keyframes } from '@mui/material/styles';

const getAssignmentsData = createSelector(
    state => state?.dataService?.pages?.assignments,
    (assignmentsPage) => ({
        loading: assignmentsPage?.loading?.AssignmentsDataListLoad || false,
        assignments: assignmentsPage?.data?.AssignmentsDataList || [],
        error: assignmentsPage?.error,
    })
);

const getPageData = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const employeesPage = pages?.employees || {};
        const positionsData = employeesPage?.data?.PositionsData || [];
        const employeesByPositionData = employeesPage?.data?.EmployeesByPositionData || [];

        return {
            positionsLoading: employeesPage?.loading?.PositionsLoad || false,
            employeesLoading: employeesPage?.loading?.EmployeesByPositionLoad || false,
            positions: Array.isArray(positionsData) ? positionsData : [],
            employeesByPosition: Array.isArray(employeesByPositionData) ? employeesByPositionData : [],
        };
    }
);

const getEmployeesData = (state) =>
    state?.dataService?.pages?.employees?.data?.AllEmployeesData || [];

const ViewAssignments = () => {
    const dispatch = useDispatch();
    const { loading, assignments, error } = useSelector(getAssignmentsData);
    const { positionsLoading, employeesLoading, positions, employeesByPosition } = useSelector(getPageData);

    const allEmployees = useSelector(getEmployeesData);

    const navigate = useNavigate();

    // Edit Modal State
    const [editFormData, setEditFormData] = useState(null);
    console.log(editFormData, "editFormDataeditFormDataeditFormData")
    // Delete Dialog State

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
        dispatch(setLoading("assignments", "AssignmentsDataListLoad", true));
        dispatch(fetchAction('application/json', "assignments", "AssignmentsDataList", "AssignmentsDataListLoad"));

        // Fetch employee positions on component mount
        // dispatch(setLoading("employees", "PositionsLoad", true));
        // dispatch(fetchAction('application/json', "employees", "PositionsData", "PositionsLoad"));

    }, [dispatch]);

    const columns = [
        { id: 'sno', label: 'S.No', minWidth: 50 },
        { id: 'template_name', label: 'Template Name', minWidth: 250 },
        { id: 'assigned_employee_name', label: 'Owner Count', minWidth: 200 },
        { id: 'actions', label: 'Actions', minWidth: 100, align: 'center' },
    ];

    const rows = Array.isArray(assignments) ? assignments.map((item, index) => ({ ...item, id: item?.assignment_id || index })) : [];
    // console.log(rows);
    const getStatusConfig = (status) => {
        switch (status) {
            case 'Under_Review':
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: 'Under Review',
                    color: '#3b82f6',
                    backgroundColor: alpha('#3b82f6', 0.1),
                };
            case 'Approved':
                return {
                    icon: <CheckCircle sx={{ fontSize: 16 }} />,
                    label: 'Approved',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            case 'Rejected':
                return {
                    icon: <Block sx={{ fontSize: 16 }} />,
                    label: 'Rejected',
                    color: '#ef4444',
                    backgroundColor: alpha('#ef4444', 0.1),
                };
            case 'Goals_Pending':
                return {
                    icon: <PendingActions sx={{ fontSize: 16 }} />,
                    label: 'Goals Pending',
                    color: '#f59e0b',
                    backgroundColor: alpha('#f59e0b', 0.1),
                };
            case 'Need_More_Information_Reviewer':
                return {
                    icon: <InfoOutlined sx={{ fontSize: 16 }} />,
                    label: 'Need More Information By Reviewer',
                    color: '#f97316',
                    backgroundColor: alpha('#f97316', 0.1),
                };
            case 'Need_More_Information_Super_Admin':
                return {
                    icon: <InfoOutlined sx={{ fontSize: 16 }} />,
                    label: 'Need More Information By Super Admin',
                    color: '#f97316',
                    backgroundColor: alpha('#f97316', 0.1),
                };
            case 'In_Progress':
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: 'In Progress',
                    color: '#f59e0b',
                    backgroundColor: alpha('#f59e0b', 0.1),
                };
            case 'Completed':
                return {
                    icon: <CheckCircle sx={{ fontSize: 16 }} />,
                    label: 'Completed',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };
            case 'Submitted':
                return {
                    icon: <Send sx={{ fontSize: 16 }} />,
                    label: 'Submitted',
                    color: '#6366f1',
                    backgroundColor: alpha('#6366f1', 0.1),
                };
            case 'Assigned':
                return {
                    icon: <Badge sx={{ fontSize: 16 }} />,
                    label: 'Assigned',
                    color: '#a855f7',
                    backgroundColor: alpha('#a855f7', 0.1),
                };
            case 'Modify_Correction_Reviewer':
            case 'Modify_Correction_Super_Admin':
                return {
                    icon: <CommentIcon sx={{ fontSize: 16 }} />,
                    label: 'Information Updated to Reviewer',
                    color: '#10b981',
                    backgroundColor: alpha('#10b981', 0.1),
                };

            default:
                return {
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                    label: status?.replace(/_/g, ' ') || 'Unknown',
                    color: '#6b7280',
                    backgroundColor: alpha('#6b7280', 0.1),
                };
        }
    };
    const float = keyframes`
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-12px); }
    `;

    const pulse = keyframes`
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.08); opacity: 0.7; }
    `;

    const fadeInUp = keyframes`
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
    `;
    const gradientShift = keyframes`
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    `;

    const glowPulse = keyframes`
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.8; }
    `;

    return (
        <Fade in timeout={500}>
            <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
                <Paper
                    elevation={2}
                    sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        position: 'relative',
                        overflow: 'hidden',
                        background: 'linear-gradient(120deg, #eef2ff 0%, #f5f3ff 25%, #eff6ff 50%, #f0fdfa 75%, #eef2ff 100%)',
                        backgroundSize: '300% 300%',
                        animation: `${gradientShift} 8s ease infinite`,
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '-40%',
                            right: '-10%',
                            width: '280px',
                            height: '280px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)',
                            animation: `${glowPulse} 4s ease-in-out infinite`,
                            pointerEvents: 'none',
                        },
                        '&::after': {
                            content: '""',
                            position: 'absolute',
                            bottom: '-50%',
                            left: '10%',
                            width: '220px',
                            height: '220px',
                            borderRadius: '50%',
                            background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
                            animation: `${glowPulse} 5s ease-in-out infinite 1s`,
                            pointerEvents: 'none',
                        },
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
                        <FileStackIcon fontSize="large" color="primary" />
                        <div>
                            <Typography variant="h4" component="h1" fontWeight="bold" color="primary.dark">
                                View Goal Settings
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                A complete list of all Goal Settings.
                            </Typography>
                        </div>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/create-goal-settings')}
                        sx={{
                            borderRadius: '6px',
                            boxShadow: 'none',
                            bgcolor: '#3b82f6',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                            '&:hover': { bgcolor: '#2563eb', transform: 'scale(1.02)' },
                            marginRight: '-60%',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        Add Goal Settings
                    </Button>
                    <Button
                        onClick={() => window.history.back()}
                        startIcon={<ArrowBackIcon />}
                        sx={{ marginLeft: '5%', position: 'relative', zIndex: 1 }}
                    >
                        Back
                    </Button>
                </Paper>

                <Paper elevation={2} sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, overflow: 'hidden' }}>
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {error && !loading && (
                        <Alert severity="error" sx={{ m: 2 }}>
                            Failed to load assignments: {error.message || 'Unknown error'}
                        </Alert>
                    )}
                    {!loading && !error && (
                        <>
                            {rows.length === 0 ? (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        py: 8,
                                        px: 2,
                                    }}
                                >
                                    <Box
                                        sx={{
                                            position: 'relative',
                                            width: 140,
                                            height: 140,
                                            mb: 3,
                                            animation: `${float} 3s ease-in-out infinite`,
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                borderRadius: '50%',
                                                backgroundColor: alpha('#6366f1', 0.08),
                                                animation: `${pulse} 2.5s ease-in-out infinite`,
                                            }}
                                        />
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                inset: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <FileStackIcon
                                                sx={{
                                                    fontSize: 56,
                                                    color: alpha('#6366f1', 0.6),
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Typography
                                        variant="h6"
                                        fontWeight="700"
                                        color="#475569"
                                        sx={{
                                            animation: `${fadeInUp} 0.6s ease-out 0.2s both`,
                                        }}
                                    >
                                        No Templates Found
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        color="#94a3b8"
                                        sx={{
                                            mt: 0.5,
                                            maxWidth: 360,
                                            textAlign: 'center',
                                            animation: `${fadeInUp} 0.6s ease-out 0.35s both`,
                                        }}
                                    >
                                        There are no goal templates available for creation at the moment.
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <TableContainer sx={{ maxHeight: '70vh' }}>
                                        <Table stickyHeader aria-label="sticky table">
                                            <TableHead>
                                                <TableRow>
                                                    {columns.map((column) => (
                                                        <TableCell
                                                            key={column.id}
                                                            style={{ minWidth: column.minWidth, fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                                                            align={column.align}
                                                        >
                                                            {column.label}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, index) => (
                                                    <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                                                        {columns.map((column) => {
                                                            const value = row[column.id];
                                                            if (column.id === 'sno') {
                                                                return (
                                                                    <TableCell key={column.id}>
                                                                        {page * rowsPerPage + index + 1}
                                                                    </TableCell>
                                                                );
                                                            }
                                                            if (column.id === 'assigned_employee_name') {
                                                                return (
                                                                    <TableCell key={column.id}>
                                                                        {row.total_assignments}
                                                                    </TableCell>
                                                                );
                                                            }
                                                            
                                                            
                                                            if (column.id === 'actions') {
                                                                return (
                                                                    <TableCell key={column.id} align={column.align}>
                                                                        <IconButton
                                                                            color="primary"
                                                                            onClick={() => navigate(`/goal-settings-list/${row.template_pid}`)}
                                                                        >
                                                                            <VisibilityIcon />
                                                                        </IconButton>
                                                                    </TableCell>
                                                                );
                                                            }
                                                            return <TableCell key={column.id} align={column.align}>{value}</TableCell>;
                                                        })}
                                                    </TableRow>

                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    <TablePagination
                                        rowsPerPageOptions={[10, 25, 100]}
                                        component="div"
                                        count={rows.length}
                                        rowsPerPage={rowsPerPage}
                                        page={page}
                                        onPageChange={handleChangePage}
                                        onRowsPerPageChange={handleChangeRowsPerPage}
                                    />
  
                                </>
                             )}
                        </>    
                    )}

                </Paper>
            </Container>
        </Fade>
    );
};

export default ViewAssignments;