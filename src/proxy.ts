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
    // Skip Next internals + anything that's a static asset by extension
    // (icons, fonts, manifest, service worker) instead of hardcoding
    // individual filenames — that list kept silently missing new asset
    // types (fonts, manifest.webmanifest) and forcing them through the
    // login redirect for guests.
    "/((?!_next/static|_next/image|manifest\\.webmanifest|sw\\.js|.*\\.(?:ico|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|otf)$).*)",
  ],
};
