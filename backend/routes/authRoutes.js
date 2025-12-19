import { Router } from "express";
import { login, refresh, register, logout, me, getUserPublic } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authenticate.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticateToken, logout);
router.get("/me", authenticateToken, me);

export default router;
