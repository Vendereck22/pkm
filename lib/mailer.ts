import "server-only";
import nodemailer from "nodemailer";

function smtpConfig() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !MAIL_FROM) return null;
  const port = Number(SMTP_PORT ?? 465);
  return { host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASSWORD }, from: MAIL_FROM };
}

export function isMailConfigured() {
  return smtpConfig() !== null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

// Mise en page commune à tous les e-mails du panneau : bandeau vert PKM, sur-titre cuivre, contenu.
function brandedEmailHtml(kicker: string, content: string) {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f3f5f2;font-family:Arial,Helvetica,sans-serif;color:#233d36">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #dce4de">
      <tr><td style="background:#0d3b32;padding:20px 28px;color:#f4f5f0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;letter-spacing:.06em">PKM</td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0 0 6px;color:#bd642d;font-size:10px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase">${kicker}</p>
        ${content}
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

const paragraph = (text: string) => `<p style="margin:0 0 20px;font-size:14px;line-height:1.6">${text}</p>`;
const note = (text: string) => `<p style="margin:0;color:#63746c;font-size:12px;line-height:1.6">${text}</p>`;
const codeBlock = (code: string) =>
  `<p style="margin:0 0 20px;padding:14px 0;background:#f3f5f2;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:32px;letter-spacing:.3em;color:#0d3b32">${code}</p>`;

type Message = { to: string; subject: string; text: string; html: string };

async function sendMail(message: Message) {
  const config = smtpConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP is not configured");
    // Développement uniquement : pas encore de serveur d'envoi, le message s'affiche dans le terminal de `npm run dev`.
    console.info(`\n[admin] E-mail pour ${message.to} — ${message.subject}\n${message.text}\n`);
    return;
  }

  const { from, ...transport } = config;
  await nodemailer.createTransport(transport).sendMail({ from, ...message });
}

export function sendOtpEmail(to: string, code: string) {
  return sendMail({
    to,
    subject: `${code} est votre code de connexion PKM`,
    text: `Votre code de connexion au panneau d’administration du Cabinet PKM : ${code}\n\nCe code expire dans 10 minutes.`,
    html: brandedEmailHtml(
      "Code de connexion",
      paragraph("Voici votre code pour accéder au panneau d’administration du Cabinet PKM :") +
        codeBlock(code) +
        note("Ce code expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette connexion, changez votre mot de passe."),
    ),
  });
}

// Envoyé à la nouvelle adresse : elle ne remplace l'ancienne qu'une fois ce code saisi.
export function sendEmailChangeCode(to: string, code: string) {
  return sendMail({
    to,
    subject: `${code} : confirmez votre nouvelle adresse PKM`,
    text: `Pour utiliser cette adresse avec le panneau d’administration du Cabinet PKM, saisissez ce code : ${code}\n\nCe code expire dans 10 minutes. Si vous n’avez rien demandé, ignorez cet e-mail.`,
    html: brandedEmailHtml(
      "Nouvelle adresse e-mail",
      paragraph("Pour recevoir désormais vos codes de connexion du Cabinet PKM à cette adresse, saisissez ce code dans votre profil :") +
        codeBlock(code) +
        note("Ce code expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail : rien ne sera modifié."),
    ),
  });
}

type Welcome = { name: string | null; invitedBy: string; roleLabel: string; loginUrl: string };

// Prévient la personne qu'un compte lui a été ouvert. Le mot de passe n'y figure jamais :
// il lui est transmis à part, par la personne qui a créé le compte.
export function sendWelcomeEmail(to: string, { name, invitedBy, roleLabel, loginUrl }: Welcome) {
  const greeting = name ? `Bonjour ${name},` : "Bonjour,";
  return sendMail({
    to,
    subject: "Votre accès au panneau d’administration du Cabinet PKM",
    text: [
      greeting,
      "",
      `${invitedBy} vous a ouvert un accès au panneau d’administration du Cabinet PKM (${roleLabel}).`,
      `Connectez-vous ici : ${loginUrl}`,
      `Identifiant : ${to}`,
      "Votre mot de passe vous sera communiqué séparément. À chaque connexion, un code de vérification sera envoyé à cette adresse.",
    ].join("\n"),
    html: brandedEmailHtml(
      "Bienvenue",
      paragraph(escapeHtml(greeting)) +
        paragraph(`${escapeHtml(invitedBy)} vous a ouvert un accès au panneau d’administration du Cabinet PKM, en tant que <strong>${escapeHtml(roleLabel.toLowerCase())}</strong>.`) +
        `<p style="margin:0 0 20px"><a href="${escapeHtml(loginUrl)}" style="display:inline-block;padding:11px 20px;background:#bd642d;color:#ffffff;font-size:13px;font-weight:bold;text-decoration:none">Se connecter au panneau</a></p>` +
        paragraph(`Identifiant : <strong>${escapeHtml(to)}</strong><br />Votre mot de passe vous sera communiqué séparément.`) +
        note("À chaque connexion, un code de vérification à 6 chiffres sera envoyé à cette adresse. Si vous ne vous attendiez pas à cet accès, ignorez cet e-mail."),
    ),
  });
}
