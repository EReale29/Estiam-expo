import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { db } from "../db.js";

export class TokenService {
  issueTokens(user) {
    const roles = user.roles || ["student"];
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, roles },
      env.jwtSecret,
      { expiresIn: env.accessTokenExpiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, email: user.email },
      env.jwtRefreshSecret,
      { expiresIn: env.refreshTokenExpiresIn }
    );

    const refreshExpiresAt = Date.now() + env.refreshTokenTtlMs;
    db.prepare("INSERT OR REPLACE INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)")
      .run(refreshToken, user.id, refreshExpiresAt);

    return { accessToken, refreshToken, expiresIn: 3600 };
  }

  deleteTokens(userId, specificToken) {
    if (specificToken && userId) {
      db.prepare("DELETE FROM refresh_tokens WHERE user_id = ? AND token = ?").run(userId, specificToken);
      return;
    }
    if (specificToken && !userId) {
      db.prepare("DELETE FROM refresh_tokens WHERE token = ?").run(specificToken);
      return;
    }
    if (userId) {
      db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?").run(userId);
    }
  }

  verifyAndRotateRefreshToken(refreshToken) {
    const tokenRow = db.prepare("SELECT * FROM refresh_tokens WHERE token = ?").get(refreshToken);
    if (!tokenRow) throw new Error("Invalid refresh token");
    if (tokenRow.expires_at && tokenRow.expires_at < Date.now()) {
      this.deleteTokens(tokenRow.user_id, refreshToken);
      throw new Error("Refresh token expired");
    }

    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret);
    if (decoded.userId !== tokenRow.user_id) {
      this.deleteTokens(tokenRow.user_id, refreshToken);
      throw new Error("Refresh token does not match user");
    }

    return decoded;
  }
}
