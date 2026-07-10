import { Router } from "express";
import { getTemplateColumnsController,addTemplateColumnsController,updateTemplateColumnsController,deleteTemplateColumnsController } from "../controllers/templateColumnsController.js";

const router = Router();

router.get('/columns/ColumnsData/fetch',getTemplateColumnsController);

router.post("/columns/ColumnsData/create", addTemplateColumnsController);

router.put('/columns/ColumnsData/updateColumn/update',updateTemplateColumnsController);

router.put('/columns/ColumnsData/delete',deleteTemplateColumnsController);

export const templateColumnsRouter = router;