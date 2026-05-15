import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Quote, GlobalSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing/engine";

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token ?? undefined);
  return user;
}

function buildEmailHtml(quote: Quote, settings: GlobalSettings, publicUrl: string): string {
  const fmt = (v: number) => formatCurrency(v, settings.currency);
  const { breakdown, input } = quote;

  const addonRows = breakdown.addons.length > 0
    ? breakdown.addons.map((a) => `
        <tr>
          <td style="padding:8px 0;color:#4A3728;font-size:14px;">${a.name}</td>
          <td style="padding:8px 0;color:#1A1208;font-size:14px;text-align:right;font-weight:600;">${fmt(a.price)}</td>
        </tr>`).join("")
    : "";

  const feeRows = breakdown.fees.length > 0
    ? breakdown.fees.map((f) => `
        <tr>
          <td style="padding:8px 0;color:#4A3728;font-size:14px;">${f.name}</td>
          <td style="padding:8px 0;color:#1A1208;font-size:14px;text-align:right;font-weight:600;">${fmt(f.amount)}</td>
        </tr>`).join("")
    : "";

  const discountRows = breakdown.discounts.length > 0
    ? breakdown.discounts.map((d) => `
        <tr>
          <td style="padding:8px 0;color:#16A34A;font-size:14px;">${d.name}</td>
          <td style="padding:8px 0;color:#16A34A;font-size:14px;text-align:right;font-weight:600;">-${fmt(d.amount)}</td>
        </tr>`).join("")
    : "";

  const deliveryRow = breakdown.deliveryFee !== null
    ? `<tr>
        <td style="padding:8px 0;color:#4A3728;font-size:14px;">Delivery</td>
        <td style="padding:8px 0;color:#1A1208;font-size:14px;text-align:right;font-weight:600;">${breakdown.deliveryFee === 0 ? "Included" : fmt(breakdown.deliveryFee)}</td>
      </tr>`
    : "";

  const eventDate = input.eventDate
    ? new Date(input.eventDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F4F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4F1;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#F05A00;padding:28px 32px;border-radius:16px 16px 0 0;">
          <div style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.02em;">Your Quote is Ready</div>
          <div style="font-size:14px;color:rgba(255,255,255,0.8);margin-top:4px;">${quote.number}</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#fff;padding:32px;">
          <p style="font-size:16px;color:#1A1208;margin:0 0 8px;">Hi ${input.clientName || "there"},</p>
          <p style="font-size:14px;color:#4A3728;line-height:1.6;margin:0 0 24px;">
            Here is your personalised balloon decoration quote. Please review the details below and use the link at the bottom to view your full quote online.
          </p>

          ${eventDate ? `<div style="background:#F7F4F1;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9A8070;margin-bottom:4px;">Event Date</div>
            <div style="font-size:15px;font-weight:700;color:#1A1208;">${eventDate}</div>
            ${input.eventLocation ? `<div style="font-size:13px;color:#4A3728;margin-top:2px;">${input.eventLocation}</div>` : ""}
          </div>` : ""}

          <!-- Line items -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #EDE8E3;margin-bottom:16px;">
            <tr>
              <td style="padding:8px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9A8070;">Item</td>
              <td style="padding:8px 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9A8070;text-align:right;">Price</td>
            </tr>
            <tr>
              <td style="padding:8px 0;color:#4A3728;font-size:14px;">${breakdown.tierName} — ${breakdown.length}${breakdown.unit}</td>
              <td style="padding:8px 0;color:#1A1208;font-size:14px;text-align:right;font-weight:600;">${fmt(breakdown.basePrice)}</td>
            </tr>
            ${addonRows}
            ${feeRows}
            ${discountRows}
            ${deliveryRow}
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            ${breakdown.platformFeeVisible && breakdown.platformFeeAmount > 0 ? `<tr>
              <td style="padding:4px 0;font-size:13px;color:#9A8070;">${breakdown.platformFeeLabel}</td>
              <td style="padding:4px 0;font-size:13px;color:#9A8070;text-align:right;">${fmt(breakdown.platformFeeAmount)}</td>
            </tr>` : ""}
            <tr>
              <td style="padding:8px 0;font-size:16px;font-weight:800;color:#1A1208;border-top:2px solid #EDE8E3;">Subtotal</td>
              <td style="padding:8px 0;font-size:20px;font-weight:900;color:#F05A00;text-align:right;border-top:2px solid #EDE8E3;">${fmt(breakdown.subtotal)}</td>
            </tr>
          </table>

          <!-- CTA -->
          <div style="text-align:center;">
            <a href="${publicUrl}" style="display:inline-block;background:#F05A00;color:#fff;padding:14px 32px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;letter-spacing:-0.01em;">View Full Quote</a>
          </div>

          <p style="font-size:12px;color:#9A8070;line-height:1.6;margin:24px 0 0;text-align:center;">
            Questions? Just reply to this email and we'll get back to you.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F7F4F1;padding:20px 32px;border-radius:0 0 16px 16px;text-align:center;">
          <div style="font-size:11px;color:#9A8070;">This quote was generated by BalloonBase</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });

  const { quote, settings }: { quote: Quote; settings: GlobalSettings } = await req.json();

  if (!quote.input.clientEmail) {
    return NextResponse.json({ error: "Quote has no client email" }, { status: 400 });
  }

  const origin = req.headers.get("origin") ?? "https://balloon-base.vercel.app";
  const publicUrl = `${origin}/q/${quote.publicId}`;
  const html = buildEmailHtml(quote, settings, publicUrl);

  const fromDomain = process.env.RESEND_FROM_EMAIL ?? "quotes@balloonbase.co";
  const fromName = settings ? "BalloonBase" : "BalloonBase";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${fromDomain}>`,
      to: [quote.input.clientEmail],
      subject: `Your Quote ${quote.number} — ${quote.input.clientName ? `for ${quote.input.clientName}` : "is ready"}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error:", err);
    return NextResponse.json({ error: `Email failed: ${err.slice(0, 200)}` }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
