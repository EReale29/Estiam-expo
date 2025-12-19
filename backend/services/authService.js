import { TokenService } from "./tokenService.js";
import { UserService } from "./userService.js";
import { parseRoles } from "../utils/validation.js";

export class AuthService {
  constructor() {
    this.userService = new UserService();
    this.tokenService = new TokenService();
  }

  async register(payload) {
    const { email, password, name, username } = payload || {};
    const validationError = this.userService.validateUserPayload({ email, password, username });
    if (validationError) return { error: validationError, status: 400 };

    const existingEmail = this.userService.findByEmail(email);
    if (existingEmail) return { error: "Email already in use", status: 409 };
    const existingUsername = this.userService.findByUsername(username);
    if (existingUsername) return { error: "Username already in use", status: 409 };

    const userRow = await this.userService.createUser({ email, password, name, username });
    const tokens = this.tokenService.issueTokens({ id: userRow.id, email, roles: parseRoles(userRow.roles) });
    return { user: this.userService.sanitize(userRow), ...tokens, status: 201 };
  }

  async login(payload) {
    const { email, password } = payload || {};
    if (!email || !password) return { error: "Email and password are required", status: 400 };

    const userRow = this.userService.findByEmail(email);
    if (!userRow) return { error: "Invalid credentials", status: 401 };

    const match = await this.userService.verifyPassword(userRow, password);
    if (!match) return { error: "Invalid credentials", status: 401 };

    this.tokenService.deleteTokens(userRow.id);
    const tokens = this.tokenService.issueTokens({ id: userRow.id, email: userRow.email, roles: parseRoles(userRow.roles) });
    return { user: this.userService.sanitize(userRow), ...tokens, status: 200 };
  }

  refresh(refreshToken) {
    if (!refreshToken) return { error: "Refresh token is required", status: 400 };

    try {
      const decoded = this.tokenService.verifyAndRotateRefreshToken(refreshToken);
      const userRow = this.userService.findById(decoded.userId);
      if (!userRow) {
        this.tokenService.deleteTokens(decoded.userId, refreshToken);
        return { error: "User not found", status: 404 };
      }

      this.tokenService.deleteTokens(userRow.id, refreshToken);
      const tokens = this.tokenService.issueTokens({ id: userRow.id, email: userRow.email, roles: parseRoles(userRow.roles) });
      return { ...tokens, user: this.userService.sanitize(userRow), status: 200 };
    } catch (error) {
      this.tokenService.deleteTokens(null, refreshToken);
      return { error: error.message || "Invalid refresh token", status: 403 };
    }
  }

  logout(userId, refreshToken) {
    this.tokenService.deleteTokens(userId, refreshToken);
    return { message: "Logged out successfully" };
  }

  getProfile(userId) {
    const userRow = this.userService.findById(userId);
    if (!userRow) return { error: "User not found", status: 404 };
    return { user: this.userService.sanitize(userRow), status: 200 };
  }

  getUserPublic(id) {
    const userRow = this.userService.findById(id);
    if (!userRow) return { error: "User not found", status: 404 };
    return { user: this.userService.sanitize(userRow), status: 200 };
  }
}
