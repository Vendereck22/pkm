"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { isContactSubject } from "@/lib/contact-subjects";
import { Prisma } from "@/lib/generated/prisma/client";

export type EditRequestState = { error?: string } | undefined;

const NOT_FOUND = "Cette demande n’existe plus : elle a peut-être été supprimée.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { firstName: 80, lastName: 80, position: 120, email: 254, phone: 40, message: 5000 };

// Le menu, la vue d'ensemble et les listes affichent des compteurs : tout le panneau est rafraîchi.
function refreshPanel() {
  revalidatePath("/admin", "layout");
}

export async function updateContactRequest(id: string, _state: EditRequestState, formData: FormData): Promise<EditRequestState> {
  await requireAdmin();

  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const data = {
    firstName: read("firstName"),
    lastName: read("lastName"),
    position: read("position"),
    email: read("email").toLowerCase(),
    phone: read("phone"),
    subject: read("subject"),
    message: read("message"),
  };

  if (!data.firstName) return { error: "Le prénom est obligatoire." };
  if (!EMAIL_PATTERN.test(data.email)) return { error: "Saisissez une adresse e-mail valide." };
  if (!isContactSubject(data.subject)) return { error: "Choisissez un sujet." };
  if (!data.message) return { error: "Le message ne peut pas être vide." };
  for (const [field, max] of Object.entries(LIMITS)) {
    if (data[field as keyof typeof LIMITS].length > max) return { error: "L’un des champs est trop long." };
  }

  try {
    const db = getDb();
    const current = await db.contactRequest.findUnique({ where: { id }, select: { readAt: true } });
    if (!current) return { error: NOT_FOUND };

    await db.contactRequest.update({
      where: { id },
      data: {
        ...data,
        position: data.position || null,
        phone: data.phone || null,
        // Case cochée : la demande repasse en « non lue ». Sinon, on garde la date de lecture d'origine.
        readAt: formData.get("unread") === "on" ? null : (current.readAt ?? new Date()),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") return { error: NOT_FOUND };
    console.error("[admin] update contact request failed", error);
    return { error: "Les modifications n’ont pas pu être enregistrées. Réessayez dans quelques instants." };
  }

  refreshPanel();
  // Ouvrir la fiche la marque comme lue : si elle doit rester « non lue », on revient à la liste.
  redirect(formData.get("unread") === "on" ? "/admin/demandes" : `/admin/demandes/${id}`);
}

// `backToList` : depuis la fiche d'une demande, on revient à la liste une fois celle-ci supprimée.
export async function deleteContactRequest(id: string, backToList: boolean) {
  await requireAdmin();
  // deleteMany ne lève pas d'erreur si la demande a déjà été supprimée par un autre administrateur.
  await getDb().contactRequest.deleteMany({ where: { id } });
  refreshPanel();
  if (backToList) redirect("/admin/demandes");
}
