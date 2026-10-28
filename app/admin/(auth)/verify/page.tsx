import type { Metadata } from "next";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { getOtpChallengeId } from "@/lib/auth";
import { canRevealCode, getChallengeEmail } from "@/lib/otp";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = {
  title: "Code de vérification | Cabinet PKM",
};

// j***@pkm.cd : assez pour reconnaître l'adresse sans l'exposer.
function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  return `${user.slice(0, 1)}${"•".repeat(Math.max(user.length - 1, 2))}@${domain}`;
}

export default async function AdminVerifyPage() {
  const challengeId = await getOtpChallengeId();
  const email = challengeId ? getChallengeEmail(challengeId) : null;

  return (
    <>
      <p className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[.14em] text-[#bd642d] uppercase">
        <MailCheck size={13} strokeWidth={1.8} /> Étape 2 sur 2
      </p>
      <h1 className="font-[Georgia,'Times_New_Roman',serif] text-[28px] leading-tight font-normal text-[#0d3b32] dark:text-[#f4f5f0]">
        Vérifiez votre identité
      </h1>

      {email ? (
        <>
          <p className="mt-2 mb-8 text-sm leading-relaxed text-[#63746c] dark:text-[#a9bdb4]">
            Nous avons envoyé un code à 6 chiffres à <strong className="font-semibold text-[#233d36] dark:text-[#e0e9e3]">{maskEmail(email)}</strong>. Il expire dans 10 minutes.
          </p>
          <VerifyForm canRevealCode={canRevealCode()} />
        </>
      ) : (
        <>
          <p className="mt-2 mb-8 text-sm leading-relaxed text-[#63746c] dark:text-[#a9bdb4]">
            Cette demande de connexion a expiré ou n’est plus valable. Reconnectez-vous pour recevoir un nouveau code.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex h-11 w-full items-center justify-center rounded-[2px] bg-[#bd642d] text-xs font-semibold text-white no-underline transition-colors hover:bg-[#d27a43]"
          >
            Revenir à la connexion
          </Link>
        </>
      )}
    </>
  );
}
