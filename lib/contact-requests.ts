import "server-only";
import { getDb, withDatabase } from "@/lib/db";
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/contact-subjects";
import type { ContactRequest } from "@/lib/generated/prisma/client";

export type RequestStats = {
  total: number;
  unread: number;
  lastSevenDays: number;
  bySubject: Record<ContactSubject, { total: number; unread: number }>;
};

export type RequestFilter = { subject?: ContactSubject; unreadOnly?: boolean };

export function getRequestStats() {
  return withDatabase<RequestStats>(async () => {
    const db = getDb();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [total, unread, lastSevenDays, grouped] = await Promise.all([
      db.contactRequest.count(),
      db.contactRequest.count({ where: { readAt: null } }),
      db.contactRequest.count({ where: { createdAt: { gte: weekAgo } } }),
      db.contactRequest.groupBy({ by: ["subject", "readAt"], _count: { _all: true } }),
    ]);

    const bySubject = Object.fromEntries(CONTACT_SUBJECTS.map(({ value }) => [value, { total: 0, unread: 0 }])) as RequestStats["bySubject"];
    for (const row of grouped) {
      const bucket = bySubject[row.subject as ContactSubject] ?? bySubject.other;
      bucket.total += row._count._all;
      if (row.readAt === null) bucket.unread += row._count._all;
    }
    return { total, unread, lastSevenDays, bySubject };
  });
}

export function listRequests(filter: RequestFilter = {}, take = 100) {
  return withDatabase<ContactRequest[]>(() =>
    getDb().contactRequest.findMany({
      where: {
        ...(filter.subject ? { subject: filter.subject } : {}),
        ...(filter.unreadOnly ? { readAt: null } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
    }),
  );
}

// Ouvrir une demande la marque comme lue.
export function openRequest(id: string) {
  return withDatabase<ContactRequest | null>(async () => {
    const db = getDb();
    const request = await db.contactRequest.findUnique({ where: { id } });
    if (request && !request.readAt) return db.contactRequest.update({ where: { id }, data: { readAt: new Date() } });
    return request;
  });
}

// Lecture seule, pour la page de modification : ne change pas l'état « lue ».
export function getRequest(id: string) {
  return withDatabase<ContactRequest | null>(() => getDb().contactRequest.findUnique({ where: { id } }));
}

export type RequestPulse = {
  // Change dès qu'une demande arrive, est lue (ou remise en non lue) ou supprimée.
  signature: string;
  unread: number;
  latest: { id: string; name: string; subject: string; createdAt: string } | null;
};

// Instantané très léger, interrogé régulièrement par le panneau pour détecter les nouvelles demandes.
export function getRequestPulse() {
  return withDatabase<RequestPulse>(async () => {
    const db = getDb();
    const [total, unread, latest] = await Promise.all([
      db.contactRequest.count(),
      db.contactRequest.count({ where: { readAt: null } }),
      db.contactRequest.findFirst({ orderBy: { createdAt: "desc" }, select: { id: true, firstName: true, lastName: true, subject: true, createdAt: true } }),
    ]);
    return {
      signature: [total, unread, latest?.id ?? ""].join(":"),
      unread,
      latest: latest
        ? { id: latest.id, name: `${latest.firstName} ${latest.lastName}`.trim(), subject: latest.subject, createdAt: latest.createdAt.toISOString() }
        : null,
    };
  });
}
