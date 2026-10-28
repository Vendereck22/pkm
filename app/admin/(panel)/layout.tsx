import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { requireAdmin } from "@/lib/auth";
import { getRequestStats } from "@/lib/contact-requests";
import { AdminSidebar } from "./admin-sidebar";

export const metadata: Metadata = {
  title: "Panneau d’administration | Cabinet PKM",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const [admin, stats, cookieStore] = await Promise.all([requireAdmin(), getRequestStats(), cookies()]);
  // Même cookie que celui écrit par la sidebar shadcn : l'état replié survit aux rechargements.
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={sidebarOpen}>
        <AdminSidebar admin={admin} stats={stats.ok ? stats.data : null} />
        <SidebarInset className="min-h-svh bg-[#f3f5f2] text-[#233d36] dark:bg-[#132d27] dark:text-[#e0e9e3]">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-[#dce4de] bg-[#f3f5f2]/90 px-4 backdrop-blur sm:px-6 dark:border-[#29443a] dark:bg-[#132d27]/90">
            <SidebarTrigger className="-ml-1 text-[#0d3b32] hover:bg-[#0d3b32]/8 dark:text-[#e0e9e3]" aria-label="Afficher ou masquer le menu" />
            <Separator orientation="vertical" className="h-5 bg-[#dce4de] dark:bg-[#29443a]" />
            <p className="truncate text-xs text-[#63746c] dark:text-[#a9bdb4]">Cabinet PKM · Espace administrateur</p>
            <Link href="/" target="_blank" rel="noopener" className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-[#0d3b32] no-underline hover:underline dark:text-[#e0e9e3]">
              Voir le site <ArrowUpRight size={12} />
            </Link>
          </header>
          <div className="mx-auto w-full max-w-[1160px] px-4 py-8 sm:px-6 lg:py-10">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
