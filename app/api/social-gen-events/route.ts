import { NextResponse } from "next/server";

const WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/mlzQygQzJ24FBRxcf1jn/webhook-trigger/e57c8cc8-11eb-467d-b3e7-3c4ab986fba5";

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();
    const payload = new FormData();

    for (const [key, value] of incoming.entries()) {
      payload.append(key, value);
    }

    payload.append("source", "social-gen-events-landing-page");
    payload.append("submittedAt", new Date().toISOString());

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      body: payload,
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false }, { status: response.status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
