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
import { getAppAuthSession } from "@/lib/local-dev-auth";
import {
  isLocalProfileReviewSession,
  markLocalProfileReviewSessionPaid,
  requireLocalProfileReviewAccess,
} from "@/lib/profile-review/local-dev-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await getAppAuthSession();

    if (!userId) {
      return NextResponse.json({ error: "Please sign in first" }, { status: 401 });
    }

    const body = (await req.json()) as { sessionId?: string; accessToken?: string };
    const sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing profile review session id" }, { status: 400 });
    }

    const userEmail = email || `${userId}@temp.local`;
    const accessToken = body.accessToken || getProfileReviewAccessToken(req);

    if (!userEmail) {
      return NextResponse.json(
        { error: "No email address found for this account" },
        { status: 400 }
      );
    }

    if (isLocalProfileReviewSession(sessionId)) {
      const session = requireLocalProfileReviewAccess({
        sessionId,
        accessToken,
      });

      if (!session) {
        return NextResponse.json({ error: "Review session not found" }, { status: 404 });
      }

      if (!session.previewReport || !session.fullReport) {
        return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
      }

      markLocalProfileReviewSessionPaid({
        sessionId,
        userId,
        email: userEmail,
        accessToken,
      });

      return NextResponse.json({
        orderId: `local-order-${sessionId}`,
        email: userEmail,
        provider: "local",
        sku: "profile_review_unlock",
        productType: "profile_review_unlock",
        profileReviewSessionId: sessionId,
        paddlePriceId: "local-profile-review-unlock",
        customData: {
          order_id: `local-order-${sessionId}`,
          user_id: userId,
          sku: "profile_review_unlock",
          product_type: "profile_review_unlock",
          profile_review_session_id: sessionId,
        },
        reportUrl: `/dating-profile-review/report/${sessionId}?accessToken=${encodeURIComponent(accessToken)}&payment=local&orderId=local-order-${sessionId}`,
      });
    }

    await ensureUserExists(userId, userEmail);

    await requireProfileReviewAccess({
      sessionId,
      accessToken,
      userId,
    });

    const report = await getProfileReviewReport(sessionId);
    if (!report) {
      return NextResponse.json({ error: "Report is not ready yet" }, { status: 409 });
    }

    const item = getCatalogItem("profile_review_unlock");
    const order = await createBillingOrder({
      userId,
      email: userEmail,
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
      email: userEmail,
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
