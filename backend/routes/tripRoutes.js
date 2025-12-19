import { Router } from "express";
import {
  addActivity,
  addComment,
  createTrip,
  deleteActivity,
  deleteComment,
  deleteTrip,
  getDashboard,
  getTrip,
  listTrips,
  toggleLike,
  updateActivity,
  updateTrip,
  addJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
} from "../controllers/tripController.js";
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
router.post("/trips/:id/activities", authenticateToken, addActivity);
router.put("/trips/:id/activities/:activityId", authenticateToken, updateActivity);
router.delete("/trips/:id/activities/:activityId", authenticateToken, deleteActivity);
router.post("/trips/:id/journal", authenticateToken, addJournalEntry);
router.put("/trips/:id/journal/:entryId", authenticateToken, updateJournalEntry);
router.delete("/trips/:id/journal/:entryId", authenticateToken, deleteJournalEntry);

export default router;
