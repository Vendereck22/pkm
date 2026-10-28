"use client";

import Link from "next/link";
import { useActionState, useRef, useState, useTransition } from "react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { ArrowUpRight, Eye, FlaskConical, LoaderCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";
import { cancelLogin, resendCode, revealDevCode, verifyCode } from "./actions";

const slotClass =
  "size-12 border-[#dce3de] bg-white font-[Georgia,'Times_New_Roman',serif] text-xl text-[#0d3b32] first:rounded-l-[2px] last:rounded-r-[2px] data-[active=true]:border-[#7b9c8c] data-[active=true]:ring-2 data-[active=true]:ring-[#0d3b32]/10 sm:size-[52px] dark:border-[#315247] dark:bg-[#0f2621] dark:text-[#f4f5f0]";

export function VerifyForm({ canRevealCode }: { canRevealCode: boolean }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [code, setCode] = useState("");
  const [state, action, pending] = useActionState(verifyCode, undefined);
  const [resendState, resend, resending] = useActionState(resendCode, undefined);
  const [revealed, setRevealed] = useState<{ code?: string; error?: string } | null>(null);
  const [revealing, startReveal] = useTransition();

  function showCode() {
    startReveal(async () => setRevealed(await revealDevCode()));
  }

  // Remplit les cases avec le code affiché puis valide, comme si on l'avait tapé.
  function fillRevealedCode(value: string) {
    setCode(value);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  if (state?.expired) {
    return (
      <div className="grid gap-5">
        <p role="alert" className="rounded-[2px] border border-[#e8c3b0] bg-[#fbf1eb] px-3 py-2.5 text-xs leading-relaxed text-[#8a3f16] dark:border-[#6b3a22] dark:bg-[#3a2217] dark:text-[#f1c6ad]">
          {state.error}
        </p>
        <Link href="/admin/login" className="inline-flex h-11 items-center justify-center rounded-[2px] bg-[#bd642d] text-xs font-semibold text-white no-underline hover:bg-[#d27a43]">
          Revenir à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <form
        ref={formRef}
        // Vide les cases à chaque essai pour pouvoir retaper directement un code faux.
        action={(formData) => {
          setCode("");
          action(formData);
        }}
        className="grid gap-5"
      >
        <InputOTP
          name="code"
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={code}
          onChange={setCode}
          // Envoie dès que le sixième chiffre est tapé ou collé.
          onComplete={() => formRef.current?.requestSubmit()}
          autoFocus
          autoComplete="one-time-code"
          inputMode="numeric"
          aria-label="Code de vérification à 6 chiffres"
          aria-invalid={state?.error ? true : undefined}
          disabled={pending}
          containerClassName="justify-between"
        >
          <InputOTPGroup>
            {[0, 1, 2].map((index) => <InputOTPSlot key={index} index={index} className={slotClass} />)}
          </InputOTPGroup>
          <InputOTPSeparator className="text-[#9db4aa]" />
          <InputOTPGroup>
            {[3, 4, 5].map((index) => <InputOTPSlot key={index} index={index} className={slotClass} />)}
          </InputOTPGroup>
        </InputOTP>

        {state?.error && (
          <p role="alert" className="rounded-[2px] border border-[#e8c3b0] bg-[#fbf1eb] px-3 py-2.5 text-xs leading-relaxed text-[#8a3f16] dark:border-[#6b3a22] dark:bg-[#3a2217] dark:text-[#f1c6ad]">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending || code.length !== 6}
          className="h-11 w-full rounded-[2px] border-[#bd642d] bg-[#bd642d] text-xs font-semibold text-white hover:bg-[#d27a43]"
        >
          {pending ? <LoaderCircle className="animate-spin" /> : null}
          {pending ? "Vérification…" : "Valider le code"}
          {pending ? null : <ArrowUpRight size={13} />}
        </Button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <form
          // Un nouveau code rend l'ancien inutilisable : on masque celui qui était affiché.
          action={() => {
            setRevealed(null);
            resend();
          }}
        >
          <button type="submit" disabled={resending} className="inline-flex items-center gap-1.5 font-semibold text-[#0d3b32] underline-offset-4 hover:underline disabled:opacity-50 dark:text-[#e0e9e3]">
            <RotateCw size={12} className={resending ? "animate-spin" : undefined} /> Renvoyer le code
          </button>
        </form>
        <form action={cancelLogin}>
          <button type="submit" className="text-[#63746c] underline-offset-4 hover:underline dark:text-[#a9bdb4]">
            Changer de compte
          </button>
        </form>
      </div>

      {(resendState?.message || resendState?.error) && (
        <p role="status" className={`text-xs ${resendState.error ? "text-[#8a3f16] dark:text-[#f1c6ad]" : "text-[#2f6b53] dark:text-[#9fd3b8]"}`}>
          {resendState.error ?? resendState.message}
        </p>
      )}

      {canRevealCode && (
        <div className="rounded-[2px] border border-dashed border-[#c9d5cd] bg-white px-4 py-3.5 dark:border-[#315247] dark:bg-[#0f2621]">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[.12em] text-[#bd642d] uppercase">
            <FlaskConical size={12} /> Mode test
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-[#63746c] dark:text-[#a9bdb4]">
            Aucun serveur d’envoi n’est configuré : affichez ici le code qui aurait été envoyé par e-mail. Ce bouton disparaît dès que le SMTP est configuré, et n’existe jamais en production.
          </p>

          {revealed?.code ? (
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className="font-[Georgia,'Times_New_Roman',serif] text-2xl tracking-[.3em] text-[#0d3b32] dark:text-[#f4f5f0]" aria-label={`Code : ${revealed.code.split("").join(" ")}`}>
                {revealed.code}
              </span>
              <button
                type="button"
                onClick={() => fillRevealedCode(revealed.code!)}
                disabled={pending}
                className="inline-flex h-8 items-center gap-1.5 rounded-[2px] bg-[#0d3b32] px-3 text-[11px] font-semibold text-white hover:bg-[#145244] disabled:opacity-50 dark:bg-[#e0e9e3] dark:text-[#0d3b32]"
              >
                Utiliser ce code <ArrowUpRight size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={showCode}
              disabled={revealing}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[2px] border border-[#0d3b32]/25 px-3 text-[11px] font-semibold text-[#0d3b32] hover:bg-[#0d3b32]/5 disabled:opacity-50 dark:border-[#e0e9e3]/30 dark:text-[#e0e9e3]"
            >
              {revealing ? <LoaderCircle size={12} className="animate-spin" /> : <Eye size={12} />} Afficher le code
            </button>
          )}
          {revealed?.error && <p role="alert" className="mt-2 text-[11px] text-[#8a3f16] dark:text-[#f1c6ad]">{revealed.error}</p>}
        </div>
      )}
    </div>
  );
}
