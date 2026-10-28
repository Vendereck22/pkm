import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { ENV_ADMIN_ID, getEnvAdmin } from "@/lib/env-admin";
import type { AdminRole } from "@/lib/generated/prisma/client";
import { sendOtpEmail } from "@/lib/mailer";
import { createChallenge } from "@/lib/otp";
import { OTP_COOKIE, OTP_DURATION_MS, SESSION_COOKIE, SESSION_DURATION_MS, decryptOtp, decryptSession, signToken } from "@/lib/session";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// Étape 1 → 2 : le mot de passe est bon, on envoie un code par e-mail et on mémorise la vérification en attente.
export async function startOtpChallenge(adminId: string, email: string) {
  const { id, code } = createChallenge(adminId, email);
  await sendOtpEmail(email, code);
  const { token, expiresAt } = await signToken({ challengeId: id }, "otp", OTP_DURATION_MS);
  (await cookies()).set(OTP_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export async function getOtpChallengeId() {
  const payload = await decryptOtp((await cookies()).get(OTP_COOKIE)?.value);
  return payload?.challengeId ?? null;
}

export async function clearOtpChallenge() {
  (await cookies()).delete(OTP_COOKIE);
}

// Étape 2 → panneau : le code est bon, on ouvre la vraie session.
export async function createSession(adminId: string) {
  const { token, expiresAt } = await signToken({ adminId }, "session", SESSION_DURATION_MS);
  const cookieStore = await cookies();
  cookieStore.delete(OTP_COOKIE);
  cookieStore.set(SESSION_COOKIE, token, { ...cookieOptions, expires: expiresAt });
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export type CurrentAdmin = { id: string; email: string; name: string | null; role: AdminRole; avatar: string | null };

// Ici le cookie est encore correctement signé : le proxy renverrait /admin/login vers
// /admin. Cette route l'efface d'abord, ce qui évite une boucle de redirections.
const END_SESSION_PATH = "/admin/logout";

// Le proxy ne vérifie que la signature du cookie ; les pages confirment aussi que l'administrateur existe toujours et est actif.
export const requireAdmin = cache(async (): Promise<CurrentAdmin> => {
  const session = await decryptSession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) redirect("/admin/login");

  if (session.adminId === ENV_ADMIN_ID) {
    // Retirer le compte du .env met aussi fin à ses sessions ouvertes.
    const envAdmin = getEnvAdmin();
    if (!envAdmin) redirect(END_SESSION_PATH);
    return { ...envAdmin, avatar: null };
  }

  const admin = await getDb().admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true, name: true, role: true, avatar: true, disabledAt: true },
  });
  if (!admin || admin.disabledAt) redirect(END_SESSION_PATH);
  return { id: admin.id, email: admin.email, name: admin.name, role: admin.role, avatar: admin.avatar };
});

export async function requireOwner() {
  const admin = await requireAdmin();
  if (admin.role !== "OWNER") redirect("/admin");
  return admin;
}
