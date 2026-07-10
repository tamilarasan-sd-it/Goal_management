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
    Menu,
    MenuItem,
    ListItemIcon,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Button,
    Autocomplete
} from '@mui/material';
import Chip from '@mui/material/Chip';
import { alpha } from '@mui/material/styles';
import FileStackIcon from '@mui/icons-material/FileCopy'; // Using a suitable icon
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Block from '@mui/icons-material/Block';
import PendingActions from '@mui/icons-material/PendingActions';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import Send from '@mui/icons-material/Send';
import Badge from '@mui/icons-material/Badge';
import CommentIcon from '@mui/icons-material/Comment';
import { useNavigate , useParams} from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const getAssignmentsData = createSelector(
    state => state?.dataService?.pages?.assignments,
    (assignmentsPage) => ({
        loading: assignmentsPage?.loading?.AssignmentsListLoad || false,
        assignments: assignmentsPage?.data?.AssignmentsData || [],
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

const ViewAssignmentsList = () => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const template_pid = id;
    
    const { loading, assignments, error } = useSelector(getAssignmentsData);
    const { positionsLoading, employeesLoading, positions, employeesByPosition } = useSelector(getPageData);

   

    const allEmployees = useSelector(getEmployeesData);

    const navigate = useNavigate();

    // Edit Modal State
    const [editOpen, setEditOpen] = useState(false);
    const [editFormData, setEditFormData] = useState(null);
    // Delete Dialog State
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);

    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

    const handleMenuClick = (event, assignmentId) => {
        setAnchorEl(event.currentTarget);
        console.log('Selected Assignment ID:', assignmentId);
        setSelectedAssignmentId(assignmentId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedAssignmentId(null);
    };

    const handleEditOpen = () => {
        const assignmentToEdit = assignments.find(a => a.assignment_id === selectedAssignmentId);
        console.log(assignmentToEdit, "assignmentToEditassignmentToEdit")
        if (assignmentToEdit) {
            setEditFormData({
                assignment_id: assignmentToEdit.assignment_id,
                assigned_position: assignmentToEdit.assigned_position || '',
                assigned_employee: allEmployees.find(e => e.employee_id === assignmentToEdit.assigned_employee_id) || null,
                reviewer: { ...allEmployees.find(e => e.employee_id === assignmentToEdit.assigned_reviewer_id) } || null,
            });
            setEditOpen(true);
        }
        handleMenuClose();
    };

    const filteredEmployeesForEdit = useMemo(() => {
        if (!editFormData || !editFormData.assigned_position) {
            return employeesByPosition;
        }
        return employeesByPosition.filter(employee =>
            employee.role_type === editFormData.assigned_position
        );
    }, [editFormData?.assigned_position, employeesByPosition]);

    const handleEditClose = () => {
        setEditOpen(false);
        setEditFormData(null);
    };

    const handleEditFormChange = (name, value) => {
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePositionChange = (event, newValue) => {
        handleEditFormChange('assigned_position', newValue || '');
        handleEditFormChange('assigned_employee', null);
        handleEditFormChange('reviewer', null);
        if (newValue) {
            dispatch(setLoading("employees", "EmployeesByPositionLoad", true));
            dispatch(fetchByIdAction('application/json', "employees", "EmployeesByPositionData", "EmployeesByPositionLoad", newValue));
        }
    };

    const handleEmployeeChange = (event, newValue) => {
        handleEditFormChange('assigned_employee', newValue || null);
        if (newValue) {
            const reviewer = allEmployees.find(e => e.employee_id === newValue.reporting_manager_id);
            handleEditFormChange('reviewer', reviewer || null);
        } else {
            handleEditFormChange('reviewer', null);
        }
    };

    const handleEditSubmit = () => {
        const payload = {
            assignment_id: editFormData.assignment_id,
            assigned_employee_id: editFormData.assigned_employee?.employee_id,
            assigned_reviewer_id: editFormData?.assigned_employee?.reporting_manager_id,
            assigned_employee_name: editFormData?.assigned_employee?.emp_name,
            assigned_reviewer_name: editFormData?.assigned_employee?.reporting_manager_name
        };
        console.log(payload, "payloadpayloadpayload")
        dispatch(setLoading("assignments_list", "AssignmentsListLoad", true));
        dispatch(updateAction('application/json', "assignments", "AssignmentsData", "AssignmentsListLoad", 'updateAssignment', payload));
        handleEditClose();
    };

    const handleDeleteOpen = (assignmentId) => {
        setAssignmentToDelete(assignmentId);
        setDeleteOpen(true);
        handleMenuClose();
    };

    const handleDeleteClose = () => {
        setDeleteOpen(false);
        setAssignmentToDelete(null);
    };

    const handleDeleteConfirm = () => {
        console.log('Deleting assignment with ID:', assignmentToDelete);
        if (assignmentToDelete) {
            dispatch(setLoading("assignments_list", "AssignmentsListLoad", true));
            dispatch(deleteAction('application/json', "assignments", "AssignmentsData", "AssignmentsListLoad", { assignment_id: assignmentToDelete }));
            handleDeleteClose();
        }

    };

    useEffect(() => {
        if (template_pid) {
            dispatch(setLoading("assignments", "AssignmentsListLoad", true));
            dispatch(fetchByIdAction('application/json', "assignments", "AssignmentsData", "AssignmentsListLoad",template_pid));
        }
        // Fetch employee positions on component mount
        // dispatch(setLoading("employees", "PositionsLoad", true));
        // dispatch(fetchAction('application/json', "employees", "PositionsData", "PositionsLoad"));
    }, [dispatch, template_pid]);

    const columns = [
        { id: 'sno', label: 'S.No', minWidth: 50 },
        { id: 'template_name', label: 'Template Name', minWidth: 250 },
        { id: 'assigned_employee_name', label: 'Owner', minWidth: 200 },
        { id: 'assigned_reviewer_name', label: 'Reviewer', minWidth: 200 },
        { id: 'assignment_date', label: 'Assigned Date', minWidth: 180 },
        { id: 'assignment_status', label: 'Status', minWidth: 150 },
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
            case 'Approve_Reviewer':
                return {
                    icon: <CommentIcon sx={{ fontSize: 16 }} />,
                    label: 'Reviwer Approved',
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

    return (
        <Fade in timeout={500}>
            <Container maxWidth={false} sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FileStackIcon fontSize="large" color="primary" />
                        <div>
                            {assignments?.length > 0 && (
                                <Typography variant="h4" component="h1" fontWeight="bold" color="primary.dark">
                                    {assignments[0].template_name}
                                </Typography>
                             )}
                            <Typography variant="body2" color="text.secondary">
                                A complete list of Goal Settings.
                            </Typography>
                        </div>
                    </Box>
                    <Button
                        onClick={() => window.history.back()}
                        startIcon={<ArrowBackIcon />}
                        sx={{ marginLeft: '74%' }}
                    >
                        Back
                    </Button>
                    {/* <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/create-goal-settings')}
                        sx={{
                            borderRadius: '6px',
                            boxShadow: 'none',
                            bgcolor: '#3b82f6',
                            transition: 'background-color 0.3s ease, transform 0.2s ease',
                            '&:hover': { bgcolor: '#2563eb', transform: 'scale(1.02)' }
                        }}
                    >
                        Add Goal Settings
                    </Button> */}
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
                            <Menu
                                id="long-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                            >
                                <MenuItem onClick={() => {
                                    const selectedRow = assignments.find(a => a?.assignment_id === selectedAssignmentId);
                                    navigate(`/goal-views/${selectedRow?.ta_template_id}`);
                                    handleMenuClose();
                                }}>
                                    <ListItemIcon>
                                        <VisibilityIcon fontSize="small" />
                                    </ListItemIcon>
                                    View
                                </MenuItem>
                                {assignments?.find(a => a?.assignment_id === selectedAssignmentId)?.assignment_status === 'Assigned' && [

                                    <MenuItem key="edit" onClick={handleEditOpen}>
                                        <ListItemIcon>
                                            <EditIcon fontSize="small" />
                                        </ListItemIcon>
                                        Edit
                                    </MenuItem>,
                                    <MenuItem key="delete" onClick={() => handleDeleteOpen(selectedAssignmentId)}>
                                        <ListItemIcon>
                                            <DeleteIcon fontSize="small" />
                                        </ListItemIcon>
                                        Delete
                                    </MenuItem>
                                ]}
                            </Menu>
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
                                                    if (column.id === 'assignment_status') {
                                                        const statusConfig = getStatusConfig(value);
                                                        return (
                                                            <TableCell key={column.id}>
                                                                <Chip
                                                                    icon={statusConfig.icon}
                                                                    label={statusConfig.label}
                                                                    size="small"
                                                                    sx={{
                                                                        backgroundColor: statusConfig.backgroundColor,
                                                                        color: statusConfig.color,
                                                                        fontWeight: 600,
                                                                        height: '28px',
                                                                        '& .MuiChip-icon': {
                                                                            marginLeft: '6px',
                                                                        }
                                                                    }}
                                                                />
                                                            </TableCell>
                                                        );
                                                    }
                                                    if (column.id === 'assignment_date') {
                                                        return (
                                                            <TableCell key={column.id}>
                                                                {new Date(value).toLocaleString()}
                                                            </TableCell>
                                                        );
                                                    }
                                                    if (column.id === 'actions') {
                                                        return (
                                                            <TableCell key={column.id} align={column.align}>
                                                                <IconButton
                                                                    aria-label="more"
                                                                    aria-controls="long-menu"
                                                                    aria-haspopup="true"
                                                                    onClick={(e) => handleMenuClick(e, row.assignment_id)}
                                                                >
                                                                    <MoreVertIcon />
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

                    {/* Edit Dialog */}
                    {editFormData && (
                        <Dialog open={editOpen} onClose={handleEditClose}>
                            <DialogTitle>Edit Assignment</DialogTitle>
                            <DialogContent>
                                <DialogContentText sx={{ mb: 2 }}>
                                    Update the assigned employee or reviewer for this template assignment.
                                </DialogContentText>

                                <Autocomplete
                                    options={positions}
                                    getOptionLabel={(option) => option || ''}
                                    value={editFormData.assigned_position}
                                    onChange={handlePositionChange}
                                    loading={positionsLoading}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Select Position" margin="normal" fullWidth />
                                    )}
                                />

                                <Autocomplete
                                    options={filteredEmployeesForEdit}
                                    getOptionLabel={(option) => option.emp_name ? `${option.emp_name} (${option.employee_id})` : ''}
                                    value={editFormData.assigned_employee}
                                    onChange={handleEmployeeChange}
                                    disabled={!editFormData.assigned_position || employeesLoading}
                                    loading={employeesLoading}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select Employee"
                                            margin="normal"
                                            fullWidth
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <React.Fragment>
                                                        {employeesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </React.Fragment>
                                                ),
                                            }}
                                        />
                                    )}
                                />

                                <TextField
                                    label="Reviewer"
                                    margin="normal"
                                    fullWidth
                                    value={editFormData?.assigned_employee ? `${editFormData?.assigned_employee?.reporting_manager_name} (${editFormData?.assigned_employee?.reporting_manager_id})` : ''}
                                    InputProps={{
                                        readOnly: true,
                                    }}
                                    disabled
                                />

                            </DialogContent>
                            <DialogActions>
                                <Button onClick={handleEditClose}>Cancel</Button>
                                <Button
                                    onClick={handleEditSubmit}
                                    variant="contained"
                                    disabled={!editFormData.assigned_employee || !editFormData?.assigned_employee?.reporting_manager_id}>Save</Button>
                            </DialogActions>
                        </Dialog>
                    )}


                    {deleteOpen && <Dialog
                        open={deleteOpen}
                        onClose={handleDeleteClose}
                        aria-labelledby="alert-dialog-title"
                        aria-describedby="alert-dialog-description"
                    >
                        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
                        <DialogContent>
                            <DialogContentText id="alert-dialog-description">
                                Are you sure you want to delete this assignment? This action cannot be undone.
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleDeleteClose}>Cancel</Button>
                            <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                                Delete
                            </Button>
                        </DialogActions></Dialog>}


                </Paper>
            </Container>
        </Fade>
    );
};

export default ViewAssignmentsList;