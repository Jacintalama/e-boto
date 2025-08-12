// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const path = req.nextUrl.pathname;

  const isAuthPage = path === "/";
  const isProtected = path.startsWith("/dashboard");

  if (!token && isProtected) {
    const url = new URL("/", req.url);
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/", "/dashboard/:path*"] };
