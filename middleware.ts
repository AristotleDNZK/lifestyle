import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Check if Clerk keys are configured (not placeholder values)
const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
const isClerkConfigured = clerkPublishableKey &&
  !clerkPublishableKey.includes('placeholder') &&
  !clerkPublishableKey.includes('your-key-here') &&
  clerkPublishableKey.startsWith('pk_')

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/stripe', // Stripe webhook must be public
])

// If Clerk is not configured, use a simple pass-through middleware
// This allows viewing the homepage without configuration
const simpleMiddleware = (request: NextRequest) => {
  return NextResponse.next()
}

// Use Clerk middleware only if properly configured
export default isClerkConfigured
  ? clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        await auth.protect()
      }
    })
  : simpleMiddleware

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
