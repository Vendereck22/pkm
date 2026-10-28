import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Remplace les exclusions par défaut d'eslint-config-next.
  globalIgnores([
    // Exclusions par défaut d'eslint-config-next :
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Généré par `prisma generate`.
    "lib/generated/**",
  ]),
]);

export default eslintConfig;
