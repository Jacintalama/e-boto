// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow API & static
  if (pathname.startsWith("/api") || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const hasToken = Boolean(req.cookies.get("token")?.value);

  // Protected zones (admin + student)
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname === "/student-dashboard" ||
    pathname.startsWith("/student/");

  if (!hasToken && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  // No redirects for logged-in users here (avoid loops)
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico|images/|public/|uploads/|api/).*)"],
};
