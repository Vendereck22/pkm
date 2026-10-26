import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

// Temporary admin account read from .env, usable before the database exists.
// Remove ADMIN_EMAIL and ADMIN_PASSWORD once a database account has been created.
export const ENV_ADMIN_ID = "env-admin";
const MIN_PASSWORD_LENGTH = 12;

function envAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < MIN_PASSWORD_LENGTH) return null;
  return { email, password, name: process.env.ADMIN_NAME?.trim() || null };
}

function sameSecret(a: string, b: string) {
  // Hash first so both buffers have the same length for timingSafeEqual.
  return timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());
}

export function isEnvAdminEmail(email: string) {
  return envAdmin()?.email === email;
}

export function verifyEnvAdmin(email: string, password: string) {
  const admin = envAdmin();
  return Boolean(admin && admin.email === email && sameSecret(admin.password, password));
}

export function getEnvAdmin() {
  const admin = envAdmin();
  // The .env account is the principal admin: it can manage the database accounts.
  return admin ? { id: ENV_ADMIN_ID, email: admin.email, name: admin.name, role: "OWNER" as const } : null;
}
