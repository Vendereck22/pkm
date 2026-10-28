"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { isContactSubject } from "@/lib/contact-subjects";

// Les messages sont en anglais : la page d'accueil les traduit avec son dictionnaire, comme le reste du texte.
export type ContactFormState =
  // sentAt change à chaque envoi réussi : la page s'en sert pour vider le formulaire.
  | { status: "success"; sentAt: number }
  | { status: "error"; message: string; values: Record<string, string> }
  | undefined;

const LIMITS = { name: 160, email: 254, phone: 40, message: 5000 };
const MIN_MESSAGE_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Limite contre les envois en rafale : 10 demandes par adresse IP toutes les 10 minutes.
// Volontairement large : en RDC, beaucoup de visiteurs mobiles partagent la même adresse IP
// (opérateurs, cybercafés, bureaux). En mémoire du serveur : suffisant pour un seul processus.
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 10;
const globalForContact = globalThis as unknown as { contactHits?: Map<string, number[]> };
const hits = (globalForContact.contactHits ??= new Map<string, number[]>());

function tooManyRequests(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    hits.set(ip, recent);
    return true;
  }
  hits.set(ip, [...recent, now]);
  return false;
}

// Le site demande un « nom complet » ; la base range le premier mot en prénom et le reste en nom.
// Le panneau réaffiche les deux côte à côte, donc le nom saisi reste intact.
function splitFullName(fullName: string) {
  const [firstName, ...rest] = fullName.split(" ");
  return { firstName, lastName: rest.join(" ") };
}

export async function submitContactRequest(_state: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    name: read("name").replace(/\s+/g, " "),
    email: read("email").toLowerCase(),
    phone: read("phone"),
    subject: read("subject"),
    message: read("message"),
  };
  const fail = (message: string): ContactFormState => ({ status: "error", message, values });

  // Champ invisible pour les humains : s'il est rempli, c'est un robot. On fait comme si tout allait bien.
  if (read("pkm_hp")) return { status: "success", sentAt: Date.now() };

  if (!values.name) return fail("Please enter your full name.");
  if (!EMAIL_PATTERN.test(values.email)) return fail("Please enter a valid email address.");
  if (!isContactSubject(values.subject)) return fail("Please choose a subject.");
  if (values.message.length < MIN_MESSAGE_LENGTH) return fail("Your message is too short: please describe your request in a few words.");
  for (const [field, max] of Object.entries(LIMITS)) {
    if (values[field as keyof typeof LIMITS].length > max) return fail("One of the fields is too long.");
  }

  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  if (tooManyRequests(ip)) return fail("You have sent several requests in a short time. Please wait a few minutes before sending a new one.");

  if (!isDatabaseConfigured()) return fail("Your request could not be sent because of a technical problem. Your text has been kept: please try again in a few minutes.");
  try {
    await getDb().contactRequest.create({
      data: {
        ...splitFullName(values.name),
        email: values.email,
        phone: values.phone || null,
        subject: values.subject,
        message: values.message,
      },
    });
  } catch (error) {
    console.error("[contact] saving the request failed", error);
    return fail("Your request could not be sent because of a technical problem. Your text has been kept: please try again in a few minutes.");
  }

  // Le panneau admin affiche la nouvelle demande au prochain chargement.
  revalidatePath("/admin", "layout");
  return { status: "success", sentAt: Date.now() };
}
