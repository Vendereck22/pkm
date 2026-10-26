import { KeyRound, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ROLE_LABELS, listAdmins } from "@/lib/admins";
import { requireAdmin } from "@/lib/auth";
import { ENV_ADMIN_ID, getEnvAdmin } from "@/lib/env-admin";
import { DatabaseNotice, PageHeading, formatDate } from "../panel-ui";
import { setAdminDisabled } from "./actions";
import { CreateAdminForm } from "./create-admin-form";

const headClass = "text-[11px] text-[#63746c] dark:text-[#a9bdb4]";
const rowClass = "border-[#e7ece8] hover:bg-[#f7f9f7] dark:border-[#22392f] dark:hover:bg-[#132d27]";

function RoleBadge({ role }: { role: keyof typeof ROLE_LABELS }) {
  const owner = role === "OWNER";
  return (
    <Badge
      variant="outline"
      className={`rounded-[2px] font-medium ${owner ? "border-[#bd642d]/30 bg-[#bd642d]/8 text-[#a14f1c] dark:text-[#f1c6ad]" : "border-[#0d3b32]/20 bg-[#0d3b32]/6 text-[#0d3b32] dark:border-[#9db4aa]/30 dark:text-[#cfe0d7]"}`}
    >
      {owner && <ShieldCheck />} {ROLE_LABELS[role]}
    </Badge>
  );
}

export default async function AdminAccountsPage() {
  const [current, admins] = await Promise.all([requireAdmin(), listAdmins()]);
  const isOwner = current.role === "OWNER";
  const envAdmin = getEnvAdmin();

  return (
    <>
      <PageHeading
        kicker="Gestion"
        title="Administrateurs"
        description={
          isOwner
            ? "Les personnes qui ont accès au panneau. Chaque administrateur voit toutes les demandes ; seul un administrateur principal peut ajouter ou désactiver des comptes."
            : "Les personnes qui ont accès au panneau. Seul un administrateur principal peut ajouter ou désactiver des comptes."
        }
      />
      {!admins.ok && <DatabaseNotice reason={admins.reason} />}

      <div className="grid gap-8 xl:grid-cols-[1fr_400px]">
        <div className="h-fit overflow-hidden rounded-[2px] border border-[#dce4de] bg-white dark:border-[#29443a] dark:bg-[#0f2621]">
          <Table>
            <TableHeader>
              <TableRow className="border-[#e7ece8] bg-[#f7f9f7] hover:bg-[#f7f9f7] dark:border-[#22392f] dark:bg-[#132d27]">
                <TableHead className={headClass}>Compte</TableHead>
                <TableHead className={headClass}>Rôle</TableHead>
                <TableHead className={headClass}>Dernière connexion</TableHead>
                {isOwner && <TableHead className={`${headClass} text-right`}>Accès</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {envAdmin && (
                <TableRow className={rowClass}>
                  <TableCell>
                    <span className="block text-sm font-semibold text-[#233d36] dark:text-[#e0e9e3]">{envAdmin.name ?? envAdmin.email}</span>
                    <span className="text-xs text-[#63746c] dark:text-[#a9bdb4]">{envAdmin.email}</span>
                  </TableCell>
                  <TableCell><RoleBadge role="OWNER" /></TableCell>
                  <TableCell className="text-xs text-[#63746c] dark:text-[#a9bdb4]">
                    <span className="inline-flex items-center gap-1"><KeyRound size={12} /> Compte du fichier .env</span>
                  </TableCell>
                  {isOwner && <TableCell className="text-right text-xs text-[#9db4aa]">{current.id === ENV_ADMIN_ID ? "Vous" : "—"}</TableCell>}
                </TableRow>
              )}

              {admins.ok &&
                admins.data.map((admin) => {
                  const disabled = Boolean(admin.disabledAt);
                  const self = admin.id === current.id;
                  return (
                    <TableRow key={admin.id} className={`${rowClass} ${disabled ? "opacity-60" : ""}`}>
                      <TableCell>
                        <span className="block text-sm font-semibold text-[#233d36] dark:text-[#e0e9e3]">{admin.name ?? admin.email}</span>
                        <span className="text-xs text-[#63746c] dark:text-[#a9bdb4]">{admin.email}</span>
                        {admin.createdBy && (
                          <span className="block text-[10px] text-[#9db4aa]">Ajouté par {admin.createdBy.name ?? admin.createdBy.email}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={admin.role} />
                        {disabled && <span className="mt-1 block text-[10px] font-semibold text-[#8a3f16] dark:text-[#f1c6ad]">Désactivé</span>}
                      </TableCell>
                      <TableCell className="text-xs text-[#63746c] dark:text-[#a9bdb4]">
                        {admin.lastLoginAt ? formatDate(admin.lastLoginAt) : "Jamais connecté"}
                      </TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          {self ? (
                            <span className="text-xs text-[#9db4aa]">Vous</span>
                          ) : (
                            <form action={setAdminDisabled.bind(null, admin.id, !disabled)}>
                              <Button
                                type="submit"
                                variant="outline"
                                size="sm"
                                className={`rounded-[2px] text-[11px] ${disabled ? "border-[#0d3b32]/30 text-[#0d3b32] dark:text-[#e0e9e3]" : "border-[#e8c3b0] text-[#8a3f16] hover:bg-[#fbf1eb] dark:text-[#f1c6ad]"}`}
                              >
                                {disabled ? "Réactiver" : "Désactiver"}
                              </Button>
                            </form>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

              {admins.ok && admins.data.length === 0 && !envAdmin && (
                <TableRow className={rowClass}>
                  <TableCell colSpan={4} className="py-10 text-center text-sm text-[#63746c] dark:text-[#a9bdb4]">Aucun administrateur en base pour le moment.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {isOwner && (
          <section className="h-fit rounded-[2px] border border-[#dce4de] bg-white p-6 dark:border-[#29443a] dark:bg-[#0f2621]">
            <h2 className="mb-1 font-[Georgia,'Times_New_Roman',serif] text-xl font-normal text-[#0d3b32] dark:text-[#f4f5f0]">Ajouter un administrateur</h2>
            <p className="mb-5 text-xs leading-relaxed text-[#63746c] dark:text-[#a9bdb4]">La personne se connectera avec son e-mail et ce mot de passe, puis le code reçu par e-mail.</p>
            <CreateAdminForm />
          </section>
        )}
      </div>
    </>
  );
}
