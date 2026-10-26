import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, Mail, Phone } from "lucide-react";
import { openRequest } from "@/lib/contact-requests";
import { DatabaseNotice, PageHeading, SubjectBadge, formatDate } from "../../panel-ui";

export default async function AdminRequestPage({ params }: PageProps<"/admin/demandes/[id]">) {
  const { id } = await params;
  const result = await openRequest(id);

  const backLink = (
    <Link href="/admin/demandes" className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d3b32] no-underline hover:underline dark:text-[#e0e9e3]">
      <ArrowLeft size={13} /> Toutes les demandes
    </Link>
  );

  if (!result.ok) {
    return (
      <>
        {backLink}
        <DatabaseNotice reason={result.reason} />
      </>
    );
  }
  const request = result.data;
  if (!request) notFound();

  const contactRows = [
    { icon: Mail, label: "E-mail", value: request.email, href: `mailto:${request.email}` },
    { icon: Phone, label: "Téléphone", value: request.phone, href: request.phone ? `tel:${request.phone}` : undefined },
    { icon: Briefcase, label: "Poste", value: request.position },
  ];

  return (
    <>
      {backLink}
      <PageHeading kicker={`Reçue le ${formatDate(request.createdAt)}`} title={`${request.firstName} ${request.lastName}`} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <article className="rounded-[2px] border border-[#dce4de] bg-white p-6 dark:border-[#29443a] dark:bg-[#0f2621]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-[11px] font-semibold tracking-[.1em] text-[#63746c] uppercase dark:text-[#a9bdb4]">Message</h2>
            <SubjectBadge subject={request.subject} />
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-[#233d36] dark:text-[#e0e9e3]">{request.message}</p>
        </article>

        <aside className="h-fit rounded-[2px] border border-[#dce4de] bg-white p-6 dark:border-[#29443a] dark:bg-[#0f2621]">
          <h2 className="mb-4 text-[11px] font-semibold tracking-[.1em] text-[#63746c] uppercase dark:text-[#a9bdb4]">Coordonnées</h2>
          <dl className="grid gap-4">
            {contactRows.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex gap-3">
                <Icon size={15} strokeWidth={1.7} className="mt-0.5 shrink-0 text-[#7b9c8c]" />
                <div className="min-w-0">
                  <dt className="text-[11px] text-[#63746c] dark:text-[#a9bdb4]">{label}</dt>
                  <dd className="truncate text-sm text-[#233d36] dark:text-[#e0e9e3]">
                    {value ? (href ? <a href={href} className="text-inherit">{value}</a> : value) : <span className="text-[#9db4aa]">Non renseigné</span>}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
          <a
            href={`mailto:${request.email}?subject=${encodeURIComponent("Votre demande au Cabinet PKM")}`}
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[2px] bg-[#bd642d] text-xs font-semibold text-white no-underline hover:bg-[#d27a43]"
          >
            <Mail size={14} /> Répondre par e-mail
          </a>
        </aside>
      </div>
    </>
  );
}
