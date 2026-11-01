import "server-only";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";

// Les compteurs sont en base : sur Vercel, chaque requête peut arriver sur un serveur différent,
// et un compteur en mémoire repartirait de zéro à chaque fois.

const KEEP_HITS_MS = 24 * 60 * 60 * 1000;

// Adresse IP du visiteur. Sur Vercel, ces en-têtes sont réécrits par la plateforme : le visiteur
// ne peut pas les falsifier. Ailleurs (en local par exemple), ils peuvent l'être.
export async function clientIp() {
  const list = await headers();
  const forwarded = list.get("x-vercel-forwarded-for") ?? list.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || list.get("x-real-ip") || "unknown";
}

export async function countHits(key: string, windowMs: number) {
  return getDb().rateLimitHit.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } } });
}

export async function recordHit(...keys: string[]) {
  const db = getDb();
  await db.rateLimitHit.createMany({ data: keys.map((key) => ({ key })) });
  // Ménage au passage : au-delà d'une journée, plus aucune limite ne regarde ces lignes.
  await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - KEEP_HITS_MS) } } });
}

export async function clearHits(key: string) {
  await getDb().rateLimitHit.deleteMany({ where: { key } });
}
