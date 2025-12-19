import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || []
    };
    return next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}
