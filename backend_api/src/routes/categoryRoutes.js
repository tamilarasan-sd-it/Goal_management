import { Router } from "express";
import { addCategoryController, deleteCategoryController, getCategoryController, updateCategoryController } from "../controllers/categoryController.js";

const router = Router();

// Example route
router.get('/category/CategoryData/fetch',getCategoryController);

router.post("/category/CategoryData/create", addCategoryController);

router.put('/category/CategoryData/updateCategory/update',updateCategoryController);

router.put('/category/CategoryData/delete',deleteCategoryController);


export const categoryRouter = router;