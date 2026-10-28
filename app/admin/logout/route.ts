import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Termine la session d'un compte supprimé ou désactivé, puis affiche la page de connexion.
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", request.url));
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
