import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function sendNotificationEmail(
  ownerEmail: string,
  formName: string,
  data: Record<string, string>,
  labels: Record<string, string>
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const fromDomain = process.env.RESEND_FROM_EMAIL ?? "notifications@balloonbase.co";

  const rows = Object.entries(data)
    .map(([key, value]) => {
      const label = labels[key] || key;
      return `<tr>
        <td style="padding:8px 12px;font-size:13px;color:#6B7280;font-weight:600;white-space:nowrap;vertical-align:top;">${label}</td>
        <td style="padding:8px 12px;font-size:13px;color:#111;vertical-align:top;">${value || "—"}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #E5E7EB;">
        <tr><td style="background:#F05000;padding:24px 28px;">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.7);margin-bottom:4px;">New Booking Enquiry</div>
          <div style="font-size:20px;font-weight:800;color:#fff;">${formName}</div>
        </td></tr>
        <tr><td style="padding:24px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            ${rows}
          </table>
        </td></tr>
        <tr><td style="padding:16px 28px 24px;border-top:1px solid #F3F4F6;">
          <a href="https://balloon-base.vercel.app/submissions" style="display:inline-block;background:#F05000;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:700;text-decoration:none;">View in BalloonBase</a>
        </td></tr>
        <tr><td style="padding:16px 28px;background:#F9FAFB;border-top:1px solid #F3F4F6;">
          <div style="font-size:11px;color:#9CA3AF;">Sent by BalloonBase · Manage your forms at balloon-base.vercel.app</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `BalloonBase <${fromDomain}>`,
      to: [ownerEmail],
      subject: `New booking enquiry — ${formName}`,
      html,
    }),
  });
}

export async function POST(req: NextRequest) {
  const { formId, ownerId, formName, data, labels } = await req.json();

  if (!formId || !ownerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("submissions").insert({
    form_id: formId,
    form_name: formName ?? "",
    user_id: ownerId,
    data: data ?? {},
    labels: labels ?? {},
    status: "New",
    submitted_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Submit form error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send notification email to owner (fire-and-forget)
  try {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(ownerId);
    if (userData?.user?.email) {
      await sendNotificationEmail(userData.user.email, formName ?? "Booking Form", data ?? {}, labels ?? {});
    }
  } catch (emailErr) {
    console.error("Notification email error:", emailErr);
    // Don't fail the submission if email fails
  }

  return NextResponse.json({ ok: true });
}
