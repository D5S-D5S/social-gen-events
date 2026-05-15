import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storefront_id, name, email, phone, event_date, package_id, message, colours, occasion } = body;

  if (!storefront_id || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Validate date format if provided
  if (event_date && isNaN(Date.parse(event_date))) {
    return NextResponse.json({ error: "Invalid event_date format" }, { status: 400 });
  }

  // Verify storefront exists
  const { data: storefront } = await supabaseAdmin
    .from("storefronts")
    .select("id, user_id, business_name")
    .eq("id", storefront_id)
    .single();

  if (!storefront) {
    return NextResponse.json({ error: "Storefront not found" }, { status: 404 });
  }

  const { data: lead, error } = await supabaseAdmin
    .from("storefront_leads")
    .insert({
      storefront_id,
      name,
      email,
      phone,
      event_date: event_date || null,
      package_id: package_id || null,
      message,
      colours: colours || [],
      occasion: occasion || null,
      status: "new",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify storefront owner (fire and forget)
  try {
    const { data: ownerAuth } = await supabaseAdmin.auth.admin.getUserById(storefront.user_id);
    if (ownerAuth?.user?.email) {
      // Email notification would go here via Resend (same pattern as booking forms)
      console.log(`New storefront enquiry for ${storefront.business_name} from ${name} <${email}>`);
    }
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ success: true, lead });
}
