import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, configured: false, message: "RESEND_API_KEY not configured" });
  }

  const body = await req.json().catch(() => ({})) as { fullName?: string; businessName?: string };
  const firstName = body.fullName?.split(" ")[0] || "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@balloonbase.co";

  const html = `<!doctype html>
<html>
<body style="margin:0;background:#f7f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#101828;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:36px 18px;background:#f7f4f1;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="padding:28px 30px;background:#0d0d0d;color:#fff;">
          <div style="font-size:22px;font-weight:900;">Balloon<span style="color:#f05000;">Base</span></div>
          <div style="font-size:13px;color:rgba(255,255,255,0.64);margin-top:6px;">Your account is ready.</div>
        </td></tr>
        <tr><td style="padding:30px;">
          <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">Welcome, ${firstName}.</h1>
          <p style="font-size:14px;line-height:1.7;margin:0 0 18px;color:#667085;">Your BalloonBase workspace${body.businessName ? ` for ${body.businessName}` : ""} is set up. You can now create quotes, manage Catalog/Inventory/Packages/Add-ons, and set your global pricing defaults.</p>
          <a href="${appUrl}/app/dashboard" style="display:inline-block;background:#f05000;color:#fff;text-decoration:none;font-weight:800;font-size:14px;padding:12px 18px;border-radius:10px;">Open dashboard</a>
          <p style="font-size:12px;line-height:1.6;color:#98a2b3;margin:22px 0 0;">You are receiving this because you created a BalloonBase account.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `BalloonBase <${fromEmail}>`,
      to: [user.email],
      subject: "Welcome to BalloonBase",
      html,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ error: errorText.slice(0, 200) }, { status: 500 });
  }

  return NextResponse.json({ success: true, configured: true });
}
