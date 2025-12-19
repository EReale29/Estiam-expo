import { TripService } from "../services/tripService.js";

const tripService = new TripService();

export const getDashboard = (req, res) => {
  const data = tripService.dashboard(req.user.id);
  return res.json(data);
};

export const listTrips = (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const data = tripService.list({ page, limit, currentUserId: req.user.id });
  return res.json(data);
};

export const createTrip = (req, res) => {
  const { title, destination } = req.body || {};
  if (!title || !destination) return res.status(400).json({ error: "Title and destination are required" });

  const result = tripService.createTrip({ ownerId: req.user.id, ...req.body });
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(result.status).json(result.trip);
};

export const getTrip = (req, res) => {
  const trip = tripService.getTrip(req.params.id, req.user.id);
  if (!trip) return res.status(404).json({ error: "Trip not found" });
  return res.json(trip);
};

export const updateTrip = (req, res) => {
  const result = tripService.updateTrip(req.params.id, req.user.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json(result.trip);
};

export const deleteTrip = (req, res) => {
  const result = tripService.deleteTrip(req.params.id, req.user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(result.status).json({ message: result.message });
};

export const toggleLike = (req, res) => {
  const result = tripService.toggleLike(req.params.id, req.user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const addComment = (req, res) => {
  const { text } = req.body || {};
  const result = tripService.addComment(req.params.id, req.user.id, text);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const deleteComment = (req, res) => {
  const result = tripService.deleteComment(req.params.id, req.params.commentId, req.user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(result.status).json({ message: result.message });
};

export const addActivity = (req, res) => {
  const result = tripService.addActivity(req.params.id, req.user.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const updateActivity = (req, res) => {
  const result = tripService.updateActivity(req.params.id, req.params.activityId, req.user.id, req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const deleteActivity = (req, res) => {
  const result = tripService.deleteActivity(req.params.id, req.params.activityId, req.user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(result.status).json({ message: result.message });
};
