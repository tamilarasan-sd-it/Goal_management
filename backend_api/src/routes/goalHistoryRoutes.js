import { Router } from "express";
import { getGoalHistoryViewPageController,getGoalReviewsTemplateAssignmentsController } from "../controllers/goalHistoryController.js";

const router = Router();

router.get('/goal_history_view_page/GoalHistoryViewPageData/fetch',getGoalHistoryViewPageController);

router.get('/goal_history_view_page/GoalHistoryReviewTemplateAssignmentsData/fetch',getGoalReviewsTemplateAssignmentsController);

export const goalHistoryRouter = router;