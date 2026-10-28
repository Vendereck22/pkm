import "server-only";
import { getDb, withDatabase } from "@/lib/db";

export const ROLE_LABELS = {
  OWNER: "Administrateur principal",
  ADMIN: "Administrateur",
} as const;

export function listAdmins() {
  return withDatabase(() =>
    getDb().admin.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        jobTitle: true,
        avatar: true,
        role: true,
        disabledAt: true,
        lastLoginAt: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
  );
}

export type AdminListItem = Extract<Awaited<ReturnType<typeof listAdmins>>, { ok: true }>["data"][number];
