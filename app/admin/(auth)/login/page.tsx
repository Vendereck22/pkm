import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion | Cabinet PKM",
};

export default function AdminLoginPage() {
  return (
    <>
      <p className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-[.14em] text-[#bd642d] uppercase">
        <ShieldCheck size={13} strokeWidth={1.8} /> Étape 1 sur 2
      </p>
      <h1 className="font-[Georgia,'Times_New_Roman',serif] text-[28px] leading-tight font-normal text-[#0d3b32] dark:text-[#f4f5f0]">
        Connectez-vous
      </h1>
      <p className="mt-2 mb-8 text-sm leading-relaxed text-[#63746c] dark:text-[#a9bdb4]">
        Saisissez l’adresse e-mail et le mot de passe de votre compte. Un code de vérification vous sera ensuite envoyé par e-mail.
      </p>

      <LoginForm />
    </>
  );
}
