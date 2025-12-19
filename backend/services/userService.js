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
    roles: Array.isArray(row.roles) ? row.roles : parseRoles(row.roles),
    notificationsEnabled: Boolean(row.notifications_enabled),
    pushToken: row.push_token || null
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

  updateUser(id, payload) {
    const existing = this.findById(id);
    if (!existing) return { error: "User not found", status: 404 };

    const normalizedEmail = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : existing.email;
    const normalizedUsername = typeof payload.username === "string" ? payload.username.trim() : existing.username;

    if (normalizedEmail !== existing.email) {
      const emailExists = db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").get(normalizedEmail, id);
      if (emailExists) return { error: "Email already in use", status: 409 };
    }

    if (normalizedUsername !== existing.username) {
      const usernameExists = db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").get(normalizedUsername, id);
      if (usernameExists) return { error: "Username already in use", status: 409 };
    }

    db.prepare(`
      UPDATE users SET
        email = @email,
        name = COALESCE(@name, name),
        username = @username,
        avatar = COALESCE(@avatar, avatar),
        notifications_enabled = COALESCE(@notifications_enabled, notifications_enabled),
        push_token = COALESCE(@push_token, push_token)
      WHERE id = @id
    `).run({
      id,
      email: normalizedEmail,
      name: payload.name ?? existing.name,
      username: normalizedUsername,
      avatar: payload.avatar ?? existing.avatar,
      notifications_enabled: typeof payload.notificationsEnabled === "boolean" ? Number(payload.notificationsEnabled) : existing.notifications_enabled,
      push_token: payload.pushToken ?? existing.push_token
    });

    return { user: this.findById(id), status: 200 };
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
