"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, requireAdmin } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { ENV_ADMIN_ID, getEnvAdminCredentials, isEnvAdminEmail } from "@/lib/env-admin";
import { Prisma } from "@/lib/generated/prisma/client";

export type ProfileState = { error?: string; success?: string } | undefined;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 12;
// La photo arrive déjà réduite par le navigateur ; cette limite bloque les envois anormaux.
const MAX_AVATAR_LENGTH = 300_000;
const AVATAR_PATTERN = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
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

export async function updateProfile(_state: ProfileState, formData: FormData): Promise<ProfileState> {
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
  }

  try {
    await db.admin.update({
      where: { id: admin.id },
      data: { name: name || null, jobTitle: jobTitle || null, phone: phone || null, email },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Un autre administrateur utilise déjà cette adresse e-mail." };
    }
    console.error("[admin] update profile failed", error);
    return { error: "Le profil n’a pas pu être enregistré. Réessayez dans quelques instants." };
  }

  refreshPanel();
  return { success: emailChanged ? "Profil enregistré. Les prochains codes de connexion seront envoyés à la nouvelle adresse." : "Profil enregistré." };
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
