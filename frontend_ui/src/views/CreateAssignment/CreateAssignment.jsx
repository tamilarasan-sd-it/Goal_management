import React, { useEffect, useMemo, useState } from 'react';
import {
    Fade,
    Container,
    Typography,
    Paper,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    Autocomplete,
    Snackbar,
    Alert,
    Checkbox,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, addAction, fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { useNavigate } from 'react-router-dom';

const getPageData = createSelector(
    state => state?.dataService?.pages,
    state => state?.dataService?.AddSuccess,
    (pages, AddSuccess) => {
        const templatesPage = pages?.templates || {};
        const employeesPage = pages?.employees || {};
        const assignmentPage = pages?.assignment || {};

        const templatesRawData = templatesPage?.data?.TemplatesData;
        const templatesData = Array.isArray(templatesRawData)
            ? templatesRawData
            : templatesRawData ? [templatesRawData] : [];

        const positionsData = employeesPage?.data?.PositionsData || [];
        const employeesByPositionData = employeesPage?.data?.EmployeesByPositionData || [];

        return {
            templatesLoading: templatesPage?.loading?.TemplatesLoad || false,
            positionsLoading: employeesPage?.loading?.PositionsLoad || false,
            employeesLoading: employeesPage?.loading?.EmployeesByPositionLoad || false,
            assignmentLoading: assignmentPage?.loading?.AssignmentAdd || false,
            templatesData,
            positions: Array.isArray(positionsData) ? positionsData : [],
            employeesByPosition: Array.isArray(employeesByPositionData) ? employeesByPositionData : [],
            AddSuccess: AddSuccess,
        };
    }
);

const getAuthData = createSelector(
    state => state.auth,
    (auth) => ({
        loggedInUser: auth?.user || null
    })
);

const CreateAssignment = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        template_pid: '',
        assigned_position: [],
        assigned_employee: [],
    });
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const {
        templatesLoading,
        positionsLoading,
        employeesLoading,
        assignmentLoading,
        templatesData,
        positions,
        employeesByPosition,
        AddSuccess,
    } = useSelector(getPageData);

    // console.log(positions, "positions");
    // console.log(employeesByPosition, "employeesByPosition");



    const { loggedInUser } = useSelector(getAuthData);

    const addAssignmentSuccess = AddSuccess;


    useEffect(() => {
        // Fetch templates on component mount
        dispatch(setLoading("templates", "TemplatesLoad", true));
        dispatch(fetchAction('application/json', "templates", "TemplatesData", "TemplatesLoad"));
        // Fetch employee positions on component mount
        // dispatch(setLoading("employees", "PositionsLoad", true));
        // dispatch(fetchAction('application/json', "employees", "PositionsData", "PositionsLoad"));
        dispatch(setLoading("employees", "EmployeesByPositionLoad", true));
        dispatch(fetchAction('application/json', "employees", "EmployeesByPositionData", "EmployeesByPositionLoad"));
    }, [dispatch]);


    useEffect(() => {
        if (addAssignmentSuccess) {
            navigate('/goal-settings');
        }
    }, [addAssignmentSuccess, navigate])

    const handleInputChange = (name, value) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleTemplateChange = (event, newValue) => {
        handleInputChange('template_pid', newValue ? newValue.template_pid : '');
        // Reset position and employee when template changes
        handleInputChange('assigned_position', []);
        handleInputChange('assigned_employee', []);
    };

    const handlePositionChange = (event, newValue) => {
        console.log(newValue, "newValue")
        if (newValue.includes('Select All')) {
            if (formData.assigned_position.length === positions.length) {
                handleInputChange('assigned_position', []);
                handleInputChange('assigned_employee', []);
            } else {
                handleInputChange('assigned_position', positions);

            }
        } else {
            handleInputChange('assigned_position', newValue || []);
            handleInputChange('assigned_employee', []);
            if (newValue.length > 0) {
                dispatch(setLoading("employees", "EmployeesByPositionLoad", true));
                dispatch(fetchAction('application/json', "employees", "EmployeesByPositionData", "EmployeesByPositionLoad"));

            }
        }
    };

    const handleEmployeeChange = (event, newValue) => {
        const allEmployeeIds = employeesByPosition.map(e => e.employee_id);
        const selectedAll = newValue.some(option => option.employee_id === 'Select All');

        if (selectedAll) {
            if (formData.assigned_employee.length === employeesByPosition.length) {
                handleInputChange('assigned_employee', []);
            } else {
                handleInputChange('assigned_employee', allEmployeeIds);
            }
        } else {
            handleInputChange('assigned_employee', newValue.map(e => e.employee_id));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.template_pid) {
            newErrors.template_pid = 'Template is required';
        }
        if (formData.assigned_position.length === 0) {
            newErrors.assigned_position = 'Position is required';
        }
        if (formData.assigned_employee.length === 0) {
            newErrors.assigned_employee = 'Employee is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setSnackbar({ open: true, message: 'Please fill all required fields.', severity: 'error' });
            return;
        }

        const selectedTemplate = templatesData.find(t => t.template_pid === formData.template_pid);

        const selectedEmployees = filteredEmployeesByPosition.filter(e => formData.assigned_employee.includes(e.employee_id));



        const assignmentData = {
            template_pid: formData.template_pid,
            template_name: selectedTemplate?.template_name,
            template_year: selectedTemplate?.template_year,
            assigned_position: formData.assigned_position,
            assignments: selectedEmployees.map(employee => ({
                assigned_employee_id: employee.employee_id,
                assigned_employee_name: employee.emp_name,
                assigned_reviewer_id: employee.reporting_manager_id,
                assigned_reviewer_name: employee.reporting_manager_name,
            })),
            // Keeping these for potential backward compatibility or simplified view, but the 'assignments' array is more detailed.
            assigned_employee_ids: formData.assigned_employee,
            assigned_by_user_id: loggedInUser?.id,
            assigned_by_user_name: loggedInUser?.emp_name,
            assignment_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            assignment_status: 'Assigned', // Or 'Assigned', depending on initial status
        };



        try {
            dispatch(setLoading("assignments", "AssignmentsLoad", true));
            await dispatch(addAction('application/json', "assignments", "AssignmentsData", "AssignmentsLoad", assignmentData));
            // setSnackbar({ open: true, message: 'Assignment created successfully!', severity: 'success' });
            // Optionally navigate or clear form
            setFormData({
                template_pid: '',
                assigned_position: [],
                assigned_employee: [],
            });
            setErrors({});
            // navigate('/goal-views'); // Navigate to goal views after assignment
        } catch (error) {
            console.error("Error creating assignment:", error);
            // setSnackbar({ open: true, message: 'Failed to create assignment.', severity: 'error' });
        } finally {
            dispatch(setLoading("assignment", "AssignmentAdd", false));
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const activeTemplates = templatesData.filter(t => t.template_is_delete === 'Active' && t.template_status === 'Finalized');

    const filteredEmployeesByPosition = useMemo(() => {
        if (formData.assigned_position.length === 0) {
            return employeesByPosition;
        }
        return employeesByPosition.filter(employee =>
            formData.assigned_position.includes(employee.role_type)
        );
    }, [formData.assigned_position, employeesByPosition]);

    return (
        <Fade in timeout={500}>
            <Container maxWidth="md" sx={{ mt: 4, mb: 4, backgroundColor: '#f5f5f5', p: 3, borderRadius: 2 }}>
                <Button
                    onClick={() => navigate('/goal-settings')}
                    startIcon={<ArrowBackIcon />}
                >
                    Back
                </Button>
                <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="#1e293b" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon fontSize="large" /> Create New Goal Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Assign a Finalized template to an employee.
                    </Typography>
                </Paper>

                <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ mb: 3 }}>
                        <Autocomplete
                            fullWidth
                            options={activeTemplates}
                            getOptionLabel={(option) => option.template_name || ''}
                            value={activeTemplates.find(t => t.template_pid === formData.template_pid) || null}
                            onChange={handleTemplateChange}
                            loading={templatesLoading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Template"
                                    margin="normal"
                                    required
                                    error={!!errors.template_pid}
                                    helperText={errors.template_pid}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {templatesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Autocomplete
                            multiple
                            fullWidth
                            options={["Select All", ...positions]}
                            getOptionLabel={(option) => option || ''}
                            value={formData.assigned_position}
                            onChange={handlePositionChange}
                            disabled={!formData.template_pid || positionsLoading}
                            disableCloseOnSelect
                            renderOption={(props, option, { selected }) => (
                                <li {...props}>

                                    <Checkbox
                                        style={{ marginRight: 8 }}
                                        checked={
                                            option === 'Select All'
                                                ? formData.assigned_position.length === positions.length
                                                : selected
                                        }
                                    />
                                    {option}
                                </li>
                            )}
                            loading={positionsLoading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Select Position"
                                    margin="normal"
                                    required
                                    error={!!errors.assigned_position}
                                    helperText={errors.assigned_position}
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {positionsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Box>

                    <Box sx={{ mb: 3 }}>
                        <Autocomplete
                            multiple
                            fullWidth
                            options={[{ emp_name: 'Select All', employee_id: 'Select All' }, ...filteredEmployeesByPosition]}
                            getOptionLabel={(option) => option.emp_name || ''}
                            value={filteredEmployeesByPosition.filter(emp => formData.assigned_employee.includes(emp.employee_id))}
                            onChange={handleEmployeeChange}
                            isOptionEqualToValue={(option, value) => option.employee_id === value.employee_id}
                            disableCloseOnSelect
                            renderOption={(props, option, { selected }) => {
                                const isSelectAll = option.employee_id === 'Select All';
                                const allSelected = formData.assigned_employee.length === filteredEmployeesByPosition.length && filteredEmployeesByPosition.length > 0;
                                const checked = isSelectAll ? allSelected : selected;

                                return (
                                    <li {...props}>
                                        <Checkbox
                                            style={{ marginRight: 8 }}
                                            checked={checked}
                                        />
                                        {option.emp_name}
                                    </li>
                                );
                            }}
                            disabled={formData.assigned_position.length === 0 || employeesLoading}
                            loading={employeesLoading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label={
                                        formData.assigned_position.length > 1
                                            ? 'Select Employees'
                                            : `Select Employee for ${formData.assigned_position[0] || 'Position'}`
                                    }
                                    margin="normal"
                                    required
                                    error={!!errors.assigned_employee}
                                    helperText={errors.assigned_employee}
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
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                        <Button
                            onClick={() => navigate(-1)} // Go back to previous page
                            sx={{ color: '#64748b', mr: 2 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            startIcon={<AssignmentIcon />}
                            disabled={assignmentLoading}
                            sx={{
                                boxShadow: 'none',
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' }
                            }}
                        >
                            {assignmentLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Settings'}
                        </Button>
                    </Box>
                </Paper>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={snackbar.severity}
                        sx={{ width: '100%' }}
                    >
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container>
        </Fade>
    );
};

export default CreateAssignment;