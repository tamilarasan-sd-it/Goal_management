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
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    IconButton,
    Menu,
    ListItemIcon,
    ListItemText,
    Snackbar,
    Alert,
    Skeleton,
    Tooltip,
    TablePagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotInterestedIcon from '@mui/icons-material/NotInterested';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, addAction, updateAction, deleteAction } from '../../StoreRedux/actions/commonActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const StyledTableRow = styled(TableRow)(({ theme }) => ({ 
    '&:hover': { 
        backgroundColor: '#f8fafc' 
    } 
}));

const getColumnsDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const result = {};
        const pageNames = ['columns'];
        pageNames.forEach(page => {
            const pageData = pages?.[page];
            const ColumnsLoad = pageData?.loading?.ColumnsLoad;
            const ColumnsData = pageData?.data?.ColumnsData;
            
            result[page] = {
                loading: {
                    ColumnsLoad: ColumnsLoad,
                },
                data: {
                    ColumnsData: ColumnsData,
                }
            };
        });
        return result.columns;
    }
);

const Columns = () => {
    const dispatch = useDispatch();
    const [openDialog, setOpenDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedColumn, setSelectedColumn] = useState(null);
    const [dropdownOptions, setDropdownOptions] = useState([]);
    const [optionInput, setOptionInput] = useState("");
    
    // Form state
    const [formData, setFormData] = useState({
        column_name: '',
        column_type: 'Default',
        column_data_type:''
    });
    
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    
    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Get data from Redux store
    const columnsStore = useSelector(getColumnsDetails) || {};
    const columnsLoading = columnsStore?.loading?.ColumnsLoad || false;
    const columnsData = Array.isArray(columnsStore?.data?.ColumnsData) 
        ? columnsStore.data.ColumnsData 
        : columnsStore?.data?.ColumnsData 
            ? [columnsStore.data.ColumnsData]
            : [];

    console.log(columnsData, "columnsData from API");

    // Filter active columns
    const activeColumns = columnsData.filter(col => col.column_is_delete === 'Active');
    console.log(activeColumns,"activeColumns")

    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    useEffect(() => {
        dispatch(setLoading("columns", "ColumnsLoad", true));
        dispatch(fetchAction('application/json', "columns", "ColumnsData", "ColumnsLoad"));
    }, [dispatch]);

    // Handle menu open/close
    const handleMenuOpen = (event, column) => {
        setAnchorEl(event.currentTarget);
        setSelectedColumn(column);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedColumn(null);
    };

    // Handle dialog open/close
    const handleOpenAddDialog = () => {
        setOpenDialog(true);
        setFormData({
            column_name: '',
            column_type: 'Default'
        });
        setErrors({});
    };

const handleOpenEditDialog = (column) => {
    setSelectedColumn(column);
    setOpenDialog(true);

    setFormData({
        column_name: column.column_name,
        column_type: column.column_type,
        column_data_type: column.column_data_type
    });

    // 🔥 THIS IS THE FIX
    if (column.column_data_type === "dropdown" && column.column_options) {
        try {
            const parsedOptions = Array.isArray(column.column_options)
                ? column.column_options
                : JSON.parse(column.column_options);

            setDropdownOptions(parsedOptions);
        } catch (err) {
            console.error("Invalid column_options JSON", err);
            setDropdownOptions([]);
        }
    } else {
        setDropdownOptions([]);
    }

    setErrors({});
};



  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedColumn(null);

    setFormData({
        column_name: '',
        column_type: 'Default',
        column_data_type: '',
    });

    setDropdownOptions([]); // 🔥 RESET
    setOptionInput("");
    setErrors({});
};


    // Handle delete dialog
    const handleOpenDeleteDialog = (column) => {
        setSelectedColumn(column);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedColumn(null);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        // Clear error for this field
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    // Validate form
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.column_name.trim()) {
            newErrors.column_name = 'Column name is required';
        } else if (formData.column_name.length > 255) {
            newErrors.column_name = 'Column name cannot exceed 255 characters';
        }
        
        if (!formData.column_type) {
            newErrors.column_type = 'Column type is required';
        }
        
        // Check for duplicate column name (excluding current column being edited)
        if (selectedColumn) {
            const duplicate = activeColumns.find(
                col => 
                    col.column_name.toLowerCase() === formData.column_name.trim().toLowerCase() &&
                    col.column_pid !== selectedColumn.column_pid
            );
            if (duplicate) {
                newErrors.column_name = 'Column name already exists';
            }
        } else {
            // For new column, check if any active column has same name
            const duplicate = activeColumns.find(
                col => col.column_name.toLowerCase() === formData.column_name.trim().toLowerCase()
            );
            if (duplicate) {
                newErrors.column_name = 'Column name already exists';
            }
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    

    // Handle form submission
    const handleSubmit = () => {
        if (validateForm()) {
            setIsLoading(true);
            
            if (selectedColumn) {
                // Update existing column
                const updatedColumn = {
                        ...selectedColumn,
                        column_name: formData.column_name.trim(),
                        column_type: formData.column_type,
                        column_data_type: formData.column_data_type,
                        column_modified_at: new Date().toISOString().slice(0, 19).replace('T', ' '),

                        // 👇 IMPORTANT
                        column_options:
                            formData.column_data_type === "dropdown"
                                ? JSON.stringify(dropdownOptions)
                                : null
                    };
                
                console.log(updatedColumn,"updatedColumnupdatedColumnupdatedColumn")
                dispatch(setLoading("columns", "ColumnsLoad", true));
                dispatch(updateAction('application/json', "columns", "ColumnsData", "ColumnsLoad", 'updateColumn', updatedColumn));
                
                setSnackbar({
                    open: true,
                    message: 'Column updated successfully!',
                    severity: 'success'
                });
            } else {
                // Add new column
                const newColumnOrder = columnsData.length > 0 
                    ? Math.max(...columnsData.map(col => col.column_order)) + 1 
                    : 1;
                const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
                
                const newColumn = {
                    column_name: formData.column_name.trim(),
                    column_type: formData.column_type,
                    column_data_type: formData.column_data_type,
                    column_is_visible: 1,
                    column_order: newColumnOrder,
                    column_created_at: currentTimestamp,
                    column_modified_at: currentTimestamp,
                    column_is_delete: 'Active',
                    column_options:
                        formData.column_data_type === "dropdown"
                        ? JSON.stringify(dropdownOptions) // stringify ONCE
                        : null
                };

                console.log(newColumn,"newColumn")
                
                dispatch(setLoading("columns", "ColumnsLoad", true));
                dispatch(addAction('application/json', "columns", "ColumnsData", "ColumnsLoad", newColumn));
                
                setSnackbar({
                    open: true,
                    message: 'Column added successfully!',
                    severity: 'success'
                });
            }
            
            setIsLoading(false);
            handleCloseDialog();
        }
    };

    // Handle delete confirmation
    const handleDelete = () => {
        setIsLoading(true);
        
        const columnToDelete = {
            ...selectedColumn,
            column_is_delete: 'In Active',
            // column_modified_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
        };
        console.log(columnToDelete,)
        
        dispatch(setLoading("columns", "ColumnsLoad", true));
        dispatch(deleteAction('application/json', "columns", "ColumnsData", "ColumnsLoad", columnToDelete));
        
        setSnackbar({
            open: true,
            message: 'Column deleted successfully!',
            severity: 'warning'
        });
        
        setIsLoading(false);
        handleCloseDeleteDialog();
    };

    // Handle snackbar close
    const handleSnackbarClose = () => {
        // setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Fade in timeout={500}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, backgroundColor: '#f5f5f5', p: 3, borderRadius: 2 }}>
                <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="#1e293b">
                        Columns Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Total Active Columns: {activeColumns.length}
                    </Typography>
                    <Button
                        onClick={() => window.history.back()}
                        startIcon={<ArrowBackIcon />}
                        sx={{ marginLeft: '92%', marginTop: '-9%' }}
                    >
                        Back
                    </Button>
                </Paper>

                <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 2, 
                        pb: 2, 
                        borderBottom: '2px solid #e5e7eb' 
                    }}>
                        <Typography variant="h5" component="h2" fontWeight="bold" color="#1e293b">
                            All Columns
                        </Typography>
                        <Button 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={handleOpenAddDialog}
                            sx={{ 
                                borderRadius: '6px', 
                                boxShadow: 'none', 
                                bgcolor: '#3b82f6', 
                                '&:hover': { bgcolor: '#2563eb' } 
                            }}
                        >
                            Add Column
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ 
                                    '& th': { 
                                        fontWeight: '600', 
                                        backgroundColor: '#f8fafc', 
                                        color: '#475569', 
                                        borderBottom: '2px solid #e5e7eb' 
                                    } 
                                }}>
                                    <TableCell sx={{ width: '80px' }}>S.No</TableCell>
                                    <TableCell>Column Name</TableCell>
                                    <TableCell>Column Type</TableCell>
                                    <TableCell>Column Date Type</TableCell>
                                    <TableCell>Is Visible</TableCell>
                                    <TableCell>Created Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {columnsLoading ? (
                                    // Loading skeletons
                                    Array.from(new Array(5)).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell align="right"><Skeleton variant="rectangular" width={100} height={30} /></TableCell>
                                        </TableRow>
                                    ))
                                ) : activeColumns.length > 0 ? (
                                    activeColumns
                                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                        .map((column, index) => (
                                        <StyledTableRow key={column.column_pid}>
                                            <TableCell><strong>{page * rowsPerPage + index + 1}</strong></TableCell>
                                            <TableCell component="th" scope="row">
                                                <strong>{column.column_name}</strong>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={column.column_type}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: column.column_type === 'Default' ? '#dbeafe' : '#f0f9ff',
                                                        color: column.column_type === 'Default' ? '#1e40af' : '#0c4a6e',
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </TableCell>
                                             <TableCell>
                                                {column.column_data_type ? (
                                                    <>
                                                        {column.column_data_type}
                                                    </>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={column.column_is_visible === 1 ? 'Yes' : 'No'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: column.column_is_visible === 1 ? '#d1fae5' : '#fef2f2',
                                                        color: column.column_is_visible === 1 ? '#065f46' : '#991b1b',
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {column.column_created_at ? (
                                                    <>
                                                        {new Date(column.column_created_at).toLocaleDateString()}<br />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {new Date(column.column_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </>
                                                ) : '-'}
                                            </TableCell>
                                      
                                            <TableCell>
                                                <Chip
                                                    label={column.column_is_delete}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: column.column_is_delete === 'Active' ? '#d1fae5' : '#fee2e2',
                                                        color: column.column_is_delete === 'Active' ? '#065f46' : '#991b1b',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton
                                                    aria-label="actions"
                                                    onClick={(event) => handleMenuOpen(event, column)}
                                                >
                                                    <MoreVertIcon />
                                                </IconButton>
                                            </TableCell>
                                        </StyledTableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center">
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                alignItems: 'center', 
                                                p: 6, 
                                                color: 'text.secondary' 
                                            }}>
                                                <Typography variant="h6">No Columns Found</Typography>
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    Click "Add Column" to create your first column
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={activeColumns.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>

                {/* Actions Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    PaperProps={{
                        elevation: 3,
                        sx: {
                            overflow: 'visible',
                            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                            mt: 1.5,
                        },
                    }}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                >
                    {selectedColumn?.column_type === 'Manual' ? (
                        [
                            <MenuItem key="edit" onClick={() => {
                                handleMenuClose();
                                handleOpenEditDialog(selectedColumn);
                            }}>
                                <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
                                <ListItemText>Edit</ListItemText>
                            </MenuItem>,
                            <MenuItem key="delete" onClick={() => {
                                handleMenuClose();
                                handleOpenDeleteDialog(selectedColumn);
                            }}>
                                <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                                <ListItemText>Delete</ListItemText>
                            </MenuItem>
                        ]
                    ) : (
                        <Tooltip title="Default columns cannot be edited or deleted" placement="left">
                            <span>
                                <MenuItem disabled>
                                    <ListItemIcon><NotInterestedIcon fontSize="small" /></ListItemIcon>
                                    <ListItemText>Edit / Delete</ListItemText>
                                </MenuItem>
                            </span>
                        </Tooltip>
                    )}
                </Menu>

                {/* Add/Edit Column Dialog */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {selectedColumn ? 'Edit Column' : 'Add New Column'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <TextField
                                fullWidth
                                label="Column Name"
                                name="column_name"
                                value={formData.column_name}
                                onChange={handleInputChange}
                                margin="normal"
                                required
                                error={!!errors.column_name}
                                helperText={errors.column_name}
                                placeholder="Enter column name"
                                autoFocus
                            />
                            
                            <FormControl 
                                fullWidth 
                                margin="normal" 
                                required 
                                error={!!errors.column_type}
                                disabled={selectedColumn && selectedColumn.column_type === 'Default'}>
                                <InputLabel>Column Type</InputLabel>
                                <Select
                                    name="column_type"
                                    value={formData.column_type}
                                    onChange={handleInputChange}
                                    label="Column Type"
                                >
                                    <MenuItem value="Default">Default</MenuItem>
                                    <MenuItem value="Manual">Manual</MenuItem>
                                </Select>
                                {errors.column_type && (
                                    <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                                        {errors.column_type}
                                    </Typography>
                                )}
                            </FormControl>

                            <FormControl
                                fullWidth
                                margin="normal"
                                required
                                error={!!errors.column_data_type}
                            >
                                <InputLabel>Data Type</InputLabel>
                                <Select
                                    name="column_data_type"
                                    value={formData.column_data_type}
                                    onChange={handleInputChange}
                                    label="Data Type"
                                >
                                    <MenuItem value="text">Text</MenuItem>
                                    <MenuItem value="textarea">Textarea</MenuItem>
                                    <MenuItem value="dropdown">Dropdown</MenuItem>
                                    <MenuItem value="number">Number</MenuItem>
                                </Select>

                               {formData.column_data_type === "dropdown" && (
    <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Dropdown Options
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
                fullWidth
                size="small"
                placeholder="Type option and press Add"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
            />
            <Button
                variant="contained"
                onClick={() => {
                    if (optionInput.trim()) {
                        setDropdownOptions([...dropdownOptions, optionInput.trim()]);
                        setOptionInput("");
                    }
                }}
            >
                Add
            </Button>
        </Box>

        <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
            {dropdownOptions.map((opt, index) => (
                <Chip
                    key={index}
                    label={opt}
                    onDelete={() =>
                        setDropdownOptions(dropdownOptions.filter((_, i) => i !== index))
                    }
                />
            ))}
        </Box>
    </Box>
)}



                                {errors.column_data_type && (
                                    <Typography
                                        variant="caption"
                                        color="error"
                                        sx={{ mt: 0.5, display: 'block' }}
                                    >
                                        {errors.column_data_type}
                                    </Typography>
                                )}
                            </FormControl>

                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button 
                            onClick={handleCloseDialog} 
                            sx={{ color: '#64748b' }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSubmit} 
                            variant="contained"
                            disabled={isLoading}
                            sx={{ 
                                boxShadow: 'none', 
                                width: '90px', 
                                bgcolor: '#10b981', 
                                '&:hover': { bgcolor: '#059669' } 
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : (selectedColumn ? 'Update' : 'Add')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog 
                    open={deleteDialogOpen} 
                    onClose={handleCloseDeleteDialog}
                    PaperProps={{
                        sx: { borderRadius: 3 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        Confirm Deletion
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete the column "<strong>{selectedColumn?.column_name}</strong>"?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This action will mark the column as inactive.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button 
                            onClick={handleCloseDeleteDialog}
                            sx={{ color: '#64748b' }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleDelete} 
                            variant="contained"
                            disabled={isLoading}
                            sx={{ 
                                boxShadow: 'none', 
                                width: '90px', 
                                bgcolor: '#ef4444', 
                                '&:hover': { bgcolor: '#dc2626' } 
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Snackbar for notifications */}
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

export default Columns;