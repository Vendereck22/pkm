// Sujets proposés par le formulaire de contact du site (valeurs du <select name="subject">).
export const CONTACT_SUBJECTS = [
  { value: "business", label: "Droit des affaires et contentieux", shortLabel: "Droit des affaires" },
  { value: "mining", label: "Titres miniers et carrières", shortLabel: "Mines et carrières" },
  { value: "trademark", label: "Marques et propriété intellectuelle", shortLabel: "Marques et PI" },
  { value: "other", label: "Autres demandes", shortLabel: "Autres demandes" },
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number]["value"];

export function isContactSubject(value: unknown): value is ContactSubject {
  return CONTACT_SUBJECTS.some((subject) => subject.value === value);
}

export function subjectLabel(value: string, short = false) {
  const subject = CONTACT_SUBJECTS.find((item) => item.value === value);
  if (!subject) return value;
  return short ? subject.shortLabel : subject.label;
}
