import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}

// GET — check current Stripe Connect status
export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_account_id, stripe_connected")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_account_id) {
    return NextResponse.json({ connected: false, accountId: null });
  }

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id);
    const isConnected = !!(account.charges_enabled || account.details_submitted);

    // Auto-mark connected once Stripe confirms
    if (isConnected && !profile.stripe_connected) {
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_connected: true })
        .eq("id", user.id);
    }

    return NextResponse.json({
      connected: isConnected,
      accountId: profile.stripe_account_id,
      chargesEnabled: account.charges_enabled,
      detailsSubmitted: account.details_submitted,
    });
  } catch {
    return NextResponse.json({ connected: false, accountId: profile.stripe_account_id });
  }
}

// POST — start Connect onboarding
export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

  try {
    // Check if user already has a Stripe account
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", userId)
      .single();

    let accountId = profile?.stripe_account_id as string | undefined;

    // Create a new Express account if none exists
    if (!accountId) {
      const account = await stripe.accounts.create({ type: "express" });
      accountId = account.id;
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", userId);
    }

    // Create a fresh account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/connect/callback?refresh=true&userId=${userId}`,
      return_url:  `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=integrations&connect_success=true`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (err) {
    console.error("Stripe Connect error:", err);
    return NextResponse.json({ error: "Failed to start Stripe Connect" }, { status: 500 });
  }
}
