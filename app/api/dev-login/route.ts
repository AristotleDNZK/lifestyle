import { NextRequest, NextResponse } from "next/server";
import {
  LOCAL_DEV_AUTH_COOKIE,
  isLocalDevAuthEnabled,
} from "@/lib/local-dev-auth-shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!isLocalDevAuthEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const redirectParam =
    req.nextUrl.searchParams.get("redirect") || "/workspace/image-to-image";
  const redirectPath = redirectParam.startsWith("/")
    ? redirectParam
    : "/workspace/image-to-image";
  const response = NextResponse.redirect(new URL(redirectPath, req.url));

  response.cookies.set(LOCAL_DEV_AUTH_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}
