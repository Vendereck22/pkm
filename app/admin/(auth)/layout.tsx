import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Shared frame for the password and code steps: brand panel on the left, form on the right.
export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-[#f3f5f2] text-[#233d36] lg:grid-cols-[1.05fr_1fr] dark:bg-[#132d27] dark:text-[#e0e9e3]">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[#0d3b32] px-6 py-7 text-[#f4f5f0] sm:px-10 lg:px-14 lg:py-12 dark:bg-[#0b3028]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-40 -bottom-48 size-[520px] rounded-full border border-[#f4f5f0]/10"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -bottom-28 size-[340px] rounded-full border border-[#f4f5f0]/10"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-24 bottom-40 hidden size-2 rounded-full bg-[#bd642d] lg:block"
        />

        <div className="relative flex items-center justify-between gap-6"></div>

        <div className="relative mt-10 max-w-md lg:mt-0">
          <p className="mb-4 text-[10px] font-semibold tracking-[.14em] text-[#e0a57d] uppercase">
            Espace administrateur
          </p>
          <h2 className="font-[Georgia,'Times_New_Roman',serif] text-3xl leading-[1.12] font-normal sm:text-4xl lg:text-[44px]">
            Les demandes de vos clients, au même endroit.
          </h2>
          <p className="mt-5 hidden max-w-sm text-sm leading-relaxed text-[#b7c9c1] lg:block">
            Retrouvez les coordonnées et le message de chaque personne qui a
            contacté le cabinet depuis le site.
          </p>
        </div>

        <p className="relative mt-8 hidden text-[11px] tracking-[.04em] text-[#9db4aa] lg:block"></p>
      </aside>

      <section className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[380px]">
          {children}
          <p className="mt-8 border-t border-[#dce4de] pt-5 text-[11px] leading-relaxed text-[#63746c] dark:border-[#29443a] dark:text-[#a9bdb4]">
            Accès réservé aux personnes autorisées par le Cabinet PKM. Les
            échanges sont couverts par le secret professionnel.
          </p>
        </div>
      </section>
    </main>
  );
}
