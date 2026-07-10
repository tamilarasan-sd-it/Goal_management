import { Router } from "express";
import { getSubGoalHistoryViewPageController } from "../controllers/subGoalHistoryController.js";


const router = Router();

router.get('/sub_goal_history/SubGoalHistoryByIdData/fetch', getSubGoalHistoryViewPageController);

export const subGoalHistoryRouter = router;