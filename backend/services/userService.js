import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db.js";
import { parseRoles, validateUserPayload } from "../utils/validation.js";
import { env } from "../config/env.js";

function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
    avatar: row.avatar,
    roles: Array.isArray(row.roles) ? row.roles : parseRoles(row.roles)
  };
}

export class UserService {
  validateUserPayload(payload) {
    return validateUserPayload(payload);
  }

  findByEmail(email) {
    return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  }

  findByUsername(username) {
    return db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  }

  findById(id) {
    return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
  }

  sanitize(row) {
    return sanitizeUser(row);
  }

  async createUser({ email, password, name, username }) {
    const passwordHash = await bcrypt.hash(password, env.saltRounds);
    const userId = uuidv4();
    const createdAt = Date.now();
    const roles = "student";

    const insertUser = db.prepare(`INSERT INTO users (id, email, password_hash, name, username, avatar, roles, created_at)
      VALUES (@id, @email, @password_hash, @name, @username, @avatar, @roles, @created_at)`);

    insertUser.run({
      id: userId,
      email,
      password_hash: passwordHash,
      name: name || null,
      username,
      avatar: null,
      roles,
      created_at: createdAt
    });

    return this.findById(userId);
  }

  async verifyPassword(userRow, password) {
    return bcrypt.compare(password, userRow.password_hash);
  }
}
