import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getDb } from "@/lib/db";
import { isMailConfigured } from "@/lib/mailer";
import { OTP_DURATION_MS } from "@/lib/session";

// Les codes sont gardés en base : sur Vercel, l'envoi et la vérification passent souvent par des
// serveurs différents, qui ne partagent pas leur mémoire.

const MAX_ATTEMPTS = 5;
// Un renvoi ne redonne pas d'essais : au total, 5 codes proposés par connexion, quel que soit le nombre de renvois.
const MAX_RESENDS = 3;
const RESEND_COOLDOWN_MS = 30 * 1000;

// Un code de connexion ne peut pas servir à confirmer une nouvelle adresse, et inversement.
export type ChallengePurpose = "login" | "email-change";

function hashCode(challengeId: string, code: string) {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "").update(`${challengeId}:${code}`).digest("hex");
}

function newCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Tant qu'aucun serveur d'envoi n'est configuré, le code peut être affiché sur la page de
// vérification pour tester la connexion. Jamais en production, ni dès que le SMTP est configuré.
export function canRevealCode() {
  return process.env.NODE_ENV !== "production" && !isMailConfigured();
}

function devCodeFor(code: string) {
  return canRevealCode() ? code : null;
}

async function findActive(id: string) {
  const challenge = await getDb().otpChallenge.findUnique({ where: { id } });
  return challenge && challenge.expiresAt.getTime() > Date.now() ? challenge : null;
}

export async function createChallenge(adminId: string, email: string, purpose: ChallengePurpose = "login") {
  const db = getDb();
  // Ménage au passage : les codes expirés ne servent plus à rien.
  await db.otpChallenge.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  const id = randomBytes(16).toString("hex");
  const code = newCode();
  await db.otpChallenge.create({
    data: { id, adminId, email, purpose, codeHash: hashCode(id, code), expiresAt: new Date(Date.now() + OTP_DURATION_MS), devCode: devCodeFor(code) },
  });
  return { id, code };
}

export async function getChallengeEmail(id: string) {
  return (await findActive(id))?.email ?? null;
}

// Renvoie le code en cours, uniquement si canRevealCode() l'autorise.
export async function revealChallengeCode(id: string) {
  if (!canRevealCode()) return null;
  return (await findActive(id))?.devCode ?? null;
}

export type VerifyResult =
  | { status: "ok"; adminId: string; email: string }
  | { status: "invalid"; attemptsLeft: number }
  | { status: "expired" }
  | { status: "locked" };

export async function verifyChallenge(id: string, code: string, purpose: ChallengePurpose = "login"): Promise<VerifyResult> {
  const db = getDb();
  const challenge = await findActive(id);
  if (!challenge || challenge.purpose !== purpose) {
    await db.otpChallenge.deleteMany({ where: { id } });
    return { status: "expired" };
  }

  // L'essai est compté avant la comparaison, et seulement s'il en reste : même des essais
  // envoyés en parallèle ne peuvent pas dépasser MAX_ATTEMPTS.
  const counted = await db.otpChallenge.updateMany({ where: { id, attempts: { lt: MAX_ATTEMPTS } }, data: { attempts: { increment: 1 } } });
  if (counted.count === 0) {
    await db.otpChallenge.deleteMany({ where: { id } });
    return { status: "locked" };
  }

  if (timingSafeEqual(Buffer.from(challenge.codeHash, "hex"), Buffer.from(hashCode(id, code), "hex"))) {
    // deleteMany renvoie 0 si une requête parallèle a déjà utilisé ce code : un code ne sert qu'une fois.
    const used = await db.otpChallenge.deleteMany({ where: { id } });
    return used.count === 1 ? { status: "ok", adminId: challenge.adminId, email: challenge.email } : { status: "expired" };
  }

  const attempts = challenge.attempts + 1;
  if (attempts >= MAX_ATTEMPTS) {
    await db.otpChallenge.deleteMany({ where: { id } });
    return { status: "locked" };
  }
  return { status: "invalid", attemptsLeft: MAX_ATTEMPTS - attempts };
}

export type ResendResult =
  | { status: "ok"; email: string; code: string }
  | { status: "wait"; seconds: number }
  | { status: "limit" }
  | { status: "expired" };

// Émet un nouveau code pour la même vérification ; les codes précédents ne marchent plus.
export async function renewChallenge(id: string): Promise<ResendResult> {
  const challenge = await findActive(id);
  if (!challenge) return { status: "expired" };
  if (challenge.resendCount >= MAX_RESENDS) return { status: "limit" };

  const waitMs = challenge.sentAt.getTime() + RESEND_COOLDOWN_MS - Date.now();
  if (waitMs > 0) return { status: "wait", seconds: Math.ceil(waitMs / 1000) };

  const code = newCode();
  // La condition sur resendCount empêche deux renvois simultanés de passer tous les deux.
  const renewed = await getDb().otpChallenge.updateMany({
    where: { id, resendCount: challenge.resendCount },
    data: { codeHash: hashCode(id, code), devCode: devCodeFor(code), sentAt: new Date(), resendCount: { increment: 1 } },
  });
  if (renewed.count === 0) return { status: "wait", seconds: Math.ceil(RESEND_COOLDOWN_MS / 1000) };
  return { status: "ok", email: challenge.email, code };
}

export async function cancelChallenge(id: string) {
  await getDb().otpChallenge.deleteMany({ where: { id } });
}
