import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createQuote, getQuotes } from "@/lib/services/quotes.service";
import { QuoteInput } from "@/lib/types";

async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quotes = await getQuotes(user.id);
    return NextResponse.json(quotes);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch quotes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as QuoteInput;
    const quote = await createQuote(user.id, body);
    return NextResponse.json(quote, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create quote";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
