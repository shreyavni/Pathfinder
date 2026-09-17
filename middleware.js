import { NextResponse } from "next/server";

// Middleware runs in the Edge runtime, so it must not import lib/auth.js:
// that module uses Node's crypto API to hash passwords and sign sessions.
const SESSION_COOKIE_NAME = "pathfinder_session";

const protectedRoutes = [
  "/dashboard",
  "/resume",
  "/ats-checker",
  "/course-recommendations",
  "/latest-jobs",
  "/career-guidance",
  "/interview",
  "/ai-cover-letter",
  "/onboarding",
];

const isProtectedRoute = (pathname) =>
  protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export function middleware(request) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie && isProtectedRoute(request.nextUrl.pathname)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
