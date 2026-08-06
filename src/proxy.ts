import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/libs/supabase/middleware";

const PUBLIC_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isPublicPath = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/auth/");

  // Phase 2 (RBAC): every screen requires an account now — no more guest
  // access (retired the sesi-4 guest-first model).
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|icon-192.png|icon-512.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
