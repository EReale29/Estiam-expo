import { UserService } from "../services/userService.js";

const userService = new UserService();

export const updateMe = (req, res) => {
  const result = userService.updateUser(req.user.id, req.body || {});
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.json({ user: userService.sanitize(result.user) });
};
