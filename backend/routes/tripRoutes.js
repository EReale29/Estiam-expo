import { Router } from "express";
import { addComment, createTrip, deleteComment, deleteTrip, getDashboard, getTrip, listTrips, toggleLike, updateTrip } from "../controllers/tripController.js";
import { authenticateToken } from "../middleware/authenticate.js";

const router = Router();

router.get("/dashboard", authenticateToken, getDashboard);
router.get("/trips", authenticateToken, listTrips);
router.post("/trips", authenticateToken, createTrip);
router.get("/trips/:id", authenticateToken, getTrip);
router.put("/trips/:id", authenticateToken, updateTrip);
router.delete("/trips/:id", authenticateToken, deleteTrip);
router.post("/trips/:id/like", authenticateToken, toggleLike);
router.post("/trips/:id/comments", authenticateToken, addComment);
router.delete("/trips/:id/comments/:commentId", authenticateToken, deleteComment);

export default router;
