import { NextRequest, NextResponse } from "next/server";
import { getAppAuthSession } from "@/lib/local-dev-auth";
import { retryAsync } from "@/lib/retry";
import { supabaseAdmin } from "@/lib/supabase";
import { findUserIdentityRecords } from "@/lib/user-identity";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: {
    jobId: string;
  };
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { userId, email } = await getAppAuthSession();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    const jobId = context.params.jobId;
    const identity = await findUserIdentityRecords({ userId, email });

    const { data: job, error } = await retryAsync(
      async () =>
        supabaseAdmin
          .from("generations")
          .select(
            "id, user_id, status, prompt, url, image_url, error_message, model_id, aspect_ratio, cost, trigger_run_id, created_at, started_at, completed_at"
          )
          .eq("id", jobId)
          .eq("user_id", identity.canonicalUserId)
          .single(),
      { retries: 2, delayMs: 500 }
    );

    if (error || !job) {
      return NextResponse.json(
        { error: "Generation job not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      job: {
        id: String(job.id),
        status: String(job.status),
        prompt: job.prompt ? String(job.prompt) : null,
        imageUrl: job.image_url
          ? String(job.image_url)
          : job.url
            ? String(job.url)
            : null,
        errorMessage: job.error_message ? String(job.error_message) : null,
        modelId: job.model_id ? String(job.model_id) : null,
        aspectRatio: job.aspect_ratio ? String(job.aspect_ratio) : null,
        cost: Number(job.cost || 0),
        triggerRunId: job.trigger_run_id ? String(job.trigger_run_id) : null,
        createdAt: job.created_at ? String(job.created_at) : null,
        startedAt: job.started_at ? String(job.started_at) : null,
        completedAt: job.completed_at ? String(job.completed_at) : null,
      },
    });
  } catch (error) {
    console.error("[GenerateJobRoute][UnhandledError]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
