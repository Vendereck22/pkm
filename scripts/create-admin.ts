// Creates the principal admin account, or resets its password (and re-enables it) if the email already exists.
// Usage: npm run admin:create -- admin@pkm.cd "mot-de-passe" "Nom affiché"
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../lib/generated/prisma/client";

const MIN_PASSWORD_LENGTH = 12;

async function main() {
  const [rawEmail, password, name] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();

  if (!email || !password) {
    console.error('Usage: npm run admin:create -- <email> "<mot de passe>" ["Nom affiché"]');
    process.exit(1);
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL est absent du fichier .env.");
    process.exit(1);
  }

  const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
  const passwordHash = await bcrypt.hash(password, 12);

  // This script bootstraps the principal admin; other accounts are created from the panel.
  const admin = await db.admin.upsert({
    where: { email },
    create: { email, passwordHash, name, role: "OWNER" },
    update: { passwordHash, role: "OWNER", disabledAt: null, ...(name ? { name } : {}) },
  });
  console.log(`Compte administrateur prêt : ${admin.email}`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
