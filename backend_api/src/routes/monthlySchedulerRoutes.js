import { Router } from 'express';
import {
    updateScheduleCallController,
    createScheduleCallController,
    fetchScheduleCallController,
    getCronStatusController,
    refreshCronsController
} from '../controllers/monthlySchedulerController.js';

const router = Router();

// Existing routes
router.post('/schedule_calls/ScheduleCallData/create', createScheduleCallController);
router.get('/schedule_calls/ScheduleCallData/fetch', fetchScheduleCallController);
router.put('/schedule_calls/ScheduleCallData/update_schedule/update', updateScheduleCallController);

// ✅ New cron management routes
router.get('/schedule_calls/cron-status', getCronStatusController);
router.post('/schedule_calls/cron-refresh', refreshCronsController);

export default router;