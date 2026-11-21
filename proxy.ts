import { NextResponse, type NextRequest } from "next/server";
import { hasPermission, requiredPermission } from "@/lib/permissions";
import { resolveUser, sessionCookieName } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const permission = requiredPermission(pathname);
  if (!permission) {
    return NextResponse.next();
  }

  const user = await resolveUser(request.cookies.get(sessionCookieName)?.value ?? null);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (!hasPermission(user.role, permission)) {
    return NextResponse.redirect(new URL("/forbidden", request.url));
  }
  return NextResponse.next();
}

// Which paths are protected is decided by the permission map alone, so the
// matcher only skips what can never be a page.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
