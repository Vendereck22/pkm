"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { Camera, DatabaseZap, KeyRound, LoaderCircle, MailCheck, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminAvatar } from "../admin-avatar";
import {
  cancelEmailChange,
  changePassword,
  confirmEmailChange,
  moveEnvAccountToDatabase,
  updateAvatar,
  updateProfile,
  type ProfileState,
} from "./actions";

const fieldClass =
  "h-10 rounded-[2px] border-[#dce3de] bg-white px-3 text-sm text-[#263e37] focus-visible:border-[#7b9c8c] focus-visible:ring-2 focus-visible:ring-[#0d3b32]/10 dark:border-[#315247] dark:bg-[#0f2621] dark:text-[#e0e9e3]";
const labelClass = "text-[11px] font-semibold text-[#354b43] dark:text-[#c9d8d0]";
const cardClass = "rounded-[2px] border border-[#dce4de] bg-white p-6 dark:border-[#29443a] dark:bg-[#0f2621]";
const primaryButton = "h-10 rounded-[2px] border-[#bd642d] bg-[#bd642d] px-5 text-xs font-semibold text-white hover:bg-[#d27a43]";

function Feedback({ state }: { state: ProfileState }) {
  if (!state?.error && !state?.success) return null;
  return state.error ? (
    <p role="alert" className="rounded-[2px] border border-[#e8c3b0] bg-[#fbf1eb] px-3 py-2.5 text-xs text-[#8a3f16] dark:border-[#6b3a22] dark:bg-[#3a2217] dark:text-[#f1c6ad]">{state.error}</p>
  ) : (
    <p role="status" className="rounded-[2px] border border-[#b9d6c6] bg-[#eef6f1] px-3 py-2.5 text-xs text-[#1f5a41] dark:border-[#2f5b47] dark:bg-[#123126] dark:text-[#a8dcc0]">{state.success}</p>
  );
}

const AVATAR_SIZE = 256;

// Recadre l'image au centre en carré et la réduit à 256 × 256 px avant l'envoi.
async function resizeToAvatar(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.85);
}

type Profile = { name: string | null; email: string; avatar: string | null };

export function AvatarEditor({ profile }: { profile: Profile }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<ProfileState>(undefined);
  const [pending, startTransition] = useTransition();

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setState({ error: "Choisissez un fichier image (JPEG, PNG ou WebP)." });
    startTransition(async () => {
      try {
        setState(await updateAvatar(await resizeToAvatar(file)));
      } catch {
        setState({ error: "Cette image n’a pas pu être lue. Essayez avec une autre photo." });
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <div className="relative">
        <AdminAvatar name={profile.name} email={profile.email} avatar={profile.avatar} size={88} />
        {pending && (
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
            <LoaderCircle className="animate-spin text-white" size={22} />
          </span>
        )}
      </div>
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} aria-label="Choisir une photo" />
          <Button type="button" variant="outline" disabled={pending} onClick={() => inputRef.current?.click()} className="h-9 rounded-[2px] border-[#dce3de] bg-white text-xs text-[#0d3b32] dark:border-[#315247] dark:bg-transparent dark:text-[#e0e9e3]">
            <Camera /> {profile.avatar ? "Changer la photo" : "Ajouter une photo"}
          </Button>
          {profile.avatar && (
            <Button type="button" variant="ghost" disabled={pending} onClick={() => startTransition(async () => setState(await updateAvatar(null)))} className="h-9 rounded-[2px] text-xs text-[#8a3f16] hover:bg-[#fbf1eb] dark:text-[#f1c6ad]">
              <Trash2 /> Retirer
            </Button>
          )}
        </div>
        <p className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">JPEG, PNG ou WebP. L’image est recadrée en carré et réduite automatiquement.</p>
        <Feedback state={state} />
      </div>
    </div>
  );
}

type ProfileDetails = Profile & { jobTitle: string | null; phone: string | null };

export function ProfileForm({ profile }: { profile: ProfileDetails }) {
  const [state, action, pending] = useActionState(updateProfile, undefined);
  const [email, setEmail] = useState(profile.email);
  // Code envoyé à la nouvelle adresse, en attente de saisie. Réinitialisé à chaque enregistrement.
  const [dismissed, setDismissed] = useState<string | null>(null);
  // Message de l'adresse confirmée, affiché jusqu'au prochain enregistrement du formulaire.
  const [confirmed, setConfirmed] = useState<{ challengeId: string; message: string } | null>(null);
  const feedback = confirmed && state?.pending?.challengeId === confirmed.challengeId ? { success: confirmed.message } : state;
  const awaiting = state?.pending && state.pending.challengeId !== dismissed && state.pending.email === email.trim().toLowerCase() ? state.pending : null;
  const emailChanged = email.trim().toLowerCase() !== profile.email;

  function stopWaiting(resetEmail: boolean, message?: string) {
    if (!awaiting) return;
    setDismissed(awaiting.challengeId);
    if (message) setConfirmed({ challengeId: awaiting.challengeId, message });
    if (resetEmail) {
      setEmail(profile.email);
      void cancelEmailChange(awaiting.challengeId);
    }
  }

  return (
    <div className="grid gap-4">
      <form action={action} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="profile-name" className={labelClass}>Nom affiché</Label>
            <Input id="profile-name" name="name" maxLength={80} defaultValue={profile.name ?? ""} placeholder="Ex. Pierre Kasongo Makanda" className={fieldClass} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-job" className={labelClass}>Fonction</Label>
            <Input id="profile-job" name="jobTitle" maxLength={120} defaultValue={profile.jobTitle ?? ""} placeholder="Ex. Avocat associé" className={fieldClass} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-phone" className={labelClass}>Téléphone</Label>
            <Input id="profile-phone" name="phone" type="tel" maxLength={40} defaultValue={profile.phone ?? ""} placeholder="+243 …" className={fieldClass} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email" className={labelClass}>Adresse e-mail</Label>
            <Input id="profile-email" name="email" type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
          </div>
        </div>

        {emailChanged && !awaiting && (
          <div className="grid gap-2 rounded-[2px] border border-dashed border-[#c9d5cd] p-4 dark:border-[#315247]">
            <Label htmlFor="profile-current-password" className={labelClass}>Mot de passe actuel</Label>
            <Input id="profile-current-password" name="currentPassword" type="password" autoComplete="current-password" required className={fieldClass} />
            <p className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">
              Confirmez avec votre mot de passe : un code sera ensuite envoyé à la nouvelle adresse pour vérifier qu’elle vous appartient.
            </p>
          </div>
        )}

        {!awaiting && <Feedback state={feedback} />}
        {!awaiting && (
          <Button type="submit" disabled={pending} className={`${primaryButton} w-fit`}>
            {pending ? <LoaderCircle className="animate-spin" /> : <Save />} {pending ? "Enregistrement…" : "Enregistrer le profil"}
          </Button>
        )}
      </form>

      {awaiting && (
        <EmailChangeConfirm key={awaiting.challengeId} email={awaiting.email} challengeId={awaiting.challengeId} onDone={(message) => stopWaiting(false, message)} onCancel={() => stopWaiting(true)} />
      )}
    </div>
  );
}

type EmailChangeConfirmProps = { email: string; challengeId: string; onDone: (message: string) => void; onCancel: () => void };

function EmailChangeConfirm({ email, challengeId, onDone, onCancel }: EmailChangeConfirmProps) {
  const [state, action, pending] = useActionState(async (previous: ProfileState, formData: FormData) => {
    const result = await confirmEmailChange(challengeId, previous, formData);
    if (result?.success) onDone(result.success);
    return result;
  }, undefined);

  return (
    <form action={action} className="grid gap-3 rounded-[2px] border border-[#bd642d]/40 bg-[#fbf6f2] p-4 dark:border-[#6b3a22] dark:bg-[#2a1d16]">
      <div className="flex gap-3">
        <MailCheck size={18} strokeWidth={1.7} className="mt-0.5 shrink-0 text-[#bd642d]" />
        <p className="text-xs leading-relaxed text-[#354b43] dark:text-[#c9d8d0]">
          Vos informations sont enregistrées. Un code à 6 chiffres vient d’être envoyé à <strong>{email}</strong> : saisissez-le pour que cette adresse
          remplace l’ancienne. D’ici là, vos codes de connexion continuent d’arriver à l’adresse actuelle.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="grid gap-2">
          <Label htmlFor="email-change-code" className={labelClass}>Code reçu</Label>
          <Input
            id="email-change-code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={7}
            required
            autoFocus
            className={`${fieldClass} w-36 text-center font-mono tracking-[.3em]`}
          />
        </div>
        <Button type="submit" disabled={pending} className={primaryButton}>
          {pending ? <LoaderCircle className="animate-spin" /> : <MailCheck />} Confirmer l’adresse
        </Button>
        <Button type="button" variant="ghost" disabled={pending} onClick={onCancel} className="h-10 rounded-[2px] text-xs text-[#63746c] dark:text-[#a9bdb4]">
          Annuler
        </Button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    // Une nouvelle clé après un succès vide les trois champs.
    <form key={state?.success ? "done" : "form"} action={action} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="password-current" className={labelClass}>Mot de passe actuel</Label>
          <Input id="password-current" name="currentPassword" type="password" autoComplete="current-password" required className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password-new" className={labelClass}>Nouveau mot de passe</Label>
          <Input id="password-new" name="newPassword" type="password" autoComplete="new-password" required minLength={12} className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="password-confirm" className={labelClass}>Confirmer</Label>
          <Input id="password-confirm" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} className={fieldClass} />
        </div>
      </div>
      <p className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">12 caractères minimum.</p>
      <Feedback state={state} />
      <Button type="submit" disabled={pending} variant="outline" className="h-10 w-fit rounded-[2px] border-[#0d3b32]/30 bg-white px-5 text-xs font-semibold text-[#0d3b32] dark:border-[#e0e9e3]/30 dark:bg-transparent dark:text-[#e0e9e3]">
        {pending ? <LoaderCircle className="animate-spin" /> : <KeyRound />} Changer le mot de passe
      </Button>
    </form>
  );
}

export function MoveEnvAccount({ databaseReady }: { databaseReady: boolean }) {
  const [state, action, pending] = useActionState(async () => moveEnvAccountToDatabase(), undefined);
  return (
    <form action={action} className={`${cardClass} grid gap-4`}>
      <div className="flex gap-3">
        <DatabaseZap size={20} strokeWidth={1.6} className="mt-0.5 shrink-0 text-[#bd642d]" />
        <div className="grid gap-1.5 text-sm leading-relaxed text-[#354b43] dark:text-[#c9d8d0]">
          <p className="font-semibold text-[#0d3b32] dark:text-[#f4f5f0]">Vous êtes connecté avec le compte du fichier .env</p>
          <p>
            Ce compte n’existe pas dans la base de données, son profil ne peut donc pas être enregistré. Transférez-le en base : même adresse,
            même mot de passe, toujours administrateur principal. Vous pourrez ensuite modifier votre nom, votre photo et vos informations, puis
            retirer les lignes <code>ADMIN_*</code> du fichier .env.
          </p>
        </div>
      </div>
      <Feedback state={state} />
      <Button type="submit" disabled={pending || !databaseReady} className={`${primaryButton} w-fit`}>
        {pending ? <LoaderCircle className="animate-spin" /> : <DatabaseZap />} Enregistrer mon compte dans la base
      </Button>
      {!databaseReady && <p className="text-[11px] text-[#8a3f16] dark:text-[#f1c6ad]">La base de données n’est pas encore connectée.</p>}
    </form>
  );
}
