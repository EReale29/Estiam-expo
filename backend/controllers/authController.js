import { AuthService } from "../services/authService.js";

const authService = new AuthService();

export const register = async (req, res) => {
  const result = await authService.register(req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const refresh = (req, res) => {
  const { refreshToken } = req.body || {};
  const result = authService.refresh(refreshToken);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const logout = (req, res) => {
  const { refreshToken } = req.body || {};
  const result = authService.logout(req.user.id, refreshToken);
  return res.json(result);
};

export const me = (req, res) => {
  const result = authService.getProfile(req.user.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};

export const getUserPublic = (req, res) => {
  const result = authService.getUserPublic(req.params.id);
  if (result.error) return res.status(result.status).json({ error: result.error });
  const { status, ...payload } = result;
  return res.status(status).json(payload);
};
