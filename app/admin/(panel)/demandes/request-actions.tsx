"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Eye, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { deleteContactRequest } from "./actions";

const iconButton =
  "inline-flex size-8 items-center justify-center rounded-[2px] border border-transparent text-[#63746c] no-underline transition-colors hover:border-[#dce4de] hover:bg-white hover:text-[#0d3b32] dark:text-[#a9bdb4] dark:hover:border-[#315247] dark:hover:bg-[#0f2621] dark:hover:text-white";

type DeleteButtonProps = {
  id: string;
  name: string;
  backToList?: boolean;
  variant?: "icon" | "full";
};

// Demande une confirmation avant de supprimer : la suppression est définitive.
export function DeleteRequestButton({ id, name, backToList = false, variant = "icon" }: DeleteButtonProps) {
  const [pending, startTransition] = useTransition();

  const trigger =
    variant === "icon" ? (
      <AlertDialogTrigger
        render={<button type="button" className={`${iconButton} hover:text-[#a33b12] dark:hover:text-[#f1c6ad]`} aria-label={`Supprimer la demande de ${name}`} />}
      >
        <Trash2 size={15} strokeWidth={1.7} />
      </AlertDialogTrigger>
    ) : (
      <AlertDialogTrigger
        render={
          <Button variant="outline" className="h-10 rounded-[2px] border-[#e8c3b0] bg-white px-4 text-xs font-semibold text-[#8a3f16] hover:bg-[#fbf1eb] dark:border-[#6b3a22] dark:bg-transparent dark:text-[#f1c6ad]" />
        }
      >
        <Trash2 /> Supprimer
      </AlertDialogTrigger>
    );

  return (
    <AlertDialog>
      {trigger}
      <AlertDialogContent className="rounded-[2px] bg-white dark:bg-[#0f2621]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-[Georgia,'Times_New_Roman',serif] text-xl font-normal text-[#0d3b32] dark:text-[#f4f5f0]">
            Supprimer cette demande ?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#63746c] dark:text-[#a9bdb4]">
            La demande de <strong className="text-[#233d36] dark:text-[#e0e9e3]">{name}</strong> et son message seront définitivement effacés. Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-[2px]">Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={() => startTransition(() => deleteContactRequest(id, backToList))}
            className="rounded-[2px] border-[#a33b12] bg-[#a33b12] text-white hover:bg-[#c04a1c]"
          >
            {pending ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Colonne « Actions » de la liste : voir, modifier, supprimer.
export function RequestRowActions({ id, name }: { id: string; name: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Tooltip>
        <TooltipTrigger render={<Link href={`/admin/demandes/${id}`} className={iconButton} aria-label={`Voir la demande de ${name}`} />}>
          <Eye size={15} strokeWidth={1.7} />
        </TooltipTrigger>
        <TooltipContent>Voir</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger render={<Link href={`/admin/demandes/${id}/modifier`} className={iconButton} aria-label={`Modifier la demande de ${name}`} />}>
          <Pencil size={15} strokeWidth={1.7} />
        </TooltipTrigger>
        <TooltipContent>Modifier</TooltipContent>
      </Tooltip>
      <DeleteRequestButton id={id} name={name} />
    </div>
  );
}
