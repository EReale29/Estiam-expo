const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernameRegex = /^[a-zA-Z0-9_.-]{3,}$/;

export function validateUserPayload({ email, password, username }) {
  if (!emailRegex.test(email || "")) return "Invalid email";
  if (!password || password.length < 6) return "Password must be at least 6 characters";
  if (!usernameRegex.test(username || "")) return "Username must be at least 3 characters (letters, numbers, . _ -)";
  return null;
}

export function parseRoles(rolesText) {
  const roles = (rolesText || "").split(",").map((r) => r.trim()).filter(Boolean);
  return roles.length ? roles : ["student"];
}
