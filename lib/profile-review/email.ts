import {
  profileReviewConfig,
  requireResendApiKey,
} from "@/lib/profile-review/config";
import type { ProfileReviewFullReport } from "@/lib/profile-review/types";

function renderList(items: string[]) {
  return items.map((item) => `<li style="margin:0 0 8px;">${item}</li>`).join("");
}

function renderActionList(items: ProfileReviewFullReport["fullActionPlan"]) {
  return items
    .map(
      (item) => `
        <div style="padding:14px 16px;border:1px solid #1d3a25;background:#0f1316;margin:0 0 12px;border-radius:12px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#65f57a;">${item.priority}</div>
          <div style="margin:6px 0 0;font-size:18px;font-weight:700;color:#ffffff;">${item.title}</div>
          <div style="margin:8px 0 0;color:#aab3b8;line-height:1.6;">${item.rationale}</div>
          <div style="margin:10px 0 0;color:#ffffff;line-height:1.6;"><strong>Action:</strong> ${item.action}</div>
          <div style="margin:10px 0 0;color:#aab3b8;line-height:1.6;"><strong>Success metric:</strong> ${item.successMetric}</div>
        </div>
      `
    )
    .join("");
}

function buildProfileReviewEmailHtml(params: {
  report: ProfileReviewFullReport;
  reportUrl: string;
}) {
  const { report, reportUrl } = params;

  return `
  <div style="background:#090b0d;padding:32px 0;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <div style="max-width:720px;margin:0 auto;padding:0 20px;">
      <div style="border:1px solid #18311e;background:#101417;border-radius:24px;overflow:hidden;">
        <div style="padding:28px 28px 18px;border-bottom:1px solid #173120;background:linear-gradient(180deg,#13261a,#0f1317);">
          <div style="display:inline-block;background:#60f770;color:#0a110d;font-weight:800;padding:6px 10px;border-radius:999px;text-transform:uppercase;font-size:12px;letter-spacing:.08em;">DatingPhotosAI Report</div>
          <h1 style="margin:16px 0 8px;font-size:36px;line-height:1.05;">Your dating profile review is unlocked</h1>
          <p style="margin:0;color:#b8c1c7;line-height:1.7;">Your full report is ready. We've also unlocked it on-site so you can revisit it any time after signing in.</p>
        </div>
        <div style="padding:28px;">
          <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-end;">
            <div>
              <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#8fa39a;">Overall score</div>
              <div style="font-size:72px;line-height:1;font-weight:800;">${report.overallScore}</div>
            </div>
            <div style="padding-bottom:10px;">
              <div style="font-size:26px;font-weight:700;color:#63f276;">/ 50</div>
              <div style="margin-top:6px;color:#c9d0d4;">${report.scoreLabel}</div>
            </div>
          </div>

          <p style="margin:18px 0 0;color:#d5dce0;line-height:1.8;">${report.scoreSummary}</p>

          <div style="margin:28px 0 0;padding:18px 20px;border:1px solid #18311e;background:#0d1114;border-radius:16px;">
            <div style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#65f57a;font-weight:700;">Top issues</div>
            <ul style="margin:14px 0 0;padding-left:20px;color:#dbe2e6;line-height:1.8;">
              ${renderList(report.topIssues)}
            </ul>
          </div>

          <div style="margin:28px 0 0;">
            <div style="font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#65f57a;font-weight:700;">Highest-impact actions</div>
            <div style="margin-top:14px;">
              ${renderActionList(report.fullActionPlan.slice(0, 5))}
            </div>
          </div>

          <div style="margin:28px 0 0;padding:22px;border:1px solid #1c3a25;background:#0e1415;border-radius:18px;text-align:center;">
            <div style="font-size:16px;font-weight:700;color:#ffffff;">Open the full on-site report</div>
            <p style="margin:10px 0 18px;color:#adb7bd;line-height:1.7;">Review your photo ranking, keep-or-drop guidance, retake blueprint, and 7-day plan in the unlocked dashboard view.</p>
            <a href="${reportUrl}" style="display:inline-block;background:#63f276;color:#0a100d;font-weight:800;padding:14px 22px;border-radius:12px;text-decoration:none;">Open my report</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  `.trim();
}

export async function sendProfileReviewReportEmail(params: {
  to: string;
  report: ProfileReviewFullReport;
  reportUrl: string;
}) {
  const apiKey = requireResendApiKey();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: profileReviewConfig.reportFromEmail,
      to: [params.to],
      reply_to: profileReviewConfig.reportReplyTo || undefined,
      subject: `Your dating profile report: ${params.report.overallScore}/100`,
      html: buildProfileReviewEmailHtml(params),
    }),
  });

  const json = (await response.json()) as Record<string, unknown>;

  if (!response.ok) {
    throw new Error(
      typeof json.message === "string"
        ? json.message
        : "Failed to send report email"
    );
  }

  return json;
}
