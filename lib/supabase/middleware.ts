import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Do not run Supabase auth logic if keys are not configured yet
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "placeholder-anon-key"
  ) {
    return supabaseResponse;
  }

  const pathname = request.nextUrl.pathname;

  // Protected paths that require authentication
  const protectedPrefixes = [
    "/admin",
    "/profile",
    "/saved",
    "/chat",
    "/roommate/new",
    "/owner",
  ];

  const isProtectedPath =
    protectedPrefixes.some((prefix) => pathname.startsWith(prefix)) &&
    !pathname.startsWith("/owner/invite");

  const authRoutes = ["/login", "/signup", "/forgot-password"];
  const isAuthRoute = authRoutes.includes(pathname);

  // Fast-check whether any Supabase auth cookies are present in request
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) =>
      c.name.startsWith("sb-") &&
      (c.name.includes("-auth-token") ||
        c.name.includes("access_token") ||
        c.name.includes("refresh_token"))
  );

  // FAST PATH: If visitor has no auth cookies at all...
  if (!hasAuthCookie) {
    // If trying to access a protected page, redirect to login instantly without waiting on network
    if (isProtectedPath) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
    // For all public pages (/ , /property/*, /roommates, etc.), return immediately!
    return supabaseResponse;
  }

  // Refresh auth token only when auth cookies actually exist
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If unauthenticated user tries to access protected page, redirect to login
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If authenticated user visits login/signup/forgot-password, redirect to profile
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
