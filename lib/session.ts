import { SignJWT, jwtVerify, type JWTPayload } from "jose";

// Full admin session, issued only after the emailed code is confirmed.
export const SESSION_COOKIE = "pkm_admin_session";
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// Short-lived step between the password and the emailed code.
export const OTP_COOKIE = "pkm_admin_otp";
export const OTP_DURATION_MS = 10 * 60 * 1000;

export type SessionPayload = { adminId: string };
export type OtpPayload = { challengeId: string };

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set to at least 32 characters");
  return new TextEncoder().encode(secret);
}

// `purpose` stops an OTP token from being accepted as a session token and vice versa.
export async function signToken(payload: SessionPayload | OtpPayload, purpose: "session" | "otp", durationMs: number) {
  const expiresAt = new Date(Date.now() + durationMs);
  const token = await new SignJWT({ ...payload, purpose })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey());
  return { token, expiresAt };
}

// Returns null for a missing, tampered, expired or wrong-purpose token instead of throwing.
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
