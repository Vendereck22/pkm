import { Database, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { subjectLabel } from "@/lib/contact-subjects";

export function PageHeading({ kicker, title, description }: { kicker: string; title: string; description?: string }) {
  return (
    <div className="mb-8">
      <p className="mb-2 text-[10px] font-semibold tracking-[.14em] text-[#bd642d] uppercase">{kicker}</p>
      <h1 className="font-[Georgia,'Times_New_Roman',serif] text-[28px] leading-tight font-normal text-[#0d3b32] sm:text-[32px] dark:text-[#f4f5f0]">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#63746c] dark:text-[#a9bdb4]">{description}</p>}
    </div>
  );
}

export function DatabaseNotice({ reason }: { reason: "not-configured" | "error" }) {
  const notConfigured = reason === "not-configured";
  const Icon = notConfigured ? Database : TriangleAlert;
  return (
    <div role="status" className="mb-8 flex gap-3 rounded-[2px] border border-[#e8c3b0] bg-[#fbf1eb] px-4 py-3.5 text-[#8a3f16] dark:border-[#6b3a22] dark:bg-[#3a2217] dark:text-[#f1c6ad]">
      <Icon size={18} strokeWidth={1.7} className="mt-0.5 shrink-0" />
      <div className="text-xs leading-relaxed">
        <p className="font-semibold">{notConfigured ? "Base de données non connectée" : "Base de données injoignable"}</p>
        <p className="mt-0.5">
          {notConfigured
            ? "Renseignez DATABASE_URL dans le fichier .env puis lancez la migration Prisma : les demandes du formulaire et les comptes administrateurs y seront enregistrés."
            : "Les données n’ont pas pu être chargées. Vérifiez DATABASE_URL et l’état de la base Neon, puis rechargez la page."}
        </p>
      </div>
    </div>
  );
}

const subjectTones: Record<string, string> = {
  business: "border-[#0d3b32]/20 bg-[#0d3b32]/6 text-[#0d3b32] dark:border-[#9db4aa]/30 dark:bg-[#9db4aa]/10 dark:text-[#cfe0d7]",
  mining: "border-[#8a5a2b]/25 bg-[#8a5a2b]/8 text-[#7a4b20] dark:border-[#d6a878]/30 dark:bg-[#d6a878]/10 dark:text-[#e8c7a4]",
  trademark: "border-[#bd642d]/25 bg-[#bd642d]/8 text-[#a14f1c] dark:border-[#e0a57d]/30 dark:bg-[#e0a57d]/10 dark:text-[#f1c6ad]",
  other: "border-[#63746c]/25 bg-[#63746c]/8 text-[#4c5c55] dark:border-[#a9bdb4]/30 dark:bg-[#a9bdb4]/10 dark:text-[#c9d8d0]",
};

export function SubjectBadge({ subject }: { subject: string }) {
  return (
    <Badge variant="outline" className={`rounded-[2px] font-medium ${subjectTones[subject] ?? subjectTones.other}`}>
      {subjectLabel(subject, true)}
    </Badge>
  );
}

const dateFormat = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kinshasa" });

export function formatDate(date: Date) {
  return dateFormat.format(date);
}
