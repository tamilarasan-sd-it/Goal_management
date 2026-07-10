// d:\GOAL_NEW_VERSION\frontend_ui\src\views\template\template.jsx
import React, { useEffect, useMemo, useState } from 'react';
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
    List, ListItem, Divider,
    TablePagination
} from '@mui/material';
import { Switch } from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility'; // Added for the new 'View' option
import PublishIcon from '@mui/icons-material/Publish'; // Import for the new Release button
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListOff from '@mui/icons-material/FilterListOff';
import { createSelector } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, addAction, updateAction, deleteAction, fetchByIdAction } from '../../StoreRedux/actions/commonActions';
import { EyeIcon, EyeOffIcon, ViewIcon } from 'lucide-react';
import { TemplateViewScreen } from './TemplateViewScreen';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
        backgroundColor: '#f8fafc'
    }
}));

const getPageData = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const templatesPage = pages?.templates || {};
        const employeesPage = pages?.employees || {};
        const templateCategoriesPage = pages?.templateCategories || {};
        const categoryPage = pages?.category || {};
        const columnsPage = pages?.columns || {};


        const templatesRawData = templatesPage?.data?.TemplatesData;
        const templatesData = Array.isArray(templatesRawData)
            ? templatesRawData
            : templatesRawData ? [templatesRawData] : [];

        const templateDetailsData = templatesPage?.data?.TemplateDetailsData || [];


        const positionsData = employeesPage?.data?.PositionsData || [];
        const employeesByPositionData = pages?.employees?.data?.EmployeesByPositionData || [];
        // const categoriesData = templateCategoriesPage?.data?.CategoriesData || [];


        const categoriesRawData = categoryPage?.data?.CategoryData;
        const categoriesData = Array.isArray(categoriesRawData)
            ? categoriesRawData
            : categoriesRawData ? [categoriesRawData] : [];

        const columnsRawData = columnsPage?.data?.ColumnsData;
        const columnsData = Array.isArray(columnsRawData)
            ? columnsRawData
            : columnsRawData ? [columnsRawData] : [];


        return {
            templatesLoading: templatesPage?.loading?.TemplatesLoad || false,
            categoriesLoading: templateCategoriesPage?.loading?.CategoriesLoad || false,
            columnsLoading: columnsPage?.loading?.ColumnsLoad || false,
            templatesData,
            templateDetailsData,
            categories: Array.isArray(categoriesData) ? categoriesData : [],
            columns: Array.isArray(columnsData) ? columnsData : [],
            positions: Array.isArray(positionsData) ? positionsData : [],
            employeesByPosition: employeesByPositionData
        };
    }
);

const getAuthData = createSelector(
    state => state.auth, // Assuming 'auth' slice holds user info
    (auth) => ({
        loggedInUser: auth?.user || null
    })
);

const SortableColumnItem = ({ id, column, onToggle, isEnabled }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        boxShadow: isDragging
            ? '0px 10px 15px -3px rgba(0,0,0,0.1), 0px 4px 6px -2px rgba(0,0,0,0.05)'
            : '0px 1px 3px rgba(0,0,0,0.1)',
    };

    const isDefault = column.column_type === 'Default';

    return (
        <Paper
            ref={setNodeRef}
            style={style}
            elevation={0}
            sx={(theme) => ({
                display: 'flex',
                alignItems: 'center',
                p: 1.5,
                mb: 1.5,
                borderRadius: '8px',
                backgroundColor: isDefault ? 'primary.lightest' : 'white',
                userSelect: 'none',
                borderLeft: isDefault
                    ? `4px solid ${theme.palette.primary.main}`
                    : 'none',
                ...(isDefault && { pl: 1 }),
            })}
        >
            <Box {...attributes} {...listeners} sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'text.secondary', mr: 1.5 }}>
                <DragIndicatorIcon />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1" fontWeight="600">{column.column_name}</Typography>
            </Box>
            {isDefault ? (
                <Typography variant="body2" color="primary.dark" fontWeight="600" sx={{ mr: 1.5, fontStyle: 'italic' }}>
                    Default Question
                </Typography>
            ) : (
                <Chip
                    label={column.column_type || 'N/A'}
                    size="small"
                    variant='outlined'
                    sx={{ fontWeight: 500, mr: 1.5 }}
                />
            )}
            <Switch
                checked={isEnabled}
                disabled={column.column_type === 'Default'}
                onChange={(e) => onToggle(id, e.target.checked)}
            />
        </Paper>
    );
};


const SortableCategoryRow = ({ id, category, isSelected, onToggle }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 2 : 1,
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? '0px 4px 12px rgba(0,0,0,0.15)' : 'none',
        display: 'table-row',
    };

    return (
        <TableRow ref={setNodeRef} style={style} hover selected={isSelected}>
            <TableCell padding="checkbox">
                <Checkbox
                    checked={isSelected}
                    onClick={() => onToggle(category.category_pid)}
                />
            </TableCell>
            <TableCell component="th" scope="row">{category.category_name}</TableCell>
            <TableCell padding="checkbox">
                <Box
                    {...attributes}
                    {...listeners}
                    sx={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'text.secondary' }}
                >
                    <DragIndicatorIcon fontSize="small" />
                </Box>
            </TableCell>
        </TableRow>
    );
};

// New component for rendering the template preview content
const TemplatePreviewContent = ({ templateData, categories, employeesByPosition }) => {
    // Ensure templateData is not null or undefined before accessing its properties
    if (!templateData) {
        return <Typography>No template data available for preview.</Typography>;
    }

    // Find the assigned employee details from employeesByPosition based on templateData.assigned_employee
    const assignedEmployeeDetails = employeesByPosition.find(e => e.employee_id === templateData.assigned_employee);

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
                            <Typography variant="body1" fontWeight="500" gutterBottom>{templateData.year}</Typography>
                        </Box>
                        {/* <Box mt={2}>
                            <Typography variant="body2" color="text.secondary">Assigned Position</Typography>
                            <Typography variant="body1" fontWeight="500" gutterBottom>{templateData.assigned_position || 'N/A'}</Typography>
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
                                                <TableCell align="right">{cat.weightage || 0}%</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow sx={{ '& > td': { borderTop: '1px solid #e2e8f0' } }}>
                                            <TableCell colSpan={5} component="th" scope="row" align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                                {templateData.categories.reduce((sum, cat) => sum + (Number(cat.weightage) || 0), 0)}%
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
                        {templateData.columns && templateData.columns.filter(c => c.is_active_in_template).length > 0 ? (
                            <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                                {templateData.columns.filter(c => c.is_active_in_template).map((col, index) => (
                                    <React.Fragment key={col.column_pid}>
                                        <ListItem>
                                            <ListItemText
                                                primary={`${index + 1}. ${col.column_name}`}
                                                secondary={`Type: ${col.column_type}`}
                                            />
                                        </ListItem>
                                        {index < templateData.columns.filter(c => c.is_active_in_template).length - 1 && <Divider component="li" />}
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

const Templates = () => {
    const dispatch = useDispatch();
    const [openDialog, setOpenDialog] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [releaseDialogOpen, setReleaseDialogOpen] = useState(false); // New state for release confirmation
    const [viewDialogOpen, setViewDialogOpen] = useState(false); // New state for view dialog
    const [isLoading, setIsLoading] = useState(false);

    // Stepper state
    const [activeStep, setActiveStep] = useState(0);
    const steps = ['Template Info', 'Select Categories', 'Categories', 'Configure Columns', 'Preview & Create'];

    // Menu state
    const [anchorEl, setAnchorEl] = useState(null);
    const [categoryPool, setCategoryPool] = useState([]);
    const [categorySearchTerm, setCategorySearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        template_name: '',
        year: '',
        assigned_position: '',
        assigned_employee: '', // This will store employee_id
        selected_categories: [], // { category_pid, weightage }
        selected_columns: []
    });

    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const [filters, setFilters] = useState({
        templateName: null,
        year: null,
        createdDate: '',
        status: null,
    });

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Get data from Redux store
    const {
        templatesLoading,
        templatesData,
        templateDetailsData,
        categories,
        categoriesLoading,
        columns,
        columnsLoading,
        positions,
        employeesByPosition,
    } = useSelector(getPageData);




    const { loggedInUser } = useSelector(getAuthData);
    // console.log(loggedInUser, "loggedInUser")
    // Select active templates
    const activeTemplates = useMemo(() => templatesData.filter(col => col.template_is_delete === 'Active'), [templatesData]);


    // Pagination handlers
    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            templateName: null,
            year: null,
            createdDate: '',
            status: null,
        });
    };

    const filteredTemplates = useMemo(() => {
        return activeTemplates.filter(template => {
            const createdDate = template.template_created_date ? new Date(template.template_created_date).toISOString().split('T')[0] : null;
            return (
                (!filters.templateName || template.template_name === filters.templateName) &&
                (!filters.year || template.template_year === filters.year) &&
                (!filters.createdDate || createdDate === filters.createdDate) &&
                (!filters.status || template.template_status === filters.status)
            );
        });
    }, [activeTemplates, filters]);

    const filterOptions = useMemo(() => {
        const uniqueValues = (key) => [...new Set(activeTemplates.map(item => item[key]).filter(Boolean))];
        return {
            templateNames: uniqueValues('template_name'),
            years: uniqueValues('template_year').sort((a, b) => b - a), // Sort years descending
            statuses: uniqueValues('template_status'),
        };
    }, [activeTemplates]);

    // Set initial columns for ordering when data is loaded
    useEffect(() => {
        // When the dialog opens (and not in edit mode), initialize the columns for ordering
        // console.log(columns,"columnscolumnscolumns") // Removed console.log

        if (openDialog && !selectedTemplate && columns.length > 0) {
            const activeColumns = columns.filter(c => c.column_is_delete === 'Active').sort((a, b) => a.column_order - b.column_order);
            setFormData(prev => ({
                ...prev, selected_columns: activeColumns.map(c => ({
                    ...c,
                    is_active_in_template: c.column_type === 'Default'
                }))
            }));
        }
    }, [columns, openDialog, selectedTemplate]);

    useEffect(() => {
        // Fetch templates
        dispatch(setLoading("templates", "TemplatesLoad", true));
        dispatch(fetchAction('application/json', "templates", "TemplatesData", "TemplatesLoad"));
        // Fetch employee positions
        // dispatch(setLoading("employees", "PositionsLoad", true));
        // dispatch(fetchAction('application/json', "employees", "PositionsData", "PositionsLoad"));
        // Fetch template categories
        dispatch(setLoading("category", "categoryLoad", true));
        dispatch(fetchAction('application/json', "category", "CategoryData", "categoryLoad"));
        // Fetch columns
        dispatch(setLoading("columns", "ColumnsLoad", true));
        dispatch(fetchAction('application/json', "columns", "ColumnsData", "ColumnsLoad"));
    }, [dispatch]);

    // Handle menu open/close
    const handleMenuOpen = (event, template) => {
        setAnchorEl(event.currentTarget);
        setSelectedTemplate(template);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedTemplate(null);
    };

    // Handle dialog open/close
    const handleOpenAddDialog = () => {
        setActiveStep(0);
        setOpenDialog(true);
        setFormData({
            template_name: '',
            year: new Date().getFullYear(),
            assigned_position: '',
            assigned_employee: '',
            selected_categories: [],
            selected_columns: []
        });
        setCategoryPool([]);
        setCategorySearchTerm('');
        setErrors({});
    };

    const handleOpenEditDialog = async (template) => {
        setSelectedTemplate(template);
        setActiveStep(0);

        // Fetch full template details to populate the stepper
        dispatch(setLoading("templates", "TemplateDetailsLoad", true));
        await dispatch(fetchByIdAction('application/json', "templates", "TemplateDetailsData", "TemplateDetailsLoad", template.template_pid));
        // The data will be in templateDetailsData, need to watch for it and then set form.

        setOpenDialog(true);
        setErrors({});
    };

    useEffect(() => {
        if (selectedTemplate && templateDetailsData && templateDetailsData.template_pid === selectedTemplate.template_pid) {
            const pool = (templateDetailsData.categories || []).map(c => c.category_pid);
            setCategoryPool(pool);


            const activeColumns = columns.filter(c => c.column_is_delete === 'Active').sort((a, b) => a.column_order - b.column_order);
            const templateColumns = templateDetailsData.columns || [];
            const mergedColumns = activeColumns.map(col => {
                const found = templateColumns.find(tc => tc.column_pid === col.column_pid);
                return { ...col, is_active_in_template: !!found, column_order: found ? found.column_order : col.column_order };
            }).sort((a, b) => a.column_order - b.column_order);

            setFormData({
                template_name: templateDetailsData.template_name,
                year: templateDetailsData.template_year,
                selected_categories: (templateDetailsData.categories || []).map(cat => ({
                    ...cat,
                    weightage: cat.tc_max_weightage, // Map tc_max_weightage to weightage
                })),
                selected_columns: mergedColumns,
            });
        }
    }, [templateDetailsData, selectedTemplate, columns]);

    const handleOpenAssignDialog = () => {
        setAssignDialogOpen(true);
        setFormData(prev => ({
            ...prev,
            assigned_position: '',
            assigned_employee: '',
        }));
        setErrors({});
    };

    const handleCloseAssignDialog = () => {
        setAssignDialogOpen(false);
        setFormData(prev => ({ ...prev, assigned_position: '', assigned_employee: '' }));
        setErrors({});
        // Don't reset selectedTemplate here if menu is still open
    };

    const handleAssignSubmit = () => {
        const newErrors = {};
        if (!formData.assigned_position) {
            newErrors.assigned_position = 'Position is required';
        }
        if (!formData.assigned_employee) {
            newErrors.assigned_employee = 'Employee is required';
        }
        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsLoading(true);
            const updatedTemplate = {
                ...selectedTemplate,
                template_assigned_position: formData.assigned_position,
                template_assigned_to_user_id: formData.assigned_employee,
                template_assigned_to_reviewer_id: employeesByPosition.find(
                    (e) => e.employee_id === formData.assigned_employee
                )?.reporting_manager_id || null,
                template_modified_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                template_status: 'Assigned'
            };

            dispatch(setLoading("templates", "TemplatesLoad", true));
            dispatch(updateAction('application/json', "templates", "TemplatesData", "TemplatesLoad", 'assignTemplate', updatedTemplate));
            // setSnackbar({ open: true, message: 'Template assigned successfully!', severity: 'success' });
            setIsLoading(false);
            handleCloseAssignDialog();
        }
    };

    const handleCloseDialog = () => {
        setActiveStep(0);
        setOpenDialog(false);
        setSelectedTemplate(null);
        setEditFormData({
            template_name: '',
        });
        setCategoryPool([]);
        setCategorySearchTerm('');
        setErrors({});
    };

    // New handler for opening the view dialog
    const handleOpenViewDialog = async (template) => {
        if (!template || !template.template_pid) {
            // setSnackbar({ open: true, message: 'Invalid template selected.', severity: 'error' });
            return;
        }

        // Dispatch an action to fetch the full template details
        dispatch(setLoading("templates", "TemplateDetailsLoad", true));
        dispatch(fetchByIdAction('application/json', "templates", "TemplateDetailsData", "TemplateDetailsLoad", template.template_pid));

        if (template?.template_assigned_position) {
            dispatch(setLoading("employees", "EmployeesByPositionLoad", true));
            dispatch(fetchByIdAction('application/json', "employees", "EmployeesByPositionData", "EmployeesByPositionLoad", template.template_assigned_position));
        }

        dispatch(setLoading("category", "categoryLoad", true));
        dispatch(fetchAction('application/json', "category", "CategoryData", "categoryLoad"));
        setViewDialogOpen(true);
    };

    const handleCloseViewDialog = () => {
        setViewDialogOpen(false);
        setSelectedTemplate(null);
    };

    const handleOpenReleaseDialog = (template) => {
        setSelectedTemplate(template);
        setReleaseDialogOpen(true);
    };

    const handleCloseReleaseDialog = () => {
        setReleaseDialogOpen(false);
        setSelectedTemplate(null);
    };

    const handleReleaseTemplate = () => {
        setIsLoading(true);
        const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const dataToSend = {
            template_pid: selectedTemplate.template_pid,
            template_status: 'Finalized',
            template_modified_at: currentTimestamp
        };


        dispatch(setLoading("templates", "TemplatesLoad", true));
        dispatch(updateAction('application/json', "templates", "TemplatesData", "TemplatesLoad", 'updateStatus', dataToSend));

        setSnackbar({
            open: true,
            message: 'Template Finalized successfully!',
            severity: 'success'
        });

        setIsLoading(false);
        handleCloseReleaseDialog();
    };




    // Handle delete dialog
    const handleOpenDeleteDialog = (template) => {
        setSelectedTemplate(template);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setSelectedTemplate(null);
    };

    // Handle form input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }
    };

    useEffect(() => {
        if (activeStep === 2) {
            setFormData(prev => ({
                ...prev,
                selected_categories: categoryPool.map(pid => {
                    const existing = prev.selected_categories.find(sc => sc.category_pid === pid);
                    return existing || { category_pid: pid, weightage: '', tc_kpi_metric: '', tc_target: '', tc_category_description: '' };
                })
            }));
        }
    }, [activeStep, categoryPool]);

    const handleCategoryDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
        setCategoryPool(prev => {
            const oldIndex = prev.indexOf(active.id);
            const newIndex = prev.indexOf(over.id);
            // Only reorder if both are in the selected pool
            if (oldIndex !== -1 && newIndex !== -1) {
                return arrayMove(prev, oldIndex, newIndex);
            }
            return prev;
        });
    }
};

    const handleCategoryPoolSelection = (categoryPid) => {
        setCategoryPool(prev => {
            const newPool = prev.includes(categoryPid)
                ? prev.filter(pid => pid !== categoryPid)
                : [...prev, categoryPid];

            // When a category is removed from the pool, also remove it from the final selection
            if (!newPool.includes(categoryPid)) {
                setFormData(currentFormData => ({
                    ...currentFormData,
                    selected_categories: currentFormData.selected_categories.filter(c => c.category_pid !== categoryPid)
                }));
            }
            return newPool;
        });
    };
    const handleCategorySelection = (categoryPid) => {
        setFormData(prev => {
            const isSelected = prev.selected_categories.some(c => c.category_pid === categoryPid);
            if (isSelected) {
                // If it's already selected, unselect it and remove it
                return {
                    ...prev,
                    selected_categories: prev.selected_categories.filter(c => c.category_pid !== categoryPid)
                };
            } else {
                // If it's not selected, add it with a default weightage of ''
                return {
                    ...prev,
                    selected_categories: [...prev.selected_categories, {
                        category_pid: categoryPid,
                        weightage: '',
                        tc_kpi_metric: '',
                        tc_target: '',
                        tc_category_description: ''
                    }]
                };
            }
        });
    };

    const handleWeightageChange = (categoryPid, value) => {
        // Allow only positive numbers between 1 and 100
        const numValue = Math.max(0, Math.min(100, Number(value)));

        setFormData(prev => {
            const isSelected = prev.selected_categories.some(c => c.category_pid === categoryPid);
            let newSelectedCategories;

            if (isSelected) {
                newSelectedCategories = prev.selected_categories.map(c =>
                    c.category_pid === categoryPid ? { ...c, weightage: numValue || '' } : c
                );
            } else {
                // If not selected, add it to the selection with the new weightage
                newSelectedCategories = [...prev.selected_categories, {
                    category_pid: categoryPid,
                    weightage: numValue || '',
                    tc_kpi_metric: '',
                    tc_target: '',
                    tc_category_description: ''
                }];
            }

            return { ...prev, selected_categories: newSelectedCategories };
        });
    };

    const handleCategoryInputChange = (categoryPid, fieldName, value) => {
        setFormData(prev => {
            const newSelectedCategories = prev.selected_categories.map(c =>
                c.category_pid === categoryPid ? { ...c, [fieldName]: value } : c
            );
            if (!newSelectedCategories.some(c => c.category_pid === categoryPid)) {
                newSelectedCategories.push({ category_pid: categoryPid, [fieldName]: value });
            }

            return { ...prev, selected_categories: newSelectedCategories };
        });
    };

    const handleSelectAllCategories = (event) => {
        setFormData(prev => {
            if (event.target.checked) {
                const allSelected = categories.map(c => ({
                    category_pid: c.category_pid,
                    weightage: '',
                    tc_kpi_metric: '',
                    tc_target: '',
                    tc_category_description: ''
                }));
                return { ...prev, selected_categories: allSelected };
            }
            // If unchecked, clear the selection
            return { ...prev, selected_categories: [] };
        });
    };

    const handleAutocompleteChange = (name, value) => {
        const targetData = selectedTemplate ? editFormData : formData;
        setFormData({
            ...targetData,
            [name]: value || '',
            // Clear assigned_employee when position changes
            ...(name === 'assigned_position' && { assigned_employee: '' }),
        });
        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: ''
            });
        }

        // If a position is selected, fetch employees for that position
        if (name === 'assigned_position' && value) {

            dispatch(setLoading("employees", "EmployeesByPositionLoad", true));
            dispatch(fetchByIdAction('application/json', "employees", "EmployeesByPositionData", "EmployeesByPositionLoad", value));
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event) => {
        const { active, over, context } = event;

        if (over && active.id !== over.id) {
            if (context === 'columns') {
                setFormData((prev) => {
                    const oldIndex = prev.selected_columns.findIndex(c => c.column_pid === active.id);
                    const newIndex = prev.selected_columns.findIndex(c => c.column_pid === over.id);
                    return {
                        ...prev,
                        selected_columns: arrayMove(prev.selected_columns, oldIndex, newIndex)
                    };
                });
            }
        }
    };

    const handleColumnToggle = (columnPid, isEnabled) => {
        setFormData(prev => ({
            ...prev,
            selected_columns: prev.selected_columns.map(c =>
                c.column_pid === columnPid ? { ...c, is_active_in_template: isEnabled } : c
            )
        }));
    };

    // Validate form
    const validateForm = (isSubmit = false) => {
        const newErrors = {};
        const data = formData;

        if (!data.template_name.trim()) {
            newErrors.template_name = 'Template name is required';
        } else if (data.template_name.length > 255) {
            newErrors.template_name = 'Template name cannot exceed 255 characters';
        }

        const normalize = (str = '') =>
            str
                .trim()
                .toLowerCase()
                .replace(/\s+/g, ' ');

        // Unified check for duplicate template name based on name and year
        const duplicate = activeTemplates.find(template => {

            const isSameName = normalize(template.template_name) === normalize(data.template_name);
            const isSameYear = template.template_year == data.year;


            // If editing, exclude the current template from the check
            if (selectedTemplate) {
                return isSameName && isSameYear && template.template_pid !== selectedTemplate.template_pid;
            }

            // If creating, check all active templates
            return isSameName && isSameYear;
        });
        console.log(duplicate, "duplicate");

        if (duplicate) {
            newErrors.template_name = `A template with this name already exists for ${data.year}.`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = () => {
        if (validateForm(true)) {
            setIsLoading(true);

            if (selectedTemplate) {
                // Update existing template
                const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
                const updatedTemplate = {
                    template_pid: selectedTemplate.template_pid,
                    template_name: formData.template_name.trim(),
                    year: formData.year,
                    template_modified_at: currentTimestamp,
                    template_created_by: loggedInUser?.id,
                    template_status : selectedTemplate.template_status,
                    categories: formData.selected_categories.map((cat, index) => ({
                        ...cat,
                        tc_order: index + 1
                    })),
                    columns: formData.selected_columns
                        .filter(c => c.is_active_in_template)
                        .map((col, index) => ({
                            column_pid: col.column_pid,
                            column_order: index + 1
                        })),
                };

                console.log('Update data:', updatedTemplate);

                dispatch(setLoading("templates", "TemplatesLoad", true));
                dispatch(updateAction('application/json', "templates", "TemplatesData", "TemplatesLoad", 'updateTemplate', updatedTemplate));

                setSnackbar({
                    open: true,
                    message: 'Template updated successfully!',
                    severity: 'success'
                });
            } else {
                // Add new template
                const newTemplateOrder = templatesData.length > 0
                    ? Math.max(...templatesData.map(col => col.template_order)) + 1
                    : 1;
                const currentTimestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');

                const newTemplate = {
                    template_name: formData.template_name.trim(),
                    year: formData.year,
                    assigned_position: formData.assigned_position,
                    assigned_employee: formData.assigned_employee,
                    template_created_by: loggedInUser?.id,
                    template_assigned_to_reviewer_id: employeesByPosition.find(
                        (e) => e.employee_id === formData.assigned_employee
                    )?.reporting_manager_id || null,
                    categories: formData.selected_categories.map((cat, index) => ({
                        ...cat,
                        tc_order: index + 1
                    })),
                    columns: formData.selected_columns.filter(c => c.is_active_in_template).map((col, index) => ({
                        column_pid: col.column_pid,
                        column_order: index + 1
                    })),
                    template_order: newTemplateOrder,
                    template_created_date: currentTimestamp,
                    template_modified_at: currentTimestamp,
                    template_is_delete: 'Active'
                };

                dispatch(setLoading("templates", "TemplatesLoad", true));
                dispatch(addAction('application/json', "templates", "TemplatesData", "TemplatesLoad", newTemplate));

                setSnackbar({
                    open: true,
                    message: 'Template added successfully!',
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

        const templateToDelete = {
            ...selectedTemplate,
            template_is_delete: 'In Active',
        };
        dispatch(setLoading("templates", "TemplatesLoad", true));
        dispatch(deleteAction('application/json', "templates", "TemplatesData", "TemplatesLoad", templateToDelete));

        setSnackbar({
            open: true,
            message: 'Template deleted successfully!',
            severity: 'warning'
        });

        setIsLoading(false);
        handleCloseDeleteDialog();
    };

    // Handle snackbar close
    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    // Stepper navigation
    const handleNext = () => {
        if (activeStep === 1) { // When moving from "Select Categories"
            if (categoryPool.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'Please select at least one category to make it available for the next step.',
                    severity: 'error'
                });
                return;
            }
        } else if (activeStep === 2) { // When moving from "Categories"
            if (formData.selected_categories.length === 0) {
                setSnackbar({
                    open: true,
                    message: 'Please select at least one category before proceeding.',
                    severity: 'error'
                });
                return; // Stop navigation
            }

            const totalWeightage = formData.selected_categories.reduce((sum, cat) => sum + (Number(cat.weightage) || 0), 0);
            if (formData.selected_categories.length > 0 && totalWeightage !== 100) {
                setSnackbar({
                    open: true,
                    message: `Total weightage must be 100%. Current total is ${totalWeightage}%.`,
                    severity: 'error'
                });
                return; // Stop navigation
            }

            const hasEmptyWeightage = formData.selected_categories.some(cat => !cat.weightage);
            if (hasEmptyWeightage) {
                setSnackbar({
                    open: true,
                    message: 'Please provide a weightage for all selected categories.',
                    severity: 'error'
                });
                return; // Stop navigation
            }
        }
        // Add validation for step 0 before proceeding to step 1
        if (activeStep === 0 && !validateForm(false)) {
            setSnackbar({ open: true, message: 'Please correct the errors in Template Info before proceeding.', severity: 'error' });
            return;
        }

        if (validateForm(false)) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        } else {
            // Optionally show a snackbar if validation fails on other steps
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <TextField
                            fullWidth
                            label="Template Name"
                            name="template_name"
                            value={formData.template_name}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                            error={!!errors.template_name}
                            helperText={errors.template_name}
                            autoFocus
                        />
                        <Autocomplete
                            fullWidth
                            options={[new Date().getFullYear(), new Date().getFullYear() + 1]}
                            getOptionLabel={(option) => option.toString()}
                            value={formData.year || null}
                            onChange={(event, newValue) => {
                                setFormData(prev => ({ ...prev, year: newValue }));
                                if (errors.year) {
                                    setErrors(prev => ({ ...prev, year: '' }));
                                }
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Year"
                                    margin="normal"
                                    required
                                    error={!!errors.year}
                                    helperText={errors.year} />
                            )}
                        />
                        {/* <Autocomplete
                            fullWidth
                            options={positions}
                            getOptionLabel={(option) => option}
                            value={formData.assigned_position || null}
                            onChange={(event, newValue) => {
                                handleAutocompleteChange('assigned_position', newValue);
                            }}
                            ListboxProps={{
                                style: {
                                    maxHeight: 200,
                                },
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Assigned Position" margin="normal" required />
                            )}
                        /> */}
                        {formData.assigned_position && (
                            <Autocomplete
                                fullWidth
                                options={employeesByPosition}
                                getOptionLabel={(option) => option.emp_name || ''}
                                value={employeesByPosition.find(emp => emp.employee_id === formData.assigned_employee) || null}
                                onChange={(event, newValue) => {
                                    handleAutocompleteChange('assigned_employee', newValue ? newValue.employee_id : '');
                                }}
                                ListboxProps={{
                                    style: { maxHeight: 200 },
                                }}
                                renderInput={(params) => (
                                    <TextField {...params} label={`${formData.assigned_position} list`} margin="normal" required />
                                )}
                            />
                        )}
                        {formData.assigned_employee && (
                            <TextField
                                fullWidth
                                label="Reviewer"
                                value={
                                    employeesByPosition.find(emp => emp.employee_id === formData.assigned_employee)?.reporting_manager_name || 'N/A'
                                }
                                margin="normal"
                                InputProps={{
                                    readOnly: true,
                                }}
                            />
                        )}
                    </Box>
                );
            case 1:
                // const availableCategoriesForPool = categories
                //     .filter(c => c.category_is_delete === 'Active')
                //     .filter(c => categoryPool.includes(c.category_pid) || c.category_name.toLowerCase().includes(categorySearchTerm.toLowerCase()));
                const activeCategories = categories.filter(c => c.category_is_delete === 'Active');
                const searchFiltered = activeCategories.filter(c =>
                    categoryPool.includes(c.category_pid) || c.category_name.toLowerCase().includes(categorySearchTerm.toLowerCase())
                );
                // Show selected categories in the order they were checked, then unselected ones below
                const selectedInOrder = categoryPool
                    .map(pid => searchFiltered.find(c => c.category_pid === pid))
                    .filter(Boolean);
                const unselected = searchFiltered.filter(c => !categoryPool.includes(c.category_pid));
                const availableCategoriesForPool = [...selectedInOrder, ...unselected];
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Select Categories</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Select the categories you want to include in this template. Only selected categories will appear in the next step.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <TextField
                                fullWidth
                                label="Search Categories"
                                variant="outlined"
                                value={categorySearchTerm}
                                onChange={(e) => setCategorySearchTerm(e.target.value)}
                                sx={{ mb: 2 }} />
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox" sx={{ backgroundColor: 'background.paper' }}></TableCell>
                                        <TableCell sx={{ backgroundColor: 'background.paper' }}>Category Name</TableCell>
                                        <TableCell padding="checkbox" sx={{ backgroundColor: 'background.paper' }}></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categoriesLoading ? (
                                        Array.from(new Array(5)).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                                                <TableCell><Skeleton variant="text" /></TableCell>
                                                <TableCell />
                                            </TableRow>
                                        ))
                                    ) : (
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleCategoryDragEnd}
                                        >
                                            <SortableContext
                                                items={availableCategoriesForPool.map(c => c.category_pid)}
                                                strategy={verticalListSortingStrategy}
                                            >
                                                {availableCategoriesForPool.map((category) => (
                                                    <SortableCategoryRow
                                                        key={category.category_pid}
                                                        id={category.category_pid}
                                                        category={category}
                                                        isSelected={categoryPool.includes(category.category_pid)}
                                                        onToggle={handleCategoryPoolSelection}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Categories</Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ backgroundColor: 'background.paper' }}>Category Name</TableCell>
                                        <TableCell sx={{ backgroundColor: 'background.paper' }} align="right">Weightage (%)</TableCell>
                                        <TableCell sx={{ backgroundColor: 'background.paper' }}>KPI/Metric</TableCell>
                                        <TableCell sx={{ backgroundColor: 'background.paper' }}>Target</TableCell>
                                        <TableCell sx={{ backgroundColor: 'background.paper' }}>Description</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {categoriesLoading ? (
                                        Array.from(new Array(5)).map((_, index) => (
                                            <TableRow key={index}>
                                                <TableCell><Skeleton variant="text" /></TableCell>
                                                <TableCell><Skeleton variant="text" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : categoryPool.map(pid => categories.find(c => c.category_pid === pid)).filter(Boolean).map((category) => {
                                        const selectedCategoryData = formData.selected_categories.find(c => c.category_pid === category.category_pid);
                                        return (
                                            <TableRow key={category.category_pid}>
                                                <TableCell component="th" scope="row">{category.category_name}</TableCell>
                                                <TableCell align="right">
                                                  <TextField
                                                    type="number"
                                                    size="small"
                                                    sx={{ width: '100px' }}
                                                    value={selectedCategoryData?.weightage || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        // Only allow integers (no decimals)
                                                        if (value === '' || /^\d+$/.test(value)) {
                                                            handleWeightageChange(category.category_pid, value);
                                                        }
                                                    }}
                                                    onWheel={(e) => e.target.blur()} // Prevent scroll change
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                                            e.preventDefault(); // Prevent arrow key increment/decrement
                                                        }
                                                        if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E') {
                                                            e.preventDefault(); // Prevent decimal point and scientific notation
                                                        }
                                                    }}
                                                    onPaste={(e) => {
                                                        const pastedText = e.clipboardData.getData('text');
                                                        if (!/^\d+$/.test(pastedText)) {
                                                            e.preventDefault(); // Prevent pasting non-integer values
                                                        }
                                                    }}
                                                    inputProps={{ min: 1, max: 100, step: 1 }}
                                                />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        value={selectedCategoryData?.tc_kpi_metric || ''}
                                                        onChange={(e) => handleCategoryInputChange(category.category_pid, 'tc_kpi_metric', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        value={selectedCategoryData?.tc_target || ''}
                                                        onChange={(e) => handleCategoryInputChange(category.category_pid, 'tc_target', e.target.value)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        size="small"
                                                        value={selectedCategoryData?.tc_category_description || ''}
                                                        onChange={(e) => handleCategoryInputChange(category.category_pid, 'tc_category_description', e.target.value)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                );
            case 3:
                return (
                    <Box>
                        <Typography variant="h6" gutterBottom>Configure Columns</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            Drag and drop the columns to set their display order in the template.
                        </Typography>
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(e) => handleDragEnd({ ...e, context: 'columns' })}
                        >
                            <Box sx={{ p: 1, backgroundColor: '#f9fafb', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                                {columnsLoading ? (
                                    Array.from(new Array(4)).map((_, index) => (
                                        <Skeleton key={index} variant="rectangular" height={48} sx={{ mb: 1, borderRadius: 1 }} />
                                    ))
                                ) : (
                                    <SortableContext
                                        items={formData.selected_columns.map(c => c.column_pid)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {formData.selected_columns.map(column => (
                                            <SortableColumnItem
                                                key={column.column_pid}
                                                id={column.column_pid}
                                                column={column}
                                                isEnabled={column.is_active_in_template}
                                                onToggle={handleColumnToggle} />
                                        ))}
                                    </SortableContext>
                                )}
                            </Box>
                        </DndContext>
                    </Box>
                );
            case 4:
                return ( // Reusing the new TemplatePreviewContent component
                    <TemplatePreviewContent
                        templateData={{
                            ...formData,
                            categories: formData.selected_categories,
                            columns: formData.selected_columns,
                        }}
                        categories={categories}
                        employeesByPosition={employeesByPosition}
                    />
                );
            default:
                return 'Unknown step';
        }
    };

    return (
        <Fade in timeout={500}>
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4, backgroundColor: '#f5f5f5', p: 3, borderRadius: 2 }}>

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
                            All Templates
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAddDialog}
                            sx={{
                                borderRadius: '6px',
                                boxShadow: 'none',
                                bgcolor: '#3b82f6',
                                '&:hover': { bgcolor: '#2563eb' },
                                marginRight: '-70%'
                            }}
                        >
                            Add Template
                        </Button>
                        <Button
                            onClick={() => window.history.back()}
                            startIcon={<ArrowBackIcon />}
                            sx={{ marginLeft: '5%' }}
                        >
                            Back
                        </Button>
                    </Box>
                    
                    <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                        <Grid container spacing={2} alignItems="center">
                            <Grid item xs={12} sm={6} md={3}>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={filterOptions.years}
                                    value={filters.year}
                                    onChange={(event, newValue) => handleFilterChange('year', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Year" />}
                                    sx={{ minWidth: 200 }}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                maxHeight: 300,
                                                overflow: 'auto',
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: '#f1f1f1',
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: '#888',
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb:hover': {
                                                    background: '#555',
                                                },
                                            }
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={filterOptions.templateNames}
                                    value={filters.templateName}
                                    onChange={(event, newValue) => handleFilterChange('templateName', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Template Name" />}
                                    sx={{ minWidth: 250 }}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                maxHeight: 300,
                                                overflow: 'auto',
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: '#f1f1f1',
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: '#888',
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb:hover': {
                                                    background: '#555',
                                                },
                                            }
                                        }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="Created Date"
                                    type="date"
                                    value={filters.createdDate}
                                    onChange={(e) => handleFilterChange('createdDate', e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                    sx={{ minWidth: 200 }}
                                />
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Autocomplete
                                    fullWidth
                                    size="small"
                                    options={filterOptions.statuses}
                                    value={filters.status}
                                    onChange={(event, newValue) => handleFilterChange('status', newValue)}
                                    renderInput={(params) => <TextField {...params} label="Status" />}
                                    sx={{ minWidth: 200 }}
                                    slotProps={{
                                        paper: {
                                            sx: {
                                                maxHeight: 300,
                                                overflow: 'auto',
                                                '&::-webkit-scrollbar': {
                                                    width: '8px',
                                                },
                                                '&::-webkit-scrollbar-track': {
                                                    background: '#f1f1f1',
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                    background: '#888',
                                                    borderRadius: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb:hover': {
                                                    background: '#555',
                                                },
                                            }
                                        }
                                    }}
                                />
                            </Grid>

                            {Object.values(filters).some(v => v) && (
                                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="outlined"
                                        color="secondary"
                                        size="small"
                                        startIcon={<FilterListOff />}
                                        onClick={handleClearFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                </Grid>
                            )}
                        </Grid>
                    </Paper>
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
                                    <TableCell>Template Name</TableCell>
                                    <TableCell>Year</TableCell>
                                    {/* <TableCell>Assigned To</TableCell> */}
                                    <TableCell>Created Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    {/* <TableCell>Template Status</TableCell> */}
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {templatesLoading ? (
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
                                    ))) : filteredTemplates.length > 0 ? (
                                        filteredTemplates
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((template, index) => (
                                            <StyledTableRow key={template.template_pid}>
                                                <TableCell><strong>{page * rowsPerPage + index + 1}</strong></TableCell>
                                                <TableCell component="th" scope="row">
                                                    <strong>{template.template_name}</strong>
                                                </TableCell>
                                                <TableCell>{template.template_year}</TableCell>
                                                {/* <TableCell>{template.assigned_user_name|| '-'}</TableCell> */}
                                                <TableCell>
                                                    {template.template_created_date ? (
                                                        <>
                                                            {new Date(template.template_created_date).toLocaleDateString()}<br />
                                                        </>
                                                    ) : '-'}
                                                </TableCell>

                                                {/* <TableCell>
                                                <Chip
                                                    label={template.template_is_delete}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: template.template_is_delete === 'Active' ? '#d1fae5' : '#fee2e2',
                                                        color: template.template_is_delete === 'Active' ? '#065f46' : '#991b1b',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </TableCell> */}
                                                <TableCell>
                                                    <Chip
                                                        label={template.template_status}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: template.template_status === 'Draft' ? '#fee2e2' : '#d1fae5',
                                                            color: template.template_status === 'Draft' ? '#991b1b' : '#065f46',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        aria-label="actions"
                                                        onClick={(event) => handleMenuOpen(event, template)}
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
                                                <Typography variant="h6">No Templates Found</Typography>
                                                <Typography variant="body2" sx={{ mt: 1 }}>
                                                    Click "Add Template" to create your first template
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
                        count={filteredTemplates.length}
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
                    {selectedTemplate?.template_status === 'Draft' && [
                        <MenuItem key="edit" onClick={() => {
                            handleMenuClose();
                            handleOpenEditDialog(selectedTemplate);
                        }}>
                            <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
                            <ListItemText>Edit</ListItemText>
                        </MenuItem>,
                        <MenuItem key="delete" onClick={() => {
                            handleMenuClose();
                            handleOpenDeleteDialog(selectedTemplate);
                        }}>
                            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                            <ListItemText>Delete</ListItemText>
                        </MenuItem>,
                        <MenuItem key="release" onClick={() => {
                            handleMenuClose();
                            handleOpenReleaseDialog(selectedTemplate);
                        }}>
                            <ListItemIcon><PublishIcon fontSize="small" color="success" /></ListItemIcon>
                            <ListItemText>Finalize</ListItemText>
                        </MenuItem>

                    ]}

                    <MenuItem key="view" onClick={() => {
                        handleMenuClose();
                        handleOpenViewDialog(selectedTemplate);
                    }}>
                        <ListItemIcon><VisibilityIcon fontSize="small" color="primary" /></ListItemIcon>
                        <ListItemText>View</ListItemText>
                    </MenuItem>
                    {/* <MenuItem onClick={() => {
                        handleMenuClose();
                        handleOpenAssignDialog();
                    }}>
                        <ListItemIcon><AssignmentIndIcon fontSize="small" color="action" /></ListItemIcon>
                        <ListItemText>Assign</ListItemText>
                    </MenuItem> */}
                </Menu>

                {/* Add/Edit Template Dialog */}
                <Dialog
                    open={openDialog}
                    onClose={handleCloseDialog}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3 }
                    }}>
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {selectedTemplate ? 'Edit Template' : 'Add New Template'}
                    </DialogTitle>
                    <DialogContent sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ width: '100%', pt: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <Stepper activeStep={activeStep} alternativeLabel>
                                {steps.map((label) => (
                                    <Step key={label}>
                                        <StepLabel>{label}</StepLabel>
                                    </Step>
                                ))}
                            </Stepper>
                            <Box sx={{ mt: 3, mb: 1, flexGrow: 1 }}>
                                {getStepContent(activeStep)}
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button
                            onClick={handleCloseDialog}
                            sx={{ color: '#64748b' }}>
                            Cancel
                        </Button>
                        {activeStep > 0 && (
                            <Button onClick={handleBack} sx={{ color: '#64748b' }}>
                                Back
                            </Button>
                        )}
                        <Button
                            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
                            variant="contained"
                            disabled={isLoading}
                            sx={{
                                boxShadow: 'none',
                                width: '90px',
                                bgcolor: activeStep === steps.length - 1 ? '#10b981' : '#3b82f6',
                                '&:hover': { bgcolor: activeStep === steps.length - 1 ? '#059669' : '#2563eb' }
                            }}>
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : (activeStep === steps.length - 1 ? (selectedTemplate ? 'Update' : 'Create') : 'Next')}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Assign Template Dialog */}
                <Dialog
                    open={assignDialogOpen}
                    onClose={handleCloseAssignDialog}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 3 } }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        Assign Template: {selectedTemplate?.template_name}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 1 }}>
                            <Autocomplete
                                fullWidth
                                options={positions}
                                getOptionLabel={(option) => option}
                                value={formData.assigned_position || null}
                                onChange={(event, newValue) => {
                                    handleAutocompleteChange('assigned_position', newValue);
                                }}
                                ListboxProps={{ style: { maxHeight: 200 } }}
                                renderInput={(params) => (
                                    <TextField {...params} label="Select Position" margin="normal" required error={!!errors.assigned_position} helperText={errors.assigned_position} />
                                )}
                            />
                            {formData.assigned_position && (
                                <Autocomplete
                                    fullWidth
                                    options={employeesByPosition}
                                    getOptionLabel={(option) => option.emp_name || ''}
                                    value={employeesByPosition.find(emp => emp.employee_id === formData.assigned_employee) || null}
                                    onChange={(event, newValue) => {
                                        handleAutocompleteChange('assigned_employee', newValue ? newValue.employee_id : '');
                                    }}
                                    ListboxProps={{ style: { maxHeight: 200 } }}
                                    renderInput={(params) => (
                                        <TextField {...params} label={`Select Employee`} margin="normal" required error={!!errors.assigned_employee} helperText={errors.assigned_employee} />
                                    )}
                                />
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button onClick={handleCloseAssignDialog} sx={{ color: '#64748b' }}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssignSubmit}
                            variant="contained"
                            disabled={isLoading}
                            sx={{ boxShadow: 'none', width: '100px' }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Assign'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* View Template Dialog */}
                <Dialog
                    open={viewDialogOpen}
                    onClose={handleCloseViewDialog}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                        sx: { borderRadius: 3 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        Template Preview: {selectedTemplate?.template_name}
                    </DialogTitle>
                    <DialogContent dividers>
                        <TemplateViewScreen
                            templateData={templateDetailsData}
                            categories={categories}
                            employeesByPosition={employeesByPosition}
                        />
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button onClick={handleCloseViewDialog} sx={{ color: '#64748b' }}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Release Confirmation Dialog */}
                <Dialog
                    open={releaseDialogOpen}
                    onClose={handleCloseReleaseDialog}
                    PaperProps={{
                        sx: { borderRadius: 3 }
                    }}
                >
                    <DialogTitle sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        Confirm Finalize
                    </DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to Finalize the template "<strong>{selectedTemplate?.template_name}</strong>"?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Releasing this template will make it available for use.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{ p: '16px 24px' }}>
                        <Button
                            onClick={handleCloseReleaseDialog}
                            sx={{ color: '#64748b' }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleReleaseTemplate}
                            variant="contained"
                            disabled={isLoading}
                            sx={{
                                boxShadow: 'none',
                                width: '90px',
                                bgcolor: '#10b981',
                                '&:hover': { bgcolor: '#059669' }
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Finalized'}
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
                            Are you sure you want to delete the template "<strong>{selectedTemplate?.template_name}</strong>"?
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            This action will mark the template as inactive.
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

export default Templates;
