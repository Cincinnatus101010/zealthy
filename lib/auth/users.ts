export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function displayName(email: string, name: string | null) {
  return name?.trim() || email.split("@")[0] || "User";
}
