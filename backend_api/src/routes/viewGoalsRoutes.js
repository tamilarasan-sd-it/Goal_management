// src/routes/viewGoalsRoutes.js
import express from 'express';
import {
    getGoalsByRole,
    postGoalsByRole,
    getFilterOptions,
    getGoalById,
    getSummaryStats,
    saveMonthlyUpdateFromViewGoals
} from '../controllers/viewGoalsController.js';

const router = express.Router();

// ============================================================================
// VIEW GOALS ROUTES
// ============================================================================

// GET  — initial load (no filters, just employeeId in ?id=)
router.get('/view_goals/GoalsListData/fetch', getGoalsByRole);

// POST — apply filters (body contains userId + all filter fields)
router.post('/view_goals/GoalsListData/create', postGoalsByRole);

// GET  — dropdown options (years, templates, categories, owners, depts)
router.get('/view_goals/FilterOptionsData/fetch', getFilterOptions);

// GET  — summary stat cards
router.get('/view_goals/SummaryStatsData/fetch', getSummaryStats);

// GET  — single goal detail (for the detail dialog)
router.get('/view_goals/GoalDetailsData/fetch', getGoalById);

// POST — save monthly update triggered from the ViewGoals MU dialog
router.post('/view_goals/SaveMonthlyUpdate/create', saveMonthlyUpdateFromViewGoals);

export default router;