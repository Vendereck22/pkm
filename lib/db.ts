import "server-only";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/lib/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Created on first use so pages that never query the database work without DATABASE_URL.
// One client is reused across hot reloads in development.
export function getDb() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const client = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
  globalForPrisma.prisma = client;
  return client;
}

// Pages show an explicit state instead of crashing while Neon is not connected yet.
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
