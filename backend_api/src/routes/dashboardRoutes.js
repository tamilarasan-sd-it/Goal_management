import express from 'express';
import { getCategoryCountController, getDashboardController, getReviewerDashboardCountController } from '../controllers/dashboardController.js';

const router = express.Router();


router.get("/dashboard/DashboardData/fetch/", getDashboardController)

router.get("/dashboard/ReviewerDashboardCountData/fetch", getReviewerDashboardCountController);

router.get("/dashboard/TemplateDetailsCount/fetch", getCategoryCountController);




export const dashboardRouter = router;