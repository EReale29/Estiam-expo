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
  notifications_enabled INTEGER DEFAULT 0,
  push_token TEXT,
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
  city TEXT,
  country TEXT,
  startDate TEXT,
  endDate TEXT,
  description TEXT,
  image TEXT,
  location_lat REAL,
  location_lng REAL,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS trip_photos (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
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

CREATE TABLE IF NOT EXISTS trip_activities (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT,
  time TEXT,
  description TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS trip_journal_entries (
  id TEXT PRIMARY KEY,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  date TEXT,
  time TEXT,
  created_at INTEGER
);
`;

function ensureColumn(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some((c) => c.name === column);
  if (!exists) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

export function runMigrations() {
  db.exec(migrations);
  ensureColumn("users", "notifications_enabled", "INTEGER DEFAULT 0");
  ensureColumn("users", "push_token", "TEXT");
  ensureColumn("trips", "city", "TEXT");
  ensureColumn("trips", "country", "TEXT");
  ensureColumn("trips", "notes", "TEXT");
  ensureColumn("trip_activities", "time", "TEXT");
}

export { db, dbPath };
