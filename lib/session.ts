import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Session admin complète, délivrée seulement après confirmation du code reçu par e-mail.
export const SESSION_COOKIE = "pkm_admin_session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// Étape de courte durée entre le mot de passe et le code reçu par e-mail.
export const OTP_COOKIE = "pkm_admin_otp";
export const OTP_DURATION_MS = 10 * 60 * 1000;

export type SessionPayload = { adminId: string };
export type OtpPayload = { challengeId: string };

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(secret);
}

// `purpose` empêche qu'un jeton OTP soit accepté comme jeton de session, et inversement.
export async function signToken(payload: SessionPayload | OtpPayload, purpose: "session" | "otp", durationMs: number) {
  const expiresAt = new Date(Date.now() + durationMs);
  const token = await new SignJWT({ ...payload, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
  return { token, expiresAt };
}

// Renvoie null pour un jeton absent, falsifié, expiré ou d'un autre usage, au lieu de lever une erreur.
export async function verifyToken<T extends SessionPayload | OtpPayload>(token: string | undefined, purpose: "session" | "otp") {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<T & JWTPayload & { purpose: string }>(token, secretKey(), { algorithms: ["HS256"] });
    return payload.purpose === purpose ? payload : null;
  } catch {
    return null;
  }
}

export const decryptSession = (token: string | undefined) => verifyToken<SessionPayload>(token, "session");
export const decryptOtp = (token: string | undefined) => verifyToken<OtpPayload>(token, "otp");
