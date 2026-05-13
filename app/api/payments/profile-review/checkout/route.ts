import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getCatalogItem, getPaddlePriceId } from "@/lib/billing/catalog";
import { createBillingOrder } from "@/lib/billing/store";
import { ensureUserExists } from "@/lib/credits";
import {
  getProfileReviewReport,
  requireProfileReviewAccess,
} from "@/lib/profile-review/session";
import {
  getProfileReviewAccessToken,
  profileReviewJsonError,
} from "@/lib/profile-review/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const body = (await req.json()) as { sessionId?: string; accessToken?: string };
    const sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing profile review session id" }, { status: 400 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress || "";

    if (!email) {
      return NextResponse.json(
        { error: "No email address found for this account" },
        { status: 400 }
      );
    }

    await ensureUserExists(userId, email);

    await requireProfileReviewAccess({
      sessionId,
      accessToken: body.accessToken || getProfileReviewAccessToken(req),
      userId,
    });

    const report = await getProfileReviewReport(sessionId);
    if (!report) {
      return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
    }

    const item = getCatalogItem("profile_review_unlock");
    const order = await createBillingOrder({
      userId,
      email,
      item,
      profileReviewSessionId: sessionId,
      metadata: {
        checkout_source: "profile_review",
        profile_review_session_id: sessionId,
      },
    });

    const customData = {
      order_id: order.id,
      user_id: userId,
      sku: item.sku,
      product_type: item.productType,
      profile_review_session_id: sessionId,
    };

    return NextResponse.json({
      orderId: order.id,
      email,
      provider: "paddle",
      sku: item.sku,
      productType: item.productType,
      profileReviewSessionId: sessionId,
      paddlePriceId: getPaddlePriceId(item.sku),
      customData,
    });
  } catch (error) {
    return profileReviewJsonError(error);
  }
}
