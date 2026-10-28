"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// next-themes rend un <script> en ligne qui applique la classe du thème avant le premier affichage.
// Il n'a besoin de s'exécuter que depuis le HTML du serveur ; côté client, React avertit pour
// tout <script> exécutable qu'il rend, donc on le marque là comme bloc de données, que React
// ignore. Le script a déjà suppressHydrationWarning : la différence de type ne pose pas problème.
const scriptProps = typeof window === "undefined" ? undefined : ({ type: "application/json" } as const);

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider scriptProps={scriptProps} {...props} />;
}
