import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  LOCAL_DEV_AUTH_COOKIE,
  isLocalDevAuthEnabled,
} from "@/lib/local-dev-auth";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/dev-login(.*)",
  "/api/webhooks/stripe(.*)",
]);

const isProtectedRoute = createRouteMatcher(["/workspace(.*)"]);

export default clerkMiddleware(async (auth, request) => {
  if (isPublicRoute(request)) {
    return;
  }

  if (isProtectedRoute(request)) {
    if (
      isLocalDevAuthEnabled() &&
      request.cookies.has(LOCAL_DEV_AUTH_COOKIE)
    ) {
      return;
    }

    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
