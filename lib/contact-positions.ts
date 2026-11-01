// Fonctions proposées par le formulaire de contact du site (valeurs du <select name="positionType">).
// La base enregistre le libellé français, ou le texte saisi pour « Autre fonction ».
export const CONTACT_POSITIONS = [
  { value: "individual", label: "Particulier" },
  { value: "executive", label: "Dirigeant / gérant" },
  { value: "legal", label: "Juriste / responsable juridique" },
  { value: "staff", label: "Cadre / employé" },
  { value: "other", label: "Autre fonction" },
] as const;

export type ContactPosition = (typeof CONTACT_POSITIONS)[number]["value"];

export function isContactPosition(value: unknown): value is ContactPosition {
  return CONTACT_POSITIONS.some((position) => position.value === value);
}

export function positionLabel(value: ContactPosition) {
  return CONTACT_POSITIONS.find((position) => position.value === value)!.label;
}
