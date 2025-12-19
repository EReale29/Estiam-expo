import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const defaultDbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "data", "app.db");
const uploadsDir = path.join(__dirname, "..", "uploads");

export const env = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "change-me-access-secret",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me-refresh-secret",
  dbPath: defaultDbPath,
  uploadsDir,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "1h",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  refreshTokenTtlMs: Number(process.env.REFRESH_TOKEN_TTL_MS || 1000 * 60 * 60 * 24 * 7),
  saltRounds: Number(process.env.SALT_ROUNDS || 10)
};
