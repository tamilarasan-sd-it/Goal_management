import { Router } from "express";
import { addGoalTemplateForReviewerController, getGoalColumnsByIDReviewerController, getGoalReviewersController, getGoalTemplateForReviewerController, getSubGoalReviewerController } from "../controllers/goalReviewerController.js";

const router = Router();

router.get('/goalReviewerByIdList/GoalReviewerByIdListData/fetch',getGoalReviewersController);

router.get('/goalReviewer/GoalTemplateDataForReviwerData/fetch', getGoalTemplateForReviewerController);

router.get('/goalReviewer/SubGoalReviewerData/fetch', getSubGoalReviewerController);

router.post('/goalReviewer/GoalTemplateDataForReviwerData/create', addGoalTemplateForReviewerController);


router.post('/goalReviewerByIdList/GoalReviewerByIdListData/create', addGoalTemplateForReviewerController);

router.get('/goalReviewerByIdList/GoalReviewerByIdListColumnsData/fetch', getGoalColumnsByIDReviewerController);


export const goalReviewerRouter = router;