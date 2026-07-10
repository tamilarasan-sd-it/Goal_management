// src/routes/monthlyUpdatesRoutes.js
import express from 'express';
import {
    getEmployeeGoalsController,
    saveMonthlyUpdateController,
    submitUpdatesController,
    getAdminReportController,
    getEmployeeDetailController
} from '../controllers/monthlyUpdatesController.js';

const router = express.Router();

// ============================================================================
// MONTHLY UPDATES ROUTES
// ============================================================================


router.get('/monthly_updates/MonthlyGoalsData/fetch', getEmployeeGoalsController);


router.post('/monthly_updates/SaveMonthlyUpdate/create', saveMonthlyUpdateController);


router.post('/monthly_updates/SubmitMonthlyUpdates/create', submitUpdatesController);


router.get('/monthly_updates/MonthlyReportData/fetch', getAdminReportController);


router.get('/monthly_updates/EmployeeDetailsData/fetch', getEmployeeDetailController);

export default router;