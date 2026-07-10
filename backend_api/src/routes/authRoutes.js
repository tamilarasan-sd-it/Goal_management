import { Router } from "express";
import { loginController, loginByExternalApplicationUser } from "../controllers/authController.js";

const router = Router();

router.post('/loginUser', loginController);

router.get("/check-emp-id", loginByExternalApplicationUser);

export const authRouter = router;