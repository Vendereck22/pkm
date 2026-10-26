"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { startOtpChallenge } from "@/lib/auth";
import { ENV_ADMIN_ID, getEnvAdmin, isEnvAdminEmail, verifyEnvAdmin } from "@/lib/env-admin";

export type LoginState = { error?: string; email?: string } | undefined;

// Compared against when the email is unknown, so both cases take the same time.
const DUMMY_HASH = "$2b$12$LzycbHyu8XUpqemqPnzSCeSieSotzUYTYBUQHzvgkkYVIfyNmYFtO";
const INVALID_CREDENTIALS = "Adresse e-mail ou mot de passe incorrect.";
const UNAVAILABLE = "Connexion impossible pour le moment. Réessayez dans quelques instants.";

// Returns the admin to send a code to, or null when the credentials are wrong.
async function checkCredentials(email: string, password: string) {
  // The .env account never touches the database, so it works before Neon is set up.
  if (isEnvAdminEmail(email)) {
    return verifyEnvAdmin(email, password) ? { id: ENV_ADMIN_ID, email: getEnvAdmin()!.email } : null;
  }

  const admin = await getDb().admin.findUnique({ where: { email }, select: { id: true, email: true, passwordHash: true, disabledAt: true } });
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  // A disabled account gets the same message, so its existence is not revealed.
  if (!admin || !valid || admin.disabledAt) return null;

  await getDb().admin.update({ where: { id: admin.id }, data: { lastLoginAt: new Date() } });
  return { id: admin.id, email: admin.email };
}

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Renseignez votre adresse e-mail et votre mot de passe.", email };

  try {
    const admin = await checkCredentials(email, password);
    if (!admin) return { error: INVALID_CREDENTIALS, email };
    await startOtpChallenge(admin.id, admin.email);
  } catch (error) {
    console.error("[admin] login failed", error);
    return { error: UNAVAILABLE, email };
  }

  // redirect() throws, so it must stay outside the try/catch.
  redirect("/admin/verify");
}
