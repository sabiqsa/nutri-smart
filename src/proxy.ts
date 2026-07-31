import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/libs/supabase/middleware";

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // Login is optional — only Ahli Gizi/Admin need an account (to edit diet
  // data). Everyone else (distribution staff / PPM) uses the app as a guest,
  // read-only. So there is no "not logged in -> /login" redirect here.

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
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
