// src/routes/templateGoalsRoutes.js
// Updated Routes for Assignment-Based Goal Management with Template Columns

import express from 'express';
import {
    getAssignmentForGoalsController,
    getTemplateColumnsController,
    getDepartmentEmployeesController,
    getGoalsByAssignmentController,
    addGoalController,
    updateGoalController,
    deleteGoalController,
    submitForReviewController,
    saveAsDraftController
} from '../controllers/templateGoalsController.js';

// Uncomment if you have authentication middleware
// import { authenticateToken } from '../authUtils/authMiddleware.js';

const router = express.Router();

// ============================================================================
// GET ENDPOINTS - Assignment Based
// ============================================================================

/**
 * Get assignment with categories and goal owner info
 * Route: GET /api/add_new_goal/GetAssignmentData/fetch
 */
router.get(
    '/add_new_goal/GetAssignmentData/fetch',
    // authenticateToken,
    getAssignmentForGoalsController
);

/**
 * Get template columns for dynamic fields
 * Route: GET /api/add_new_goal/GetTemplateColumns/fetch
 * Query Parameters:
 *   - id: template_pid
 */
router.get(
    '/add_new_goal/GetTemplateColumns/fetch',
    // authenticateToken,
    getTemplateColumnsController
);

/**
 * Get department employees for responsible members dropdown
 * Route: GET /api/add_new_goal/GetDepartmentEmployees/fetch
 */
router.get(
    '/add_new_goal/GetDepartmentEmployees/fetch',
    // authenticateToken,
    getDepartmentEmployeesController
);

/**
 * Get existing goals for an assignment
 * Route: GET /api/add_new_goal/GetGoalsData/fetch
 */
router.get(
    '/add_new_goal/GetGoalsData/fetch',
    // authenticateToken,
    getGoalsByAssignmentController
);

// ============================================================================
// POST ENDPOINTS
// ============================================================================

/**
 * Add a new goal to an assignment
 * Route: POST /api/add_new_goal/AddNewGoalData/create
 */
router.post(
    '/add_new_goal/AddNewGoalData/create',
    // authenticateToken,
    addGoalController
);

/**
 * Submit assignment for review
 * Route: POST /api/add_new_goal/SubmitReview/create
 */
router.post(
    '/add_new_goal/SubmitReview/create',
    // authenticateToken,
    submitForReviewController
);

/**
 * Save assignment as draft
 * Route: POST /api/add_new_goal/SaveDraft/create
 */
router.post(
    '/add_new_goal/SaveDraft/create',
    // authenticateToken,
    saveAsDraftController
);

// ============================================================================
// PUT ENDPOINTS
// ============================================================================

/**
 * Update a goal
 * Route: PUT /api/add_new_goal/AddNewGoalData/:goalId/update
 */
router.put(
    '/add_new_goal/AddNewGoalData/update_goal/update',
    // authenticateToken,
    updateGoalController
);

/**
 * Delete a goal (soft delete)
 * Route: PUT /api/add_new_goal/AddNewGoalData/delete
 */
router.put(
    '/add_new_goal/AddNewGoalData/delete',
    // authenticateToken,
    deleteGoalController
);


export const templateGoalsRoutes = router;