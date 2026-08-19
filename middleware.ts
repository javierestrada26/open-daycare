import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

const PUBLIC_ROUTES = ["/login", "/activate-account"];

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // Refresh the user's session before any route handler runs.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected = !PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  if (!user && isProtected) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url),
    );
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value);
    });
    return redirectResponse;
  }

  if (user && !isProtected) {
    const redirectResponse = NextResponse.redirect(new URL("/", request.url));
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(name, value);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
