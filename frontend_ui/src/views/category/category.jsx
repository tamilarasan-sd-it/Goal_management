import React, { useEffect, useState } from 'react';
import {
    Fade,
    Container,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Box,
    styled,
    Grid,
    Chip,
    Skeleton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    TablePagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Category as CategoryIcon, Assessment, GroupWork } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from "reselect";
import { Alert, CircularProgress, Snackbar } from '@mui/material';
import { setLoading } from '../../StoreRedux/constants/actionTypes';
import { fetchAction, addAction, updateAction, deleteAction, } from '../../StoreRedux/actions/commonActions';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const StyledTableRow = styled(TableRow)(({ theme }) => ({ '&:hover': { backgroundColor: '#f8fafc' } }));

const getCategoryDetails = createSelector(
    state => state?.dataService?.pages,
    (pages) => {
        const result = {};
        const pageNames = ['category'];
        pageNames.forEach(page => {
            const pageData = pages?.[page];
            const categoryLoad = pageData?.loading?.categoryLoad;

            const CategoryData = pageData?.data?.CategoryData;
            result[page] = {
                loading: {
                    categoryLoad: categoryLoad,
                },
                data: {
                    CategoryData: CategoryData,
                }

            };
        });
        return result.category;
    }
);


const StatCard = ({ title, value, icon, color }) => (
    <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', borderLeft: `4px solid ${color}`, borderRadius: 2 }}>
        {icon}
        <Box sx={{ ml: 2 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color }}>{value}</Typography>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
    </Paper>
);

const CategoryFormDialog = ({ open, handleClose, handleSave, categoryName, setCategoryName, currentCategory, isSaving, error, helperText }) => (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight="bold" color="#1e293b">{currentCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
            <TextField
                autoFocus
                margin="dense"
                id="name"
                label="Category Name"
                type="text"
                fullWidth
                variant="outlined"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
                error={!!error}
                helperText={helperText}
            />
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
            <Button onClick={handleClose} sx={{ color: '#64748b' }}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" disabled={!categoryName.trim() || isSaving} sx={{ boxShadow: 'none', width: '90px', bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' } }}>
                {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save'}
            </Button>
        </DialogActions>
    </Dialog>
);

const DeleteConfirmationDialog = ({ open, handleClose, confirmDelete, categoryName }) => (
    <Dialog open={open} onClose={handleClose} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight="bold">Confirm Deletion</DialogTitle>
        <DialogContent>
            <Typography>Are you sure you want to delete the category "<strong>{categoryName}</strong>"?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>This action will mark the category as inactive.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={confirmDelete} variant="contained" sx={{ boxShadow: 'none', width: '90px', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
                Delete
            </Button>
        </DialogActions>
    </Dialog>
);

const Category = () => {

    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedCategoryForMenu, setSelectedCategoryForMenu] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const navigate = useNavigate();


    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };


    const dispatch = useDispatch();

    const categories = useSelector(getCategoryDetails) || [];
    console.log(categories, "categories")

    useEffect(() => {
        dispatch(setLoading("category", "categoryLoad", true))
        dispatch(fetchAction('application/json', "category", "CategoryData", "categoryLoad"));
    }, [dispatch]);



    const categoryList = Array.isArray(categories?.data?.CategoryData)
        ? categories.data.CategoryData
        : categories?.data?.CategoryData
            ? [categories.data.CategoryData]
            : [];


    const displayedCategories = categoryList.filter(cat => cat.category_is_delete == 'Active');

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const validate = () => {
        const errors = {};
        const trimmedName = categoryName.trim();

        if (!trimmedName) {
            errors.categoryName = "Category name is required.";
        } else if (trimmedName.length > 50) {
            errors.categoryName = "Category name cannot exceed 50 characters.";
        } else if (
            categoryList.some(
                (cat) => cat.category_name.toLowerCase() === trimmedName.toLowerCase() && cat.category_pid !== currentCategory?.category_pid
            )
        ) {
            errors.categoryName = "This category name already exists.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleMenuOpen = (event, category) => {
        setAnchorEl(event.currentTarget);
        setSelectedCategoryForMenu(category);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedCategoryForMenu(null);
    };

    const handleMenuAction = (action) => {
        action();
        handleMenuClose();
    };


    const handleAddClick = () => {
        setCurrentCategory(null);
        setCategoryName('');
        setFormErrors({});
        setOpen(true);
    };

    const handleEditClick = (category) => {
        setCurrentCategory(category);
        setCategoryName(category.category_name);
        setOpen(true);
        setFormErrors({});
    };

    const handleDeleteClick = (category) => {
        setCurrentCategory(category);
        setDeleteDialogOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentCategory(null);
        setCategoryName('');
        setFormErrors({});
    };

    const handleDeleteDialogClose = () => {
        setDeleteDialogOpen(false);
        setCurrentCategory(null);
    };

    const handleSave = () => {
        if (validate()) {
            setIsSaving(true);
            setTimeout(() => {
                if (currentCategory) {
                    let updatedCategory = { ...currentCategory, category_name: categoryName.trim() };
                    dispatch(setLoading("category", "categoryLoad", true))
                    dispatch(updateAction('application/json', "category", "CategoryData", "categoryLoad", 'updateCategory', updatedCategory));

                    // setSnackbar({ open: true, message: 'Category updated successfully!', severity: 'success' });
                } else {
                    let newCategory = { category_name: categoryName.trim(), category_is_delete: 'Active' }
                    dispatch(setLoading("category", "categoryLoad", true))
                    dispatch(addAction('application/json', "category", "CategoryData", "categoryLoad", newCategory))

                    // setSnackbar({ open: true, message: 'Category added successfully!', severity: 'success' });
                }
                setIsSaving(false);
                handleClose();
            }, 500);
        }
    };

    const confirmDelete = () => {

        let updatedCategory = { ...currentCategory, category_is_delete: 'In Active' };
        dispatch(setLoading("category", "categoryLoad", true))
        dispatch(deleteAction('application/json', "category", "CategoryData", "categoryLoad", updatedCategory));
        // setSnackbar({ open: true, message: 'Category deleted successfully!', severity: 'warning' });
        handleDeleteDialogClose();
    };

    return (
        <Fade in timeout={500}>
            <Container  sx={{ mt: 4, mb: 4,width: '100%',maxWidth: '95% !important',backgroundColor: '#f5f5f5', p: 3, borderRadius: 2 }}>
                <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="#1e293b">
                        Manage Categories
                    </Typography>
                    <Button
                        onClick={() => window.history.back()}
                        startIcon={<ArrowBackIcon />}
                        sx={{ marginLeft: '92%' }}
                    >
                        Back
                    </Button>
                </Paper>
                
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <StatCard title="Total Categories" value={categoryList.length} icon={<CategoryIcon sx={{ fontSize: 40, color: '#3b82f6' }} />} color="#3b82f6" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <StatCard title="Active Categories" value={displayedCategories.length} icon={<Assessment sx={{ fontSize: 40, color: '#10b981' }} />} color="#10b981" />
                    </Grid>

                </Grid>

                <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 2, borderBottom: '2px solid #e5e7eb' }}>
                        <Typography variant="h5" component="h2" fontWeight="bold" color="#1e293b">
                            All Categories
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} sx={{ borderRadius: '6px', boxShadow: 'none', bgcolor: '#3b82f6', '&:hover': { bgcolor: '#2563eb' } }}>
                            Add Category
                        </Button>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: '600', backgroundColor: '#f8fafc', color: '#475569', borderBottom: '2px solid #e5e7eb' } }}>
                                    <TableCell sx={{ width: '80px' }}>S.No</TableCell>
                                    <TableCell>Category Name</TableCell>
                                    <TableCell>Created Date</TableCell>
                                    <TableCell>Modified Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {categories?.loading?.categoryLoad ? (
                                    Array.from(new Array(5)).map((_, index) => (
                                        <TableRow key={index}>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell><Skeleton variant="text" /></TableCell>
                                            <TableCell align="right"><Skeleton variant="rectangular" width={150} height={30} /></TableCell>
                                        </TableRow>
                                    ))
                                )
                                    : displayedCategories.length > 0 ? (
                                        displayedCategories
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map((category, index) => (
                                            <StyledTableRow key={category.category_pid}>
                                                <TableCell><strong>{page * rowsPerPage + index + 1}</strong></TableCell>
                                                <TableCell component="th" scope="row"><strong>{category.category_name}</strong></TableCell>
                                                <TableCell>
                                                    {category.category_created_at ? (
                                                        <>
                                                            {new Date(category.category_created_at).toLocaleDateString()}<br />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(category.category_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                        </>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {category.category_modified_at ? (
                                                        <>
                                                            {new Date(category.category_modified_at).toLocaleDateString()}<br />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(category.category_modified_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </Typography>
                                                        </>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={category.category_is_delete}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: category.category_is_delete === 'Active' ? '#d1fae5' : '#fee2e2',
                                                            color: category.category_is_delete === 'Active' ? '#065f46' : '#991b1b',
                                                            fontWeight: 600
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell align="right">
                                                    <IconButton
                                                        aria-label="actions"
                                                        onClick={(event) => handleMenuOpen(event, category)}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </StyledTableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center">
                                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 6, color: 'text.secondary' }}>
                                                    <CategoryIcon sx={{ fontSize: 60, mb: 2 }} />
                                                    <Typography variant="h6">No Categories Found</Typography>
                                                    <Typography>Click "Add Category" to get started.</Typography>
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
                        count={displayedCategories.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Paper>

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
                    <MenuItem onClick={() => handleMenuAction(() => handleEditClick(selectedCategoryForMenu))}>
                        <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon><ListItemText>Edit</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={() => handleMenuAction(() => handleDeleteClick(selectedCategoryForMenu))}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon><ListItemText>Delete</ListItemText>
                    </MenuItem>
                </Menu>

                {/* Add/Edit Dialog */}
                <CategoryFormDialog
                    open={open}
                    handleClose={handleClose}
                    handleSave={handleSave}
                    categoryName={categoryName}
                    setCategoryName={setCategoryName}
                    currentCategory={currentCategory}
                    isSaving={isSaving}
                    error={formErrors.categoryName}
                    helperText={formErrors.categoryName}
                />

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    handleClose={handleDeleteDialogClose}
                    confirmDelete={confirmDelete}
                    categoryName={currentCategory?.category_name}
                />

                {/* Snackbar for notifications */}
                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Container >
        </Fade>
    );
};

export default Category;
