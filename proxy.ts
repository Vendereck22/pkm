import { NextResponse, type NextRequest } from "next/server";
import { OTP_COOKIE, SESSION_COOKIE, decryptOtp, decryptSession } from "@/lib/session";

const LOGIN_PATH = "/admin/login";
const VERIFY_PATH = "/admin/verify";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const redirectTo = (path: string) => NextResponse.redirect(new URL(path, request.url));
  const session = await decryptSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (pathname === LOGIN_PATH) return session ? redirectTo("/admin") : NextResponse.next();

  // La page du code n'est accessible qu'après un mot de passe correct.
  if (pathname === VERIFY_PATH) {
    if (session) return redirectTo("/admin");
    const pending = await decryptOtp(request.cookies.get(OTP_COOKIE)?.value);
    return pending ? NextResponse.next() : redirectTo(LOGIN_PATH);
  }

  return session ? NextResponse.next() : redirectTo(LOGIN_PATH);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
