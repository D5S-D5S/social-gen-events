import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/qFRPoaFd15buGDiNYH4l/webhook-trigger/b36dafcd-604a-41f0-820b-2daeaaa85618";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const payload = {
    name:                  body.name ?? "",
    email:                 body.email ?? "",
    how_did_you_hear:      body.heardFrom ?? "",
    most_excited_feature:  body.excitedFeature ?? "",
    events_per_month:      body.eventsPerMonth ?? "",
    source:                "waitlist_page",
    submitted_at:          new Date().toISOString(),
  };

  const res = await fetch(WEBHOOK_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Webhook failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
