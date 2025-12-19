import { Router } from "express";
import { getUserPublic, me } from "../controllers/authController.js";
import { authenticateToken } from "../middleware/authenticate.js";

const router = Router();

router.get("/users/:id", getUserPublic);
router.get("/me", authenticateToken, me);

export default router;
