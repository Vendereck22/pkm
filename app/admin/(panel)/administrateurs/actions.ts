"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ROLE_LABELS } from "@/lib/admins";
import { requireOwner } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { ENV_ADMIN_ID, getEnvAdmin, isEnvAdminEmail } from "@/lib/env-admin";
import { Prisma } from "@/lib/generated/prisma/client";
import { sendWelcomeEmail } from "@/lib/mailer";

export type CreateAdminState = { error?: string; created?: string; welcomeSent?: boolean; values?: { email: string; name: string; role: string } } | undefined;

const MIN_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NO_DATABASE = "La base de données n’est pas encore connectée : les nouveaux comptes y sont enregistrés.";

export async function createAdmin(_state: CreateAdminState, formData: FormData): Promise<CreateAdminState> {
  const owner = await requireOwner();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = formData.get("role") === "OWNER" ? "OWNER" : "ADMIN";
  const password = String(formData.get("password") ?? "");
  const values = { email, name, role };

  if (!EMAIL_PATTERN.test(email)) return { error: "Saisissez une adresse e-mail valide.", values };
  if (password.length < MIN_PASSWORD_LENGTH) return { error: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`, values };
  if (isEnvAdminEmail(email)) return { error: "Cette adresse est déjà celle de l’administrateur principal.", values };
  if (!isDatabaseConfigured()) return { error: NO_DATABASE, values };

  try {
    await getDb().admin.create({
      data: {
        email,
        name: name || null,
        role,
        passwordHash: await bcrypt.hash(password, 12),
        // Le compte du .env n'a pas de ligne en base vers laquelle pointer.
        createdById: owner.id === ENV_ADMIN_ID ? null : owner.id,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "Un administrateur utilise déjà cette adresse e-mail.", values };
    }
    console.error("[admin] create admin failed", error);
    return { error: "Le compte n’a pas pu être créé. Réessayez dans quelques instants.", values };
  }

  revalidatePath("/admin/administrateurs");

  // Le compte est créé même si l'e-mail de bienvenue ne part pas : le formulaire le signale.
  let welcomeSent = true;
  try {
    await sendWelcomeEmail(email, {
      name: name || null,
      invitedBy: owner.name ?? owner.email,
      roleLabel: ROLE_LABELS[role],
      loginUrl: `${await siteOrigin()}/admin/login`,
    });
  } catch (error) {
    console.error("[admin] welcome email failed", error);
    welcomeSent = false;
  }
  return { created: email, welcomeSent };
}

// Adresse publique du site, pour le lien de l'e-mail : celle de la requête en cours.
async function siteOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const protocol = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function setAdminDisabled(adminId: string, disabled: boolean) {
  const owner = await requireOwner();
  if (adminId === owner.id) return;

  const db = getDb();
  const target = await db.admin.findUnique({ where: { id: adminId }, select: { role: true } });
  if (!target) return;

  // Ne jamais laisser le panneau sans administrateur principal actif.
  if (disabled && target.role === "OWNER" && !getEnvAdmin()) {
    const otherOwners = await db.admin.count({ where: { role: "OWNER", disabledAt: null, id: { not: adminId } } });
    if (otherOwners === 0) return;
  }

  await db.admin.update({ where: { id: adminId }, data: { disabledAt: disabled ? new Date() : null } });
  revalidatePath("/admin/administrateurs");
}
