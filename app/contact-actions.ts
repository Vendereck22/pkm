"use server";

import { revalidatePath } from "next/cache";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { isContactPosition, positionLabel } from "@/lib/contact-positions";
import { clientIp, countHits, recordHit } from "@/lib/rate-limit";
import { isContactSubject } from "@/lib/contact-subjects";

// Les messages sont en anglais : la page d'accueil les traduit avec son dictionnaire, comme le reste du texte.
export type ContactFormState =
  // sentAt change à chaque envoi réussi : la page s'en sert pour vider le formulaire.
  | { status: "success"; sentAt: number }
  | { status: "error"; message: string; values: Record<string, string> }
  | undefined;

const LIMITS = { name: 160, email: 254, phone: 40, company: 160, positionOther: 120, country: 80, subjectDetail: 160, message: 5000 };
const MIN_MESSAGE_LENGTH = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Limite contre les envois en rafale : 10 demandes par adresse IP toutes les 10 minutes.
// Volontairement large : en RDC, beaucoup de visiteurs mobiles partagent la même adresse IP
// (opérateurs, cybercafés, bureaux).
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 10;

// Le site demande un « nom complet » ; la base range le premier mot en prénom et le reste en nom.
// Le panneau réaffiche les deux côte à côte, donc le nom saisi reste intact.
function splitFullName(fullName: string) {
  const [firstName, ...rest] = fullName.split(" ");
  return { firstName, lastName: rest.join(" ") };
}

// La base garde le libellé lisible, ou la fonction saisie à la main pour « Autre fonction ».
function positionFor(positionType: string, positionOther: string) {
  if (positionType === "other") return positionOther;
  return isContactPosition(positionType) ? positionLabel(positionType) : null;
}

export async function submitContactRequest(_state: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const read = (name: string) => String(formData.get(name) ?? "").trim();
  const values = {
    name: read("name").replace(/\s+/g, " "),
    email: read("email").toLowerCase(),
    phone: read("phone"),
    company: read("company"),
    positionType: read("positionType"),
    positionOther: read("positionOther"),
    country: read("country"),
    subject: read("subject"),
    subjectDetail: read("subjectDetail"),
    message: read("message"),
  };
  const fail = (message: string): ContactFormState => ({ status: "error", message, values });

  // Champ invisible pour les humains : s'il est rempli, c'est un robot. On fait comme si tout allait bien.
  if (read("pkm_hp")) return { status: "success", sentAt: Date.now() };

  if (!values.name) return fail("Please enter your full name.");
  if (!EMAIL_PATTERN.test(values.email)) return fail("Please enter a valid email address.");
  if (!isContactSubject(values.subject)) return fail("Please choose a subject.");
  if (values.subject === "other" && !values.subjectDetail) return fail("Please specify your request.");
  if (values.positionType && !isContactPosition(values.positionType)) return fail("Please choose a position.");
  if (values.positionType === "other" && !values.positionOther) return fail("Please specify your position.");
  if (values.message.length < MIN_MESSAGE_LENGTH) return fail("Your message is too short: please describe your request in a few words.");
  for (const [field, max] of Object.entries(LIMITS)) {
    if (values[field as keyof typeof LIMITS].length > max) return fail("One of the fields is too long.");
  }

  if (!isDatabaseConfigured()) return fail("Your request could not be sent because of a technical problem. Your text has been kept: please try again in a few minutes.");
  try {
    const rateKey = `contact:ip:${await clientIp()}`;
    if ((await countHits(rateKey, RATE_WINDOW_MS)) >= RATE_MAX) {
      return fail("You have sent several requests in a short time. Please wait a few minutes before sending a new one.");
    }
    await recordHit(rateKey);
    await getDb().contactRequest.create({
      data: {
        ...splitFullName(values.name),
        email: values.email,
        phone: values.phone || null,
        // Un particulier n'a pas d'entreprise, même si le champ avait été rempli avant de changer de choix.
        company: values.positionType === "individual" ? null : values.company || null,
        position: positionFor(values.positionType, values.positionOther),
        country: values.country || null,
        subject: values.subject,
        subjectDetail: values.subject === "other" ? values.subjectDetail : null,
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
