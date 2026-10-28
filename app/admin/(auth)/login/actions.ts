"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { startOtpChallenge } from "@/lib/auth";
import { ENV_ADMIN_ID, getEnvAdmin, isEnvAdminEmail, verifyEnvAdmin } from "@/lib/env-admin";

export type LoginState = { error?: string; email?: string } | undefined;

// Comparé quand l'e-mail est inconnu, pour que les deux cas prennent le même temps.
const DUMMY_HASH = "$2b$12$LzycbHyu8XUpqemqPnzSCeSieSotzUYTYBUQHzvgkkYVIfyNmYFtO";
const INVALID_CREDENTIALS = "Adresse e-mail ou mot de passe incorrect.";
const UNAVAILABLE = "Connexion impossible pour le moment. Réessayez dans quelques instants.";

// Cherche le compte en base. Si la base est injoignable, le compte du .env reste utilisable.
async function findDbAdmin(email: string) {
  if (!isDatabaseConfigured()) return null;
  try {
    return await getDb().admin.findUnique({ where: { email }, select: { id: true, email: true, passwordHash: true, disabledAt: true } });
  } catch (error) {
    if (isEnvAdminEmail(email)) return null;
    throw error;
  }
}

// Renvoie l'administrateur à qui envoyer un code, ou null si les identifiants sont faux.
async function checkCredentials(email: string, password: string) {
  const admin = await findDbAdmin(email);

  // Sans compte en base pour cette adresse, le compte du .env prend le relais. Dès qu'un compte
  // existe en base (créé depuis « Mon profil » par exemple), c'est lui qui est utilisé.
  if (!admin && isEnvAdminEmail(email)) {
    return verifyEnvAdmin(email, password) ? { id: ENV_ADMIN_ID, email: getEnvAdmin()!.email } : null;
  }

  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  // Un compte désactivé reçoit le même message, pour ne pas révéler qu'il existe.
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

  // redirect() lève une exception : il doit rester en dehors du try/catch.
  redirect("/admin/verify");
}
