import { Router } from "express";
import { getGoalViewsByUserController, getGoalViewsByIDController, addGoalTemplateForviewController, getGoalColumnsByIDController, bulkGoaltemplateUpdateForviewController, getGoalTemplateByIDController } from "../controllers/goalViewsController.js";
import { getSubGoalReviewerController } from "../controllers/goalReviewerController.js";

const router = Router();


router.get('/goal_view_page/GoalViewPageData/fetch', getGoalViewsByUserController);

router.post('/goal_view_page/GoalViewPageData/create', addGoalTemplateForviewController);

router.get('/goal_view_page/GoalViewPageByIdData/fetch', getGoalViewsByIDController);

router.post('/goal_view_page/GoalViewPageByIdData/create', addGoalTemplateForviewController);

router.put('/goal_view_page/GoalViewPageByIdData/bulkupdate/update', bulkGoaltemplateUpdateForviewController);

router.get('/goal_view_page/SubGoalViewPageData/fetch', getSubGoalReviewerController);

router.get('/goal_view_page/GoalColumnsData/fetch', getGoalColumnsByIDController);

router.get('/goal_view_page/GoalTemplateDataReviwerData/fetch', getGoalTemplateByIDController);

router.post('/goal_view_page/GoalTemplateDataReviwerData/create', addGoalTemplateForviewController);


export const goalViewsRouter = router;