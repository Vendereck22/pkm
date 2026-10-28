"use server";

import { redirect } from "next/navigation";
import { clearOtpChallenge, createSession, getOtpChallengeId } from "@/lib/auth";
import { sendOtpEmail } from "@/lib/mailer";
import { cancelChallenge, renewChallenge, revealChallengeCode, verifyChallenge } from "@/lib/otp";

export type VerifyState = { error?: string; expired?: boolean } | undefined;
export type ResendState = { message?: string; error?: string } | undefined;

const EXPIRED = "Ce code a expiré. Reconnectez-vous pour en recevoir un nouveau.";

export async function verifyCode(_state: VerifyState, formData: FormData): Promise<VerifyState> {
  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Saisissez les 6 chiffres du code." };

  const challengeId = await getOtpChallengeId();
  if (!challengeId) return { error: EXPIRED, expired: true };

  const result = verifyChallenge(challengeId, code);
  if (result.status === "expired") {
    await clearOtpChallenge();
    return { error: EXPIRED, expired: true };
  }
  if (result.status === "locked") {
    await clearOtpChallenge();
    return { error: "Trop de tentatives. Reconnectez-vous pour recevoir un nouveau code.", expired: true };
  }
  if (result.status === "invalid") {
    const tries = result.attemptsLeft > 1 ? `${result.attemptsLeft} tentatives restantes` : "dernière tentative";
    return { error: `Code incorrect (${tries}).` };
  }

  await createSession(result.adminId);
  redirect("/admin");
}

export async function resendCode(): Promise<ResendState> {
  const challengeId = await getOtpChallengeId();
  const result = challengeId ? renewChallenge(challengeId) : ({ status: "expired" } as const);

  if (result.status === "expired") return { error: EXPIRED };
  if (result.status === "wait") return { error: `Patientez ${result.seconds} s avant de demander un nouveau code.` };

  try {
    await sendOtpEmail(result.email, result.code);
  } catch (error) {
    console.error("[admin] resend code failed", error);
    return { error: "L’envoi du code a échoué. Réessayez dans quelques instants." };
  }
  return { message: "Un nouveau code vient d’être envoyé." };
}

// Développement uniquement : affiche le code en cours tant qu'aucun e-mail ne peut être envoyé.
export async function revealDevCode(): Promise<{ code?: string; error?: string }> {
  const challengeId = await getOtpChallengeId();
  const code = challengeId ? revealChallengeCode(challengeId) : null;
  return code ? { code } : { error: "Aucun code à afficher : reconnectez-vous pour en recevoir un nouveau." };
}

export async function cancelLogin() {
  const challengeId = await getOtpChallengeId();
  if (challengeId) cancelChallenge(challengeId);
  await clearOtpChallenge();
  redirect("/admin/login");
}
