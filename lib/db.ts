import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Créé au premier usage, pour que les pages qui n'interrogent pas la base fonctionnent sans DATABASE_URL.
// Un seul client est réutilisé entre les rechargements à chaud en développement.
export function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const client = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
  globalForPrisma.prisma = client;
  return client;
}

// Les pages affichent un état explicite au lieu de planter tant que Neon n'est pas connecté.
export type DataResult<T> = { ok: true; data: T } | { ok: false; reason: "not-configured" | "error" };

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function withDatabase<T>(query: () => Promise<T>): Promise<DataResult<T>> {
  if (!isDatabaseConfigured()) return { ok: false, reason: "not-configured" };
  try {
    return { ok: true, data: await query() };
  } catch (error) {
    console.error("[admin] database query failed", error);
    return { ok: false, reason: "error" };
  }
}
