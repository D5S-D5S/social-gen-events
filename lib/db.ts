import { supabase } from "./supabase";

// ─── Auth helper ───────────────────────────────────────────────
export async function getUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Quotes ────────────────────────────────────────────────────
export async function getQuotes() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("quotes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function saveQuote(quote: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("quotes").insert({ ...quote, user_id: userId }).select().single();
  return data;
}

export async function updateQuote(id: string, updates: Record<string, unknown>) {
  const { data } = await supabase.from("quotes").update(updates).eq("id", id).select().single();
  return data;
}

export async function deleteQuote(id: string) {
  await supabase.from("quotes").delete().eq("id", id);
}

// ─── Customers ─────────────────────────────────────────────────
export async function getCustomer(id: string) {
  const { data } = await supabase.from("customers").select("*").eq("id", id).single();
  return data;
}

export async function getCustomers() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("customers").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function saveCustomer(customer: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("customers").insert({ ...customer, user_id: userId }).select().single();
  return data;
}

export async function updateCustomer(id: string, updates: Record<string, unknown>) {
  const { data } = await supabase.from("customers").update(updates).eq("id", id).select().single();
  return data;
}

export async function deleteCustomer(id: string) {
  await supabase.from("customers").delete().eq("id", id);
}

// ─── Payments ──────────────────────────────────────────────────
export async function getPayments() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("payments").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function savePayment(payment: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("payments").insert({ ...payment, user_id: userId }).select().single();
  return data;
}

export async function deletePayment(id: string) {
  await supabase.from("payments").delete().eq("id", id);
}

// ─── Customer Notes ────────────────────────────────────────────
export async function getCustomerNotes(customerId: string) {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("customer_notes").select("*").eq("user_id", userId).eq("customer_id", customerId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function saveCustomerNote(customerId: string, text: string) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("customer_notes").insert({ user_id: userId, customer_id: customerId, text }).select().single();
  return data;
}

export async function deleteCustomerNote(id: string) {
  await supabase.from("customer_notes").delete().eq("id", id);
}

// ─── Booking Forms ─────────────────────────────────────────────
export async function getBookingForms() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("booking_forms").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function saveBookingForm(form: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("booking_forms").insert({ ...form, user_id: userId }).select().single();
  return data;
}

export async function updateBookingForm(id: string, updates: Record<string, unknown>) {
  const { data } = await supabase.from("booking_forms").update(updates).eq("id", id).select().single();
  return data;
}

export async function deleteBookingForm(id: string) {
  await supabase.from("booking_forms").delete().eq("id", id);
}

// ─── Profiles ──────────────────────────────────────────────────
export async function getProfile() {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data ?? null;
}

export async function upsertProfile(updates: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select()
    .single();
  return data;
}

// ─── Bookings ───────────────────────────────────────────────────
export async function getBookings() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("event_date", { ascending: true });
  return data ?? [];
}

export async function saveBooking(booking: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase
    .from("bookings")
    .insert({ ...booking, user_id: userId })
    .select()
    .single();
  return data;
}

export async function updateBooking(id: string, updates: Record<string, unknown>) {
  const { data } = await supabase.from("bookings").update(updates).eq("id", id).select().single();
  return data;
}

export async function deleteBooking(id: string) {
  await supabase.from("bookings").delete().eq("id", id);
}

// ─── Packages / Products ────────────────────────────────────────
export async function getPackages(type?: "package" | "product") {
  const userId = await getUserId();
  if (!userId) return [];
  let query = supabase.from("packages").select("*").eq("profile_id", userId).eq("is_active", true).order("name");
  if (type) query = query.eq("type", type);
  const { data } = await query;
  return data ?? [];
}

export async function savePackage(pkg: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("packages").insert({ ...pkg, profile_id: userId }).select().single();
  return data;
}

export async function updatePackage(id: string, updates: Record<string, unknown>) {
  const { data } = await supabase.from("packages").update(updates).eq("id", id).select().single();
  return data;
}

export async function deletePackage(id: string) {
  await supabase.from("packages").delete().eq("id", id);
}

// ─── Inventory ──────────────────────────────────────────────────
export async function getInventory() {
  const userId = await getUserId();
  if (!userId) return [];
  const { data } = await supabase.from("inventory").select("*").eq("profile_id", userId).order("name");
  return data ?? [];
}

export async function saveInventory(item: Record<string, unknown>) {
  const userId = await getUserId();
  if (!userId) return null;
  const { data } = await supabase.from("inventory").insert({ ...item, profile_id: userId }).select().single();
  return data;
}

export async function updateInventory(id: string, updates: Record<string, unknown>) {
  const { data } = await supabase.from("inventory").update(updates).eq("id", id).select().single();
  return data;
}

export async function deleteInventory(id: string) {
  await supabase.from("inventory").delete().eq("id", id);
}

// ─── Submissions ───────────────────────────────────────────────
export async function getSubmissions(formId?: string) {
  const userId = await getUserId();
  if (!userId) return [];
  let query = supabase.from("submissions").select("*").eq("user_id", userId).order("submitted_at", { ascending: false });
  if (formId) query = query.eq("form_id", formId);
  const { data } = await query;
  return data ?? [];
}

export async function updateSubmission(id: string, updates: Record<string, unknown>) {
  const { data } = await supabase.from("submissions").update(updates).eq("id", id).select().single();
  return data;
}
