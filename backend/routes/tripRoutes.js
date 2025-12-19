import { Router } from "express";
import { addComment, createTrip, deleteComment, deleteTrip, getDashboard, getTrip, listTrips, toggleLike, updateTrip } from "../controllers/tripController.js";
import { authenticateToken } from "../middleware/authenticate.js";

const router = Router();

router.get("/dashboard", authenticateToken, getDashboard);
router.get("/", authenticateToken, listTrips);
router.post("/", authenticateToken, createTrip);
router.get("/:id", authenticateToken, getTrip);
router.put("/:id", authenticateToken, updateTrip);
router.delete("/:id", authenticateToken, deleteTrip);
router.post("/:id/like", authenticateToken, toggleLike);
router.post("/:id/comments", authenticateToken, addComment);
router.delete("/:id/comments/:commentId", authenticateToken, deleteComment);

export default router;
