import { NextRequest, NextResponse } from "next/server";
import { getQuoteByPublicId } from "@/lib/services/quotes.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: { publicId: string } }
) {
  try {
    const quote = await getQuoteByPublicId(params.publicId);

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    // Return stripped quote — never return user_id
    const { input, breakdown, number, status, publicId } = quote;

    return NextResponse.json({
      number,
      status,
      publicId,
      input: {
        clientName: input.clientName,
        eventDate: input.eventDate,
        eventLocation: input.eventLocation,
        notes: input.notes,
      },
      breakdown,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch quote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
