"use client";

import { useActionState, useState } from "react";
import { ArrowUpRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "./actions";

const fieldClass =
  "h-11 rounded-[2px] border-[#dce3de] bg-white px-3 text-sm text-[#263e37] focus-visible:border-[#7b9c8c] focus-visible:ring-2 focus-visible:ring-[#0d3b32]/10 dark:border-[#315247] dark:bg-[#0f2621] dark:text-[#e0e9e3]";
const labelClass = "text-[11px] font-semibold text-[#354b43] dark:text-[#c9d8d0]";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="email" className={labelClass}>Adresse e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state?.email}
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "login-error" : undefined}
          className={fieldClass}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password" className={labelClass}>Mot de passe</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={state?.error ? true : undefined}
            aria-describedby={state?.error ? "login-error" : undefined}
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[#63746c] transition-colors hover:text-[#0d3b32] dark:text-[#a9bdb4] dark:hover:text-white"
          >
            {showPassword ? <EyeOff size={16} strokeWidth={1.7} /> : <Eye size={16} strokeWidth={1.7} />}
          </button>
        </div>
      </div>

      {state?.error && (
        <p id="login-error" role="alert" className="rounded-[2px] border border-[#e8c3b0] bg-[#fbf1eb] px-3 py-2.5 text-xs leading-relaxed text-[#8a3f16] dark:border-[#6b3a22] dark:bg-[#3a2217] dark:text-[#f1c6ad]">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 w-full rounded-[2px] border-[#bd642d] bg-[#bd642d] text-xs font-semibold text-white hover:bg-[#d27a43]"
      >
        {pending ? <LoaderCircle className="animate-spin" /> : null}
        {pending ? "Connexion…" : "Se connecter"}
        {pending ? null : <ArrowUpRight size={13} />}
      </Button>
    </form>
  );
}
