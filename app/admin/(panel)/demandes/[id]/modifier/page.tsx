import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getRequest } from "@/lib/contact-requests";
import { DatabaseNotice, PageHeading, formatDate } from "../../../panel-ui";
import { EditRequestForm } from "./edit-request-form";

export default async function EditRequestPage({ params }: PageProps<"/admin/demandes/[id]/modifier">) {
  const { id } = await params;
  const result = await getRequest(id);

  const backLink = (
    <Link href={`/admin/demandes/${id}`} className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0d3b32] no-underline hover:underline dark:text-[#e0e9e3]">
      <ArrowLeft size={13} /> Retour à la demande
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

  return (
    <>
      {backLink}
      <PageHeading
        kicker={`Reçue le ${formatDate(request.createdAt)}`}
        title={`Modifier la demande de ${`${request.firstName} ${request.lastName}`.trim()}`}
        description="Corrigez les coordonnées ou le message, par exemple après un échange téléphonique avec la personne."
      />
      <EditRequestForm request={request} />
    </>
  );
}
