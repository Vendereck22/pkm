// Fichier généré par Prisma ; il suppose que les paquets suivants sont installés :
// npm install --save-dev prisma dotenv
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Le CLI (migrations) passe par la connexion directe ; le site, lui, utilise DATABASE_URL (pooler).
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
  },
});
