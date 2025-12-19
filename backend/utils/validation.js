const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/;

export function normalizeUserFields({ email, username, name, password }) {
  return {
    email: typeof email === "string" ? email.trim().toLowerCase() : "",
    username: typeof username === "string" ? username.trim() : "",
    name: typeof name === "string" ? name.trim() : "",
    password
  };
}

export function validateUserPayload(payload) {
  const { email, password, username } = normalizeUserFields(payload || {});
  if (!emailRegex.test(email || "")) return "Invalid email";
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  if (!usernameRegex.test(username || "")) return "Username must be at least 3 characters (letters, numbers, . _ -)";
  return null;
}

export function parseRoles(rolesText) {
  const roles = (rolesText || "").split(",").map((r) => r.trim()).filter(Boolean);
  return roles.length ? roles : ["student"];
}
