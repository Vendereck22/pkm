import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { isMailConfigured } from "@/lib/mailer";
import { OTP_DURATION_MS } from "@/lib/session";

// Les codes sont gardés en mémoire du serveur tant que la base n'existe pas. Cela marche avec
// `next dev` et un seul processus `next start`, mais pas sur plusieurs instances serverless :
// déplacer les vérifications dans une table avant de déployer sur ce type d'hébergement.

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 30 * 1000;

type Challenge = {
  adminId: string;
  email: string;
  codeHash: Buffer;
  expiresAt: number;
  attempts: number;
  sentAt: number;
  // Code en clair, gardé seulement quand il peut être affiché à l'écran (voir canRevealCode).
  devCode?: string;
};

const globalForOtp = globalThis as unknown as { otpChallenges?: Map<string, Challenge> };
const challenges = (globalForOtp.otpChallenges ??= new Map());

function hashCode(challengeId: string, code: string) {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "").update(`${challengeId}:${code}`).digest();
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
  return canRevealCode() ? code : undefined;
}

function purgeExpired() {
  const now = Date.now();
  for (const [id, challenge] of challenges) if (challenge.expiresAt < now) challenges.delete(id);
}

export function createChallenge(adminId: string, email: string) {
  purgeExpired();
  const id = randomBytes(16).toString("hex");
  const code = newCode();
  const now = Date.now();
  challenges.set(id, { adminId, email, codeHash: hashCode(id, code), expiresAt: now + OTP_DURATION_MS, attempts: 0, sentAt: now, devCode: devCodeFor(code) });
  return { id, code };
}

export function getChallengeEmail(id: string) {
  const challenge = challenges.get(id);
  return challenge && challenge.expiresAt > Date.now() ? challenge.email : null;
}

// Renvoie le code en cours, uniquement si canRevealCode() l'autorise.
export function revealChallengeCode(id: string) {
  if (!canRevealCode()) return null;
  const challenge = challenges.get(id);
  return challenge && challenge.expiresAt > Date.now() ? (challenge.devCode ?? null) : null;
}

export type VerifyResult =
  | { status: "ok"; adminId: string }
  | { status: "invalid"; attemptsLeft: number }
  | { status: "expired" }
  | { status: "locked" };

export function verifyChallenge(id: string, code: string): VerifyResult {
  const challenge = challenges.get(id);
  if (!challenge || challenge.expiresAt < Date.now()) {
    challenges.delete(id);
    return { status: "expired" };
  }

  if (timingSafeEqual(challenge.codeHash, hashCode(id, code))) {
    challenges.delete(id);
    return { status: "ok", adminId: challenge.adminId };
  }

  challenge.attempts += 1;
  if (challenge.attempts >= MAX_ATTEMPTS) {
    challenges.delete(id);
    return { status: "locked" };
  }
  return { status: "invalid", attemptsLeft: MAX_ATTEMPTS - challenge.attempts };
}

export type ResendResult = { status: "ok"; email: string; code: string } | { status: "wait"; seconds: number } | { status: "expired" };

// Émet un nouveau code pour la même vérification ; les codes précédents ne marchent plus.
export function renewChallenge(id: string): ResendResult {
  const challenge = challenges.get(id);
  if (!challenge || challenge.expiresAt < Date.now()) return { status: "expired" };

  const waitMs = challenge.sentAt + RESEND_COOLDOWN_MS - Date.now();
  if (waitMs > 0) return { status: "wait", seconds: Math.ceil(waitMs / 1000) };

  const code = newCode();
  challenge.codeHash = hashCode(id, code);
  challenge.devCode = devCodeFor(code);
  challenge.sentAt = Date.now();
  challenge.attempts = 0;
  return { status: "ok", email: challenge.email, code };
}

export function cancelChallenge(id: string) {
  challenges.delete(id);
}
