import { ShieldCheck } from "lucide-react";
import { ROLE_LABELS } from "@/lib/admins";
import { requireAdmin } from "@/lib/auth";
import { getDb, isDatabaseConfigured } from "@/lib/db";
import { ENV_ADMIN_ID } from "@/lib/env-admin";
import { PageHeading, formatDate } from "../panel-ui";
import { AvatarEditor, MoveEnvAccount, PasswordForm, ProfileForm } from "./profile-forms";

const cardClass = "rounded-[2px] border border-[#dce4de] bg-white p-6 dark:border-[#29443a] dark:bg-[#0f2621]";
const sectionTitle = "mb-1 font-[Georgia,'Times_New_Roman',serif] text-xl font-normal text-[#0d3b32] dark:text-[#f4f5f0]";
const sectionText = "mb-5 text-xs leading-relaxed text-[#63746c] dark:text-[#a9bdb4]";

export default async function ProfilePage() {
  const current = await requireAdmin();

  if (current.id === ENV_ADMIN_ID) {
    return (
      <>
        <PageHeading kicker="Mon compte" title="Mon profil" />
        <MoveEnvAccount databaseReady={isDatabaseConfigured()} />
      </>
    );
  }

  const profile = await getDb().admin.findUniqueOrThrow({
    where: { id: current.id },
    select: { name: true, email: true, avatar: true, jobTitle: true, phone: true, role: true, createdAt: true, lastLoginAt: true },
  });

  return (
    <>
      <PageHeading kicker="Mon compte" title="Mon profil" description="Ces informations apparaissent dans le panneau et dans la liste des administrateurs." />

      <div className="grid gap-6">
        <section className={cardClass}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className={sectionTitle}>Photo</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#a14f1c] dark:text-[#f1c6ad]">
              {profile.role === "OWNER" && <ShieldCheck size={13} />} {ROLE_LABELS[profile.role]}
            </span>
          </div>
          <AvatarEditor profile={profile} />
        </section>

        <section className={cardClass}>
          <h2 className={sectionTitle}>Informations</h2>
          <p className={sectionText}>Votre adresse e-mail sert à vous connecter et à recevoir les codes de vérification.</p>
          <ProfileForm profile={profile} />
        </section>

        <section className={cardClass}>
          <h2 className={sectionTitle}>Mot de passe</h2>
          <p className={sectionText}>Choisissez un mot de passe que vous n’utilisez nulle part ailleurs.</p>
          <PasswordForm />
        </section>

        <p className="text-[11px] text-[#9db4aa]">
          Compte créé le {formatDate(profile.createdAt)}
          {profile.lastLoginAt ? ` · Dernière connexion le ${formatDate(profile.lastLoginAt)}` : ""}
        </p>
      </div>
    </>
  );
}
