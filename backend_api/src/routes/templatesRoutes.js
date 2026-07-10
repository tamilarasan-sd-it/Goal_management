import express from 'express';
import { fetchEmployeesByPositionController, fetchPositionsController, getTemplatesController, updateTemplateStatusController,getTemplatesListController } from '../controllers/templateColumnsController.js';
import { getTemplateDetailsController } from '../controllers/templateColumnsController.js';
import { addTemplateController, deleteTemplateController, updateTemplateController } from '../controllers/templateController.js';
// import { getDashboardDataController } from '../controllers/templateGoalsController.js';
// import { getDashboardDataController } from '../controllers/templateGoalsController.js';
import { createAssignmentController, deleteAssignmentController, getAssignmentsController, updateAssignmentController, getAssignmentsListController } from '../controllers/assignmentController.js';

const router = express.Router();

// This route matches the URL from the frontend action: GET /api/v1/templates/TemplatesData/fetch
router.get('/templates/TemplatesData/fetch', getTemplatesController);

router.post('/templates/TemplatesData/create', addTemplateController);
router.put('/templates/TemplatesData/updateStatus/update', updateTemplateStatusController); // New route for status update
router.put('/templates/TemplatesData/updateTemplate/update', updateTemplateController)

router.put('/templates/TemplatesData/delete', deleteTemplateController);

// router.get('/employees/PositionsData/fetch',fetchPositionsController);

router.get('/employees/EmployeesByPositionData/fetch',fetchEmployeesByPositionController);

// New route to fetch full template details by ID
router.get('/templates/TemplateDetailsData/fetch', getTemplateDetailsController);

router.get("/assignments/AssignmentsDataList/fetch",getAssignmentsListController)
router.get("/assignments/AssignmentsData/fetch",getAssignmentsController)
router.post("/assignments/AssignmentsData/create",createAssignmentController)
router.put("/assignments/AssignmentsData/delete",deleteAssignmentController)
router.put("/assignments/AssignmentsData/updateAssignment/update",updateAssignmentController)

router.get('/templatelist/TemplateListDataList/fetch', getTemplatesListController);

export const templatepositionRouter = router;