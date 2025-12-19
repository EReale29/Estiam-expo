import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = env.dbPath || path.join(__dirname, "data", "app.db");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
db.pragma("journal_mode = WAL");

const migrations = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  username TEXT UNIQUE NOT NULL,
  avatar TEXT,
  roles TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  destination TEXT,
  startDate TEXT,
  endDate TEXT,
  description TEXT,
  image TEXT,
  location_lat REAL,
  location_lng REAL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS likes (
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER,
  PRIMARY KEY(trip_id, user_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  created_at INTEGER
);
`;

export function runMigrations() {
  db.exec(migrations);
}

export { db, dbPath };
