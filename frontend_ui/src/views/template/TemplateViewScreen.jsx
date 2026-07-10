// d:\GOAL_NEW_VERSION\frontend_ui\src\views\template\template.jsx
import React, { useEffect, useState } from 'react';
import {
    Fade,
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    CircularProgress,
    IconButton,
    Menu,
    ListItemIcon,
    ListItemText,
    Snackbar,
    Alert,
    Skeleton,
    MenuItem,
    Stepper,
    Step,
    StepLabel,
    Select,
    Autocomplete,
    InputLabel, // This might be redundant if TextField's label is used.
    FormControl,
    Checkbox,
    Grid,
    List, ListItem, Divider
} from '@mui/material';

// New component for rendering the template preview content
export const TemplateViewScreen = ({ templateData, categories, employeesByPosition }) => {
    // Ensure templateData is not null or undefined before accessing its properties
    if (!templateData) {
        return <Typography>No template data available for preview.</Typography>;
    }

    // Find the assigned employee details from employeesByPosition based on templateData.assigned_employee
   const assignedEmployeeDetails = employeesByPosition.find(e => e.employee_id == templateData.template_assigned_to_user_id);
console.log(templateData,"templateData")
console.log(assignedEmployeeDetails,"assignedEmployeeDetails")
console.log(categories,"categories")
console.log(employeesByPosition,"employeesByPosition")
    return (
        <Box sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" color="primary.main">Template Details</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* Left Column: Template Details */}
                <Box sx={{ width: { xs: '100%', md: '30%' } }}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #e2e8f0', pb: 1, mb: 2 }}>General Information</Typography>
                        <Box>
                            <Typography variant="body2" color="text.secondary">Template Name</Typography>
                            <Typography variant="body1" fontWeight="500" gutterBottom>{templateData.template_name}</Typography>
                        </Box>
                        <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">Year</Typography>
                            <Typography variant="body1" fontWeight="500" gutterBottom>{templateData.template_year}</Typography>
                        </Box>
                        {/* <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">Assigned Position</Typography>
                            <Typography variant="body1" fontWeight="500" gutterBottom>{templateData.template_assigned_position || 'N/A'}</Typography>
                        </Box>
                        <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">Assigned Employee</Typography>
                            <Typography variant="body1" fontWeight="500" gutterBottom>
                                {assignedEmployeeDetails?.emp_name || 'N/A'}
                            </Typography>
                        </Box>
                        <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">Reviewer</Typography>
                            <Typography variant="body1" fontWeight="500">
                                {assignedEmployeeDetails?.reporting_manager_name || 'N/A'}
                            </Typography>
                        </Box> */}
                    </Paper>
                </Box>

                {/* Right Column: Categories & Columns */}
                <Box sx={{ width: { xs: '100%', md: '70%' } }}>
                    {/* Categories */}
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #e2e8f0', pb: 1, mb: 2 }}>Selected Categories</Typography>
                        {templateData.categories && templateData.categories.length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ '& > th': { borderBottom: '2px solid #e2e8f0' } }}>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Category Name</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>KPI/Metric</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Target</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>Weightage (%)</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {templateData.categories.map((cat, index) => (
                                            <TableRow key={cat.category_pid} sx={{ '& > td': { border: 0 } }}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell>{categories.find(c => c.category_pid === cat.category_pid)?.category_name || 'Unknown'}</TableCell>
                                                <TableCell>{cat.tc_kpi_metric || 'N/A'}</TableCell>
                                                <TableCell>{cat.tc_target || 'N/A'}</TableCell>
                                                <TableCell>{cat.tc_category_description || 'N/A'}</TableCell>
                                                <TableCell align="right">{cat.tc_max_weightage || 0}%</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ '& > td': { borderTop: '1px solid #e2e8f0' } }}>
                                            <TableCell colSpan={5} component="th" scope="row" align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {templateData.categories.reduce((sum, cat) => sum + (Number(cat.tc_max_weightage) || 0), 0)}%
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No categories selected.</Typography>
                        )}
                    </Paper>

                    {/* Columns */}
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ borderBottom: '1px solid #e2e8f0', pb: 1, mb: 2 }}>Configured Columns (In Order)</Typography>
                        {templateData.columns && templateData.columns.length > 0 ? (
                            <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                                {templateData.columns.map((col, index) => (
                                    <React.Fragment key={col.column_pid}>
                                        <ListItem>
                                            <ListItemText
                                                primary={`${index + 1}. ${col.column_name}`}
                                                secondary={`Type: ${col.column_type}`}
                                            />
                                        </ListItem>
                                        {index < templateData.columns.length - 1 && <Divider component="li" />}
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary">No active columns configured.</Typography>
                        )}
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};