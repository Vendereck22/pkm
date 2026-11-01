"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";
import type { RequestPulse } from "@/lib/contact-requests";
import { subjectLabel } from "@/lib/contact-subjects";

// Onglet affiché : vérification rapide. Onglet en arrière-plan : plus espacée, pour ménager la base.
const VISIBLE_INTERVAL_MS = 10_000;
const HIDDEN_INTERVAL_MS = 30_000;
const TOAST_DURATION_MS = 12_000;
const TITLE_PREFIX = /^\(\d+\) /;

type Latest = NonNullable<RequestPulse["latest"]>;

// Affiche « (3) » devant le titre de l'onglet tant qu'il reste des demandes non lues.
function applyUnreadTitle(unread: number) {
  const base = document.title.replace(TITLE_PREFIX, "");
  document.title = unread > 0 ? `(${unread}) ${base}` : base;
}

// Surveille les demandes de contact et rafraîchit le panneau dès qu'il y a du nouveau, sans recharger la page.
export function RequestWatcher({ initial }: { initial: RequestPulse | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<Latest | null>(null);
  const signature = useRef(initial?.signature ?? null);
  const latestAt = useRef(initial?.latest?.createdAt ?? "");
  const unread = useRef(initial?.unread ?? 0);

  // Next.js réécrit le titre à chaque navigation et à chaque rafraîchissement : on remet aussitôt le compteur.
  useEffect(() => {
    applyUnreadTitle(unread.current);
    const observer = new MutationObserver(() => {
      if (unread.current > 0 && !TITLE_PREFIX.test(document.title)) applyUnreadTitle(unread.current);
    });
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;

    async function check() {
      try {
        const response = await fetch("/admin/demandes/nouvelles", { cache: "no-store", headers: { accept: "application/json" } });
        // Session expirée : la route renvoie vers la connexion, pas du JSON. On laisse la page le gérer.
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) return;
        const pulse: RequestPulse = await response.json();
        unread.current = pulse.unread;
        applyUnreadTitle(pulse.unread);
        if (pulse.signature === signature.current) return;

        signature.current = pulse.signature;
        if (pulse.latest && pulse.latest.createdAt > latestAt.current) {
          latestAt.current = pulse.latest.createdAt;
          setToast(pulse.latest);
        }
        // Recalcule les compteurs, les listes et la vue d'ensemble affichés.
        router.refresh();
      } catch {
        // Réseau coupé : on réessaiera au prochain passage.
      }
    }

    function schedule() {
      if (stopped) return;
      timer = setTimeout(async () => {
        await check();
        schedule();
      }, document.visibilityState === "visible" ? VISIBLE_INTERVAL_MS : HIDDEN_INTERVAL_MS);
    }

    // En revenant sur l'onglet, on vérifie tout de suite.
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void check().then(schedule);
    }

    schedule();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 w-[min(360px,calc(100vw-32px))]">
      {toast && (
        <div
          role="status"
          className="pointer-events-auto flex gap-3 rounded-[2px] border border-[#dce4de] border-l-4 border-l-[#bd642d] bg-white p-4 shadow-[0_14px_32px_rgba(13,59,50,.18)] dark:border-[#29443a] dark:border-l-[#bd642d] dark:bg-[#0f2621]"
        >
          <BellRing size={18} strokeWidth={1.7} className="mt-0.5 shrink-0 text-[#bd642d]" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[.12em] text-[#bd642d] uppercase">Nouvelle demande</p>
            <p className="mt-1 truncate text-sm font-semibold text-[#0d3b32] dark:text-[#f4f5f0]">{toast.name || "Sans nom"}</p>
            <p className="truncate text-xs text-[#63746c] dark:text-[#a9bdb4]">{subjectLabel(toast.subject)}</p>
            <Link
              href={`/admin/demandes/${toast.id}`}
              onClick={() => setToast(null)}
              className="mt-2 inline-block text-xs font-semibold text-[#0d3b32] underline-offset-2 hover:underline dark:text-[#e0e9e3]"
            >
              Ouvrir la demande
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Fermer la notification"
            className="flex size-7 shrink-0 items-center justify-center rounded-[2px] text-[#63746c] hover:bg-[#0d3b32]/6 dark:text-[#a9bdb4]"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
