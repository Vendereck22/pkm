"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, requireAdmin } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { ENV_ADMIN_ID, getEnvAdminCredentials, isEnvAdminEmail } from "@/lib/env-admin";
import { Prisma } from "@/lib/generated/prisma/client";
import { sendEmailChangeCode } from "@/lib/mailer";
import { cancelChallenge, createChallenge, verifyChallenge } from "@/lib/otp";

export type ProfileState = { error?: string; success?: string } | undefined;
// `pending` : la nouvelle adresse attend le code qui vient de lui être envoyé.
export type ProfileFormState = (ProfileState & { pending?: { email: string; challengeId: string } }) | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 12;
// La photo arrive déjà réduite par le navigateur ; cette limite bloque les envois anormaux.
const MAX_AVATAR_LENGTH = 300_000;
const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
const EMAIL_TAKEN = "Un autre administrateur utilise déjà cette adresse e-mail.";
const ENV_ACCOUNT = "Ce compte vient du fichier .env : enregistrez-le d’abord dans la base pour modifier votre profil.";

// Le nom et la photo apparaissent dans le menu de toutes les pages du panneau.
function refreshPanel() {
  revalidatePath("/admin", "layout");
}

// Le profil n'existe que pour les comptes enregistrés en base.
async function requireDatabaseAdmin() {
  const admin = await requireAdmin();
  return admin.id === ENV_ADMIN_ID ? null : admin;
}

export async function updateProfile(_state: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const admin = await requireDatabaseAdmin();
  if (!admin) return { error: ENV_ACCOUNT };

  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const name = read("name");
  const jobTitle = read("jobTitle");
  const phone = read("phone");
  const email = read("email").toLowerCase();
  const currentPassword = String(formData.get("currentPassword") ?? "");

  if (name.length > 80 || jobTitle.length > 120 || phone.length > 40) return { error: "L’un des champs est trop long." };
  if (!EMAIL_PATTERN.test(email)) return { error: "Saisissez une adresse e-mail valide." };

  const db = getDb();
  const emailChanged = email !== admin.email;
  if (emailChanged) {
    // Les codes de connexion partent vers cette adresse : on vérifie que c'est bien vous.
    if (!currentPassword) return { error: "Pour changer d’adresse e-mail, saisissez votre mot de passe actuel." };
    const row = await db.admin.findUnique({ where: { id: admin.id }, select: { passwordHash: true } });
    if (!row || !(await bcrypt.compare(currentPassword, row.passwordHash))) return { error: "Mot de passe actuel incorrect." };
    if (isEnvAdminEmail(email)) return { error: "Cette adresse est réservée au compte du fichier .env." };
    if (await db.admin.findUnique({ where: { email }, select: { id: true } })) return { error: EMAIL_TAKEN };
  }

  try {
    // L'adresse n'est pas enregistrée ici : elle ne change qu'une fois le code confirmé.
    await db.admin.update({ where: { id: admin.id }, data: { name: name || null, jobTitle: jobTitle || null, phone: phone || null } });
  } catch (error) {
    console.error("[admin] update profile failed", error);
    return { error: "Le profil n’a pas pu être enregistré. Réessayez dans quelques instants." };
  }
  refreshPanel();

  if (!emailChanged) return { success: "Profil enregistré." };

  const challenge = createChallenge(admin.id, email, "email-change");
  try {
    await sendEmailChangeCode(email, challenge.code);
  } catch (error) {
    cancelChallenge(challenge.id);
    console.error("[admin] email change code failed", error);
    return { error: "Vos informations sont enregistrées, mais le code n’a pas pu être envoyé à la nouvelle adresse. Vérifiez-la et réessayez." };
  }
  return { pending: { email, challengeId: challenge.id } };
}

// Deuxième étape du changement d'adresse : le code reçu prouve que la nouvelle boîte vous appartient.
export async function confirmEmailChange(challengeId: string, _state: ProfileState, formData: FormData): Promise<ProfileState> {
  const admin = await requireDatabaseAdmin();
  if (!admin) return { error: ENV_ACCOUNT };

  const code = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (code.length !== 6) return { error: "Saisissez les 6 chiffres du code." };

  const result = verifyChallenge(challengeId, code, "email-change");
  if (result.status === "invalid") {
    return { error: `Code incorrect (${result.attemptsLeft > 1 ? `${result.attemptsLeft} tentatives restantes` : "dernière tentative"}).` };
  }
  if (result.status !== "ok" || result.adminId !== admin.id) {
    return { error: "Ce code n’est plus valable. Enregistrez à nouveau le profil pour en recevoir un autre." };
  }

  try {
    await getDb().admin.update({ where: { id: admin.id }, data: { email: result.email } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: EMAIL_TAKEN };
    console.error("[admin] confirm email change failed", error);
    return { error: "L’adresse n’a pas pu être enregistrée. Réessayez dans quelques instants." };
  }

  refreshPanel();
  return { success: `Adresse confirmée. Vos prochains codes de connexion seront envoyés à ${result.email}.` };
}

export async function cancelEmailChange(challengeId: string) {
  await requireDatabaseAdmin();
  cancelChallenge(challengeId);
}

// `avatar` à null retire la photo.
export async function updateAvatar(avatar: string | null): Promise<ProfileState> {
  const admin = await requireDatabaseAdmin();
  if (!admin) return { error: ENV_ACCOUNT };
  if (avatar !== null && (avatar.length > MAX_AVATAR_LENGTH || !AVATAR_PATTERN.test(avatar))) {
    return { error: "Image non valide. Choisissez une photo JPEG, PNG ou WebP." };
  }

  await getDb().admin.update({ where: { id: admin.id }, data: { avatar } });
  refreshPanel();
  return { success: avatar ? "Photo mise à jour." : "Photo retirée." };
}

export async function changePassword(_state: ProfileState, formData: FormData): Promise<ProfileState> {
  const admin = await requireDatabaseAdmin();
  if (!admin) return { error: ENV_ACCOUNT };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < MIN_PASSWORD_LENGTH) return { error: `Le nouveau mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.` };
  if (newPassword !== confirmPassword) return { error: "Les deux nouveaux mots de passe ne correspondent pas." };

  const db = getDb();
  const row = await db.admin.findUnique({ where: { id: admin.id }, select: { passwordHash: true } });
  if (!row || !(await bcrypt.compare(currentPassword, row.passwordHash))) return { error: "Mot de passe actuel incorrect." };

  await db.admin.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash(newPassword, 12) } });
  return { success: "Mot de passe modifié." };
}

// Copie le compte du .env en base (même e-mail, même mot de passe, administrateur principal),
// puis bascule la session dessus. Les connexions suivantes utiliseront ce compte en base.
export async function moveEnvAccountToDatabase(): Promise<ProfileState> {
  const admin = await requireAdmin();
  const credentials = getEnvAdminCredentials();
  if (admin.id !== ENV_ADMIN_ID || !credentials) return { error: "Seul le compte du fichier .env peut être transféré." };
  if (!isDatabaseConfigured()) return { error: "La base de données n’est pas encore connectée." };

  let accountId: string;
  try {
    const passwordHash = await bcrypt.hash(credentials.password, 12);
    const account = await getDb().admin.upsert({
      where: { email: credentials.email },
      create: { email: credentials.email, name: credentials.name, passwordHash, role: "OWNER", lastLoginAt: new Date() },
      update: { role: "OWNER", disabledAt: null },
    });
    accountId = account.id;
  } catch (error) {
    console.error("[admin] moving the .env account failed", error);
    return { error: "Le compte n’a pas pu être enregistré. Réessayez dans quelques instants." };
  }

  await createSession(accountId);
  refreshPanel();
  redirect("/admin/profil");
}
