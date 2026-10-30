"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Eye, EyeOff, LoaderCircle, UserPlus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAdmin, type CreateAdminState } from "./actions";

const fieldClass =
  "h-10 rounded-[2px] border-[#dce3de] bg-white px-3 text-sm text-[#263e37] focus-visible:border-[#7b9c8c] focus-visible:ring-2 focus-visible:ring-[#0d3b32]/10 dark:border-[#315247] dark:bg-[#0f2621] dark:text-[#e0e9e3]";
const labelClass = "text-[11px] font-semibold text-[#354b43] dark:text-[#c9d8d0]";

// Aucun caractère ambigu (0/O, 1/l/I), pour que le mot de passe puisse être dicté ou recopié à la main.
const PASSWORD_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword(length = 16) {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length]).join("");
}

export function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdmin, undefined);
  // Une nouvelle clé après chaque succès vide tous les champs, mot de passe compris.
  return <CreateAdminFields key={state?.created ?? "new"} state={state} action={action} pending={pending} />;
}

type FieldsProps = {
  state: CreateAdminState;
  action: (formData: FormData) => void;
  pending: boolean;
};

function CreateAdminFields({ state, action, pending }: FieldsProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="admin-name" className={labelClass}>Nom affiché</Label>
          <Input id="admin-name" name="name" autoComplete="off" defaultValue={state?.values?.name} placeholder="Ex. Marc Nsikita" className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="admin-email" className={labelClass}>Adresse e-mail</Label>
          <Input id="admin-email" name="email" type="email" required autoComplete="off" defaultValue={state?.values?.email} className={fieldClass} />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="admin-role" className={labelClass}>Rôle</Label>
        <select
          id="admin-role"
          name="role"
          defaultValue={state?.values?.role ?? "ADMIN"}
          className={`${fieldClass} w-full border outline-none`}
        >
          <option value="ADMIN">Administrateur : consulte tout le panneau</option>
          <option value="OWNER">Administrateur principal : peut aussi gérer les comptes</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="admin-password" className={labelClass}>Mot de passe initial</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="admin-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={12}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${fieldClass} pr-20 font-mono`}
            />
            <div className="absolute inset-y-0 right-0 flex">
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="flex w-9 items-center justify-center text-[#63746c] hover:text-[#0d3b32] dark:text-[#a9bdb4]">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
              <button type="button" onClick={copyPassword} disabled={!password} aria-label="Copier le mot de passe" className="flex w-9 items-center justify-center text-[#63746c] hover:text-[#0d3b32] disabled:opacity-40 dark:text-[#a9bdb4]">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setPassword(generatePassword());
              setShowPassword(true);
            }}
            className="h-10 rounded-[2px] border-[#dce3de] bg-white px-3 text-xs text-[#0d3b32] dark:border-[#315247] dark:bg-[#0f2621] dark:text-[#e0e9e3]"
          >
            <Wand2 /> Générer
          </Button>
        </div>
        <p className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">
          12 caractères minimum. La personne reçoit un e-mail de bienvenue sans ce mot de passe : transmettez-le-lui par un canal sûr. À chaque connexion, elle recevra un code à son adresse.
        </p>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-[2px] border border-[#e8c3b0] bg-[#fbf1eb] px-3 py-2.5 text-xs text-[#8a3f16] dark:border-[#6b3a22] dark:bg-[#3a2217] dark:text-[#f1c6ad]">
          {state.error}
        </p>
      )}
      {state?.created && (
        <p role="status" className="rounded-[2px] border border-[#b9d6c6] bg-[#eef6f1] px-3 py-2.5 text-xs text-[#1f5a41] dark:border-[#2f5b47] dark:bg-[#123126] dark:text-[#a8dcc0]">
          Le compte {state.created} a été créé.{" "}
          {state.welcomeSent
            ? "Un e-mail de bienvenue lui a été envoyé avec le lien de connexion. Transmettez-lui le mot de passe à part."
            : "L’e-mail de bienvenue n’a pas pu partir : envoyez-lui vous-même le lien de connexion et le mot de passe."}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-full rounded-[2px] border-[#bd642d] bg-[#bd642d] text-xs font-semibold text-white hover:bg-[#d27a43] sm:w-fit sm:px-5"
      >
        {pending ? <LoaderCircle className="animate-spin" /> : <UserPlus />}
        {pending ? "Création…" : "Créer le compte"}
      </Button>
    </form>
  );
}
