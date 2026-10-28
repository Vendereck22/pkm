"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_SUBJECTS } from "@/lib/contact-subjects";
import { updateContactRequest } from "../../actions";

const fieldClass =
  "h-10 rounded-[2px] border-[#dce3de] bg-white px-3 text-sm text-[#263e37] focus-visible:border-[#7b9c8c] focus-visible:ring-2 focus-visible:ring-[#0d3b32]/10 dark:border-[#315247] dark:bg-[#0f2621] dark:text-[#e0e9e3]";
const labelClass = "text-[11px] font-semibold text-[#354b43] dark:text-[#c9d8d0]";

type EditableRequest = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  readAt: Date | null;
};

export function EditRequestForm({ request }: { request: EditableRequest }) {
  const [state, action, pending] = useActionState(updateContactRequest.bind(null, request.id), undefined);

  return (
    <form action={action} className="grid gap-5 rounded-[2px] border border-[#dce4de] bg-white p-6 dark:border-[#29443a] dark:bg-[#0f2621]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="firstName" className={labelClass}>Prénom</Label>
          <Input id="firstName" name="firstName" required maxLength={80} defaultValue={request.firstName} className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName" className={labelClass}>Nom</Label>
          <Input id="lastName" name="lastName" maxLength={80} defaultValue={request.lastName} className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="position" className={labelClass}>Poste</Label>
          <Input id="position" name="position" maxLength={120} defaultValue={request.position ?? ""} className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone" className={labelClass}>Téléphone</Label>
          <Input id="phone" name="phone" type="tel" maxLength={40} defaultValue={request.phone ?? ""} className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email" className={labelClass}>Adresse e-mail</Label>
          <Input id="email" name="email" type="email" required maxLength={254} defaultValue={request.email} className={fieldClass} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="subject" className={labelClass}>Sujet</Label>
          <select id="subject" name="subject" defaultValue={request.subject} className={`${fieldClass} w-full border outline-none`}>
            {CONTACT_SUBJECTS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="message" className={labelClass}>Message</Label>
        <Textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={8}
          defaultValue={request.message}
          className="min-h-40 rounded-[2px] border-[#dce3de] bg-white px-3 py-2.5 text-sm leading-relaxed text-[#263e37] focus-visible:border-[#7b9c8c] focus-visible:ring-2 focus-visible:ring-[#0d3b32]/10 dark:border-[#315247] dark:bg-[#0f2621] dark:text-[#e0e9e3]"
        />
      </div>

      <label className="flex items-center gap-2.5 text-xs text-[#354b43] dark:text-[#c9d8d0]">
        <input type="checkbox" name="unread" defaultChecked={!request.readAt} className="size-4 accent-[#bd642d]" />
        Marquer comme non lue
      </label>

      {state?.error && (
        <p role="alert" className="rounded-[2px] border border-[#e8c3b0] bg-[#fbf1eb] px-3 py-2.5 text-xs text-[#8a3f16] dark:border-[#6b3a22] dark:bg-[#3a2217] dark:text-[#f1c6ad]">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-10 rounded-[2px] border-[#bd642d] bg-[#bd642d] px-5 text-xs font-semibold text-white hover:bg-[#d27a43]"
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Save />}
          {pending ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
        <Link href={`/admin/demandes/${request.id}`} className="text-xs text-[#63746c] underline-offset-4 hover:underline dark:text-[#a9bdb4]">
          Annuler
        </Link>
      </div>
    </form>
  );
}
