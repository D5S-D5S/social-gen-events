import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

// This route handles:
// 1. refresh_url — when the account link expires, Stripe sends user here.
//    We re-create the account link and redirect them to continue onboarding.
// 2. Legacy OAuth callback (connect_error / code params) — kept for safety.
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isRefresh = searchParams.get("refresh") === "true";
  const userId    = searchParams.get("userId");
  const error     = searchParams.get("error");

  const base = process.env.NEXT_PUBLIC_APP_URL!;

  // Legacy OAuth error
  if (error) {
    return NextResponse.redirect(`${base}/settings?tab=integrations&connect_error=${error}`);
  }

  // Refresh — re-create account link so onboarding can resume
  if (isRefresh && userId) {
    try {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("stripe_account_id")
        .eq("id", userId)
        .single();

      if (!profile?.stripe_account_id) {
        return NextResponse.redirect(`${base}/settings?tab=integrations&connect_error=no_account`);
      }

      const accountLink = await stripe.accountLinks.create({
        account: profile.stripe_account_id,
        refresh_url: `${base}/api/stripe/connect/callback?refresh=true&userId=${userId}`,
        return_url:  `${base}/settings?tab=integrations&connect_success=true`,
        type: "account_onboarding",
      });

      return NextResponse.redirect(accountLink.url);
    } catch (err) {
      console.error("Stripe refresh error:", err);
      return NextResponse.redirect(`${base}/settings?tab=integrations&connect_error=refresh_failed`);
    }
  }

  // Default — success redirect (Stripe sends user here after finishing onboarding)
  return NextResponse.redirect(`${base}/settings?tab=integrations&connect_success=true`);
}
