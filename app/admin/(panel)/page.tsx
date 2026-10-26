import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { getRequestStats, listRequests } from "@/lib/contact-requests";
import { CONTACT_SUBJECTS } from "@/lib/contact-subjects";
import { DatabaseNotice, PageHeading, SubjectBadge, formatDate } from "./panel-ui";

export default async function AdminOverviewPage() {
  const [admin, stats, latest] = await Promise.all([requireAdmin(), getRequestStats(), listRequests({}, 5)]);
  const data = stats.ok ? stats.data : null;

  const tiles = [
    { label: "Demandes reçues", value: data?.total, href: "/admin/demandes" },
    { label: "Non lues", value: data?.unread, href: "/admin/demandes?statut=non-lues", accent: true },
    { label: "Ces 7 derniers jours", value: data?.lastSevenDays, href: "/admin/demandes" },
  ];

  return (
    <>
      <PageHeading kicker="Vue d’ensemble" title={admin.name ? `Bonjour, ${admin.name}` : "Bonjour"}description="Le point sur les demandes envoyées depuis le formulaire de contact du site." />
      {!stats.ok && <DatabaseNotice reason={stats.reason} />}

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="group rounded-[2px] border border-[#dce4de] bg-white p-5 no-underline transition-colors hover:border-[#9db4aa] dark:border-[#29443a] dark:bg-[#0f2621] dark:hover:border-[#4b6e61]">
            <p className="text-[11px] font-semibold text-[#63746c] dark:text-[#a9bdb4]">{tile.label}</p>
            <p className={`mt-3 font-[Georgia,'Times_New_Roman',serif] text-4xl leading-none ${tile.accent && tile.value ? "text-[#bd642d]" : "text-[#0d3b32] dark:text-[#f4f5f0]"}`}>
              {tile.value ?? "—"}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-12 mb-4 font-[Georgia,'Times_New_Roman',serif] text-xl font-normal text-[#0d3b32] dark:text-[#f4f5f0]">Par sujet du formulaire</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CONTACT_SUBJECTS.map(({ value, label }) => {
          const counts = data?.bySubject[value];
          return (
            <Link key={value} href={`/admin/demandes?sujet=${value}`} className="group flex flex-col justify-between gap-6 rounded-[2px] border border-[#dce4de] bg-white p-5 no-underline transition-colors hover:border-[#9db4aa] dark:border-[#29443a] dark:bg-[#0f2621] dark:hover:border-[#4b6e61]">
              <p className="text-sm leading-snug text-[#233d36] dark:text-[#e0e9e3]">{label}</p>
              <div className="flex items-end justify-between">
                <p className="font-[Georgia,'Times_New_Roman',serif] text-3xl leading-none text-[#0d3b32] dark:text-[#f4f5f0]">{counts?.total ?? "—"}</p>
                {counts?.unread ? (
                  <span className="rounded-full bg-[#bd642d] px-2 py-0.5 text-[10px] font-semibold text-white">{counts.unread} non lue{counts.unread > 1 ? "s" : ""}</span>
                ) : (
                  <ArrowRight size={16} className="text-[#9db4aa] transition-transform group-hover:translate-x-0.5" />
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 mb-4 flex items-end justify-between gap-4">
        <h2 className="font-[Georgia,'Times_New_Roman',serif] text-xl font-normal text-[#0d3b32] dark:text-[#f4f5f0]">Dernières demandes</h2>
        <Link href="/admin/demandes" className="text-xs font-semibold text-[#bd642d] no-underline hover:underline">Tout voir</Link>
      </div>
      <div className="rounded-[2px] border border-[#dce4de] bg-white dark:border-[#29443a] dark:bg-[#0f2621]">
        {latest.ok && latest.data.length > 0 ? (
          <ul className="divide-y divide-[#e7ece8] dark:divide-[#22392f]">
            {latest.data.map((request) => (
              <li key={request.id}>
                <Link href={`/admin/demandes/${request.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-4 no-underline hover:bg-[#f7f9f7] dark:hover:bg-[#132d27]">
                  {!request.readAt && <span className="size-2 rounded-full bg-[#bd642d]" aria-label="Non lue" />}
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#233d36] dark:text-[#e0e9e3]">{request.firstName} {request.lastName}</span>
                  <SubjectBadge subject={request.subject} />
                  <span className="text-xs text-[#63746c] dark:text-[#a9bdb4]">{formatDate(request.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Inbox className="text-[#7b9c8c]" size={28} strokeWidth={1.4} />
            <p className="text-sm text-[#63746c] dark:text-[#a9bdb4]">Aucune demande pour le moment. Elles apparaîtront ici dès qu’un visiteur remplira le formulaire.</p>
          </div>
        )}
      </div>
    </>
  );
}
