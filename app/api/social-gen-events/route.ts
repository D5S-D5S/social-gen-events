import { NextResponse } from "next/server";

const WEBHOOK_URL =
  "https://services.leadconnectorhq.com/hooks/mlzQygQzJ24FBRxcf1jn/webhook-trigger/e57c8cc8-11eb-467d-b3e7-3c4ab986fba5";

export async function POST(request: Request) {
  try {
    const incoming = await request.formData();
    const inspirationPhotos = incoming
      .getAll("inspirationPhotos")
      .filter((value): value is File => value instanceof File)
      .map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      }));

    const payload = {
      name: incoming.get("name")?.toString() ?? "",
      phone: incoming.get("phone")?.toString() ?? "",
      eventDate: incoming.get("eventDate")?.toString() ?? "",
      eventLocation: incoming.get("eventLocation")?.toString() ?? "",
      eventType: incoming.get("eventType")?.toString() ?? "",
      notes: incoming.get("notes")?.toString() ?? "",
      inspirationPhotoCount: inspirationPhotos.length,
      inspirationPhotos,
      source: "social-gen-events-landing-page",
      submittedAt: new Date().toISOString(),
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return NextResponse.json({ ok: false }, { status: response.status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
