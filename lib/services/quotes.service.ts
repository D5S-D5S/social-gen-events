import { Quote, QuoteInput, QuoteStatus } from "../types";
import { supabaseAdmin } from "../supabase-admin";
import { getSettings } from "./settings.service";
import { calculateBreakdown } from "../pricing/engine";

export function generatePublicId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}

export async function generateQuoteNumber(userId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { count, error } = await supabaseAdmin
    .from("quotes_v2")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to count quotes: ${error.message}`);
  }

  const nextNumber = (count ?? 0) + 1;
  return `BB-${year}-${String(nextNumber).padStart(4, "0")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToQuote(row: Record<string, any>): Quote {
  return {
    id: row.id,
    publicId: row.public_id,
    number: row.number,
    status: row.status as QuoteStatus,
    input: row.quote_data as QuoteInput,
    breakdown: row.breakdown_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createQuote(
  userId: string,
  input: QuoteInput
): Promise<Quote> {
  const settings = await getSettings();
  const breakdown = calculateBreakdown(input, settings);

  const publicId = generatePublicId();
  const number = await generateQuoteNumber(userId);

  const { data, error } = await supabaseAdmin
    .from("quotes_v2")
    .insert({
      user_id: userId,
      public_id: publicId,
      number,
      status: "draft",
      client_name: input.clientName,
      client_email: input.clientEmail,
      event_date: input.eventDate || null,
      total: breakdown.total,
      deposit: breakdown.depositAmount,
      quote_data: input,
      breakdown_data: breakdown,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create quote: ${error?.message}`);
  }

  return rowToQuote(data);
}

export async function getQuotes(userId: string): Promise<Quote[]> {
  const { data, error } = await supabaseAdmin
    .from("quotes_v2")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch quotes: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: Record<string, any>) => rowToQuote(row));
}

export async function getQuoteById(
  id: string,
  userId: string
): Promise<Quote | null> {
  const { data, error } = await supabaseAdmin
    .from("quotes_v2")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToQuote(data);
}

export async function getQuoteByPublicId(
  publicId: string
): Promise<Quote | null> {
  const { data, error } = await supabaseAdmin
    .from("quotes_v2")
    .select("*")
    .eq("public_id", publicId)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToQuote(data);
}

export async function updateQuoteStatus(
  id: string,
  userId: string,
  status: QuoteStatus
): Promise<Quote | null> {
  const { data, error } = await supabaseAdmin
    .from("quotes_v2")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return rowToQuote(data);
}

export async function recalculateAndSave(
  id: string,
  userId: string,
  input: QuoteInput
): Promise<Quote | null> {
  const settings = await getSettings();
  const breakdown = calculateBreakdown(input, settings);

  const { data, error } = await supabaseAdmin
    .from("quotes_v2")
    .update({
      client_name: input.clientName,
      client_email: input.clientEmail,
      event_date: input.eventDate || null,
      total: breakdown.total,
      deposit: breakdown.depositAmount,
      quote_data: input,
      breakdown_data: breakdown,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return rowToQuote(data);
}

export async function deleteQuote(
  id: string,
  userId: string
): Promise<boolean> {
  const { error } = await supabaseAdmin
    .from("quotes_v2")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return !error;
}
