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

function otpEmailHtml(code: string) {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f3f5f2;font-family:Arial,Helvetica,sans-serif;color:#233d36">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #dce4de">
      <tr><td style="background:#0d3b32;padding:20px 28px;color:#f4f5f0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:bold;letter-spacing:.06em">PKM</td></tr>
      <tr><td style="padding:28px">
        <p style="margin:0 0 6px;color:#bd642d;font-size:10px;font-weight:bold;letter-spacing:.14em;text-transform:uppercase">Code de connexion</p>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6">Voici votre code pour accéder au panneau d’administration du Cabinet PKM :</p>
        <p style="margin:0 0 20px;padding:14px 0;background:#f3f5f2;text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:32px;letter-spacing:.3em;color:#0d3b32">${code}</p>
        <p style="margin:0;color:#63746c;font-size:12px;line-height:1.6">Ce code expire dans 10 minutes. Si vous n’êtes pas à l’origine de cette connexion, changez votre mot de passe.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export async function sendOtpEmail(to: string, code: string) {
  const config = smtpConfig();

  if (!config) {
    if (process.env.NODE_ENV === "production") throw new Error("SMTP is not configured");
    // Développement uniquement : pas encore de serveur d'envoi, le code s'affiche dans le terminal de `npm run dev`.
    console.info(`\n[admin] Code de connexion pour ${to} : ${code}\n`);
    return;
  }

  const { from, ...transport } = config;
  await nodemailer.createTransport(transport).sendMail({
    from,
    to,
    subject: `${code} est votre code de connexion PKM`,
    text: `Votre code de connexion au panneau d’administration du Cabinet PKM : ${code}\n\nCe code expire dans 10 minutes.`,
    html: otpEmailHtml(code),
  });
}
