import Link from "next/link";
import { Inbox } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listRequests } from "@/lib/contact-requests";
import { CONTACT_SUBJECTS, isContactSubject, subjectLabel } from "@/lib/contact-subjects";
import { DatabaseNotice, PageHeading, SubjectBadge, formatDate } from "../panel-ui";
import { RequestRowActions } from "./request-actions";

const filterClass = "rounded-full border px-3 py-1 text-xs no-underline transition-colors";
const filterIdle = "border-[#dce4de] bg-white text-[#354b43] hover:border-[#9db4aa] dark:border-[#29443a] dark:bg-[#0f2621] dark:text-[#c9d8d0]";
const filterActive = "border-[#0d3b32] bg-[#0d3b32] text-white dark:border-[#e0e9e3] dark:bg-[#e0e9e3] dark:text-[#0d3b32]";

export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/demandes">) {
  const params = await searchParams;
  const subject = isContactSubject(params.sujet) ? params.sujet : undefined;
  const unreadOnly = params.statut === "non-lues";
  const requests = await listRequests({ subject, unreadOnly });

  const title = subject ? subjectLabel(subject) : unreadOnly ? "Demandes non lues" : "Toutes les demandes";
  const statusQuery = unreadOnly ? "statut=non-lues" : "";
  const hrefFor = (value?: string) => {
    const query = [value ? `sujet=${value}` : "", statusQuery].filter(Boolean).join("&");
    return query ? `/admin/demandes?${query}` : "/admin/demandes";
  };

  return (
    <>
      <PageHeading kicker="Demandes du formulaire" title={title} description="Coordonnées et message de chaque personne ayant contacté le cabinet depuis le site." />
      {!requests.ok && <DatabaseNotice reason={requests.reason} />}

      <nav aria-label="Filtrer par sujet" className="mb-5 flex flex-wrap gap-2">
        <Link href={hrefFor()} className={`${filterClass} ${!subject ? filterActive : filterIdle}`}>Tous les sujets</Link>
        {CONTACT_SUBJECTS.map(({ value, shortLabel }) => (
          <Link key={value} href={hrefFor(value)} className={`${filterClass} ${subject === value ? filterActive : filterIdle}`}>{shortLabel}</Link>
        ))}
      </nav>

      <div className="overflow-hidden rounded-[2px] border border-[#dce4de] bg-white dark:border-[#29443a] dark:bg-[#0f2621]">
        {requests.ok && requests.data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-[#e7ece8] bg-[#f7f9f7] hover:bg-[#f7f9f7] dark:border-[#22392f] dark:bg-[#132d27]">
                <TableHead className="w-6" />
                <TableHead className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">Nom et poste</TableHead>
                <TableHead className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">Coordonnées</TableHead>
                <TableHead className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">Sujet</TableHead>
                <TableHead className="text-right text-[11px] text-[#63746c] dark:text-[#a9bdb4]">Reçue le</TableHead>
                <TableHead className="text-right text-[11px] text-[#63746c] dark:text-[#a9bdb4]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.data.map((request) => {
                const href = `/admin/demandes/${request.id}`;
                return (
                  <TableRow key={request.id} className="border-[#e7ece8] hover:bg-[#f7f9f7] dark:border-[#22392f] dark:hover:bg-[#132d27]">
                    <TableCell className="pr-0">
                      {!request.readAt && <span className="block size-2 rounded-full bg-[#bd642d]" aria-label="Non lue" />}
                    </TableCell>
                    <TableCell>
                      <Link href={href} className={`block text-sm no-underline text-[#233d36] hover:underline dark:text-[#e0e9e3] ${request.readAt ? "" : "font-semibold"}`}>
                        {request.firstName} {request.lastName}
                      </Link>
                      {request.position && <span className="text-xs text-[#63746c] dark:text-[#a9bdb4]">{request.position}</span>}
                    </TableCell>
                    <TableCell className="text-xs text-[#354b43] dark:text-[#c9d8d0]">
                      <a href={`mailto:${request.email}`} className="block text-inherit">{request.email}</a>
                      {request.phone && <a href={`tel:${request.phone}`} className="text-inherit no-underline">{request.phone}</a>}
                    </TableCell>
                    <TableCell><SubjectBadge subject={request.subject} /></TableCell>
                    <TableCell className="text-right text-xs text-[#63746c] dark:text-[#a9bdb4]">{formatDate(request.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <RequestRowActions id={request.id} name={`${request.firstName} ${request.lastName}`.trim()} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <Inbox className="text-[#7b9c8c]" size={28} strokeWidth={1.4} />
            <p className="text-sm text-[#63746c] dark:text-[#a9bdb4]">
              {requests.ok ? "Aucune demande ne correspond à ce filtre." : "Les demandes apparaîtront ici une fois la base de données connectée."}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
