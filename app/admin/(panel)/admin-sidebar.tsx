"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Briefcase, ExternalLink, Inbox, LayoutDashboard, LogOut, Mail, MessageSquare, Mountain, Stamp, UsersRound, type LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/contact-subjects";
import type { RequestStats } from "@/lib/contact-requests";
import { logout } from "./actions";
import { AdminAvatar } from "./admin-avatar";

const subjectIcons: Record<ContactSubject, LucideIcon> = {
  business: Briefcase,
  mining: Mountain,
  trademark: Stamp,
  other: MessageSquare,
};

type AdminSidebarProps = {
  admin: { email: string; name: string | null; role: "OWNER" | "ADMIN"; avatar: string | null };
  stats: RequestStats | null;
};

export function AdminSidebar({ admin, stats }: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onRequests = pathname === "/admin/demandes";
  const subject = searchParams.get("sujet");
  const unreadOnly = searchParams.get("statut") === "non-lues";
  // Sur téléphone, le menu est un tiroir : on le ferme dès qu'une destination est choisie.
  const { setOpenMobile } = useSidebar();
  const closeMobile = () => setOpenMobile(false);

  const requestLinks = [
    { href: "/admin/demandes", label: "Toutes les demandes", icon: Inbox, count: stats?.total, active: onRequests && !subject && !unreadOnly },
    { href: "/admin/demandes?statut=non-lues", label: "Non lues", icon: Mail, count: stats?.unread, highlight: true, active: onRequests && unreadOnly },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-5 pb-3">
        <Link href="/admin" className="flex min-w-0 flex-col text-inherit no-underline group-data-[collapsible=icon]:items-center">
          <span className="font-[Georgia,'Times_New_Roman',serif] text-xl leading-none font-bold tracking-[.06em] text-white group-data-[collapsible=icon]:text-sm">PKM</span>
          <span className="mt-1.5 truncate text-[9px] tracking-[.02em] text-[#9db4aa] group-data-[collapsible=icon]:hidden">Panneau d’administration</span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/admin"} tooltip="Vue d’ensemble" onClick={closeMobile} render={<Link href="/admin" />}>
                  <LayoutDashboard /> <span>Vue d’ensemble</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Demandes du formulaire</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {requestLinks.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton isActive={link.active} tooltip={link.label} onClick={closeMobile} render={<Link href={link.href} />}>
                    <link.icon /> <span>{link.label}</span>
                  </SidebarMenuButton>
                  {link.count ? (
                    <SidebarMenuBadge className={link.highlight ? "rounded-full bg-[#bd642d] text-white" : "text-[#9db4aa]"}>{link.count}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Par sujet</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {CONTACT_SUBJECTS.map(({ value, shortLabel }) => {
                const Icon = subjectIcons[value];
                const unread = stats?.bySubject[value].unread;
                return (
                  <SidebarMenuItem key={value}>
                    <SidebarMenuButton isActive={onRequests && subject === value} tooltip={shortLabel} onClick={closeMobile} render={<Link href={`/admin/demandes?sujet=${value}`} />}>
                      <Icon /> <span>{shortLabel}</span>
                    </SidebarMenuButton>
                    {unread ? <SidebarMenuBadge className="rounded-full bg-[#bd642d] text-white">{unread}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={pathname === "/admin/administrateurs"} tooltip="Administrateurs" onClick={closeMobile} render={<Link href="/admin/administrateurs" />}>
                  <UsersRound /> <span>Administrateurs</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Voir le site" onClick={closeMobile} render={<Link href="/" target="_blank" rel="noopener" />}>
                  <ExternalLink /> <span>Voir le site</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            {/* Cliquer sur sa photo ou son nom ouvre « Mon profil ». */}
            <SidebarMenuButton
              size="lg"
              isActive={pathname === "/admin/profil"}
              tooltip="Mon profil"
              onClick={closeMobile}
              render={<Link href="/admin/profil" />}
            >
              <AdminAvatar name={admin.name} email={admin.email} avatar={admin.avatar} size={32} />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-white">{admin.name ?? "Administrateur"}</span>
                <span className="block truncate text-[10px] text-[#9db4aa]">{admin.role === "OWNER" ? "Administrateur principal" : "Administrateur"}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <form action={logout}>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton type="submit" tooltip="Se déconnecter">
                <LogOut /> <span>Se déconnecter</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </form>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
