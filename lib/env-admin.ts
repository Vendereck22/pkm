import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

// Compte administrateur temporaire lu dans le .env, utilisable avant que la base existe.
// Retirer ADMIN_EMAIL et ADMIN_PASSWORD une fois un compte créé en base.
export const ENV_ADMIN_ID = "env-admin";
const MIN_PASSWORD_LENGTH = 12;

function envAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < MIN_PASSWORD_LENGTH) return null;
  return { email, password, name: process.env.ADMIN_NAME?.trim() || null };
}

function sameSecret(a: string, b: string) {
  // On hache d'abord pour que les deux buffers aient la même longueur pour timingSafeEqual.
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
  // Le compte du .env est l'administrateur principal : il peut gérer les comptes en base.
  return admin ? { id: ENV_ADMIN_ID, email: admin.email, name: admin.name, role: "OWNER" as const } : null;
}

// Identifiants complets, pour copier le compte du .env en base depuis « Mon profil ».
export function getEnvAdminCredentials() {
  return envAdmin();
}
