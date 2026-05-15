import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Stripe from "stripe";
import { isAdminEmail } from "@/lib/admin";
import { getPlan, canUseAiTools } from "@/lib/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

function currentResetMonth() {
  return new Date().toISOString().slice(0, 7);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAdminEmail(user.email)) {
    const adminPlan = getPlan("admin", true);
    return NextResponse.json({
      plan: "admin",
      planName: adminPlan.label,
      aiUsesThisMonth: 0,
      aiLimit: adminPlan.aiTokensIncluded,
      aiTokensIncluded: adminPlan.aiTokensIncluded,
      aiTokensUsed: 0,
      aiTokensRemaining: adminPlan.aiTokensIncluded,
      hasAiTools: true,
      mockupTokensIncluded: adminPlan.mockupTokensIncluded,
      hasSubscription: true,
      resetMonth: null,
      trialEligible: false,
    });
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("plan, stripe_customer_id, stripe_subscription_id, ai_uses_this_month, ai_uses_reset_month")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const plan = getPlan(profile.plan);
  const limit = plan.aiTokensIncluded;
  const resetMonth = profile.ai_uses_reset_month === currentResetMonth() ? profile.ai_uses_reset_month : currentResetMonth();
  const used = profile.ai_uses_reset_month === currentResetMonth() ? Number(profile.ai_uses_this_month ?? 0) : 0;

  // Check trial eligibility — has user ever had a subscription?
  let trialEligible = true;
  if (profile.stripe_customer_id) {
    try {
      const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, limit: 10 });
      if (subs.data.length > 0) trialEligible = false;
    } catch {
      trialEligible = false;
    }
  }

  return NextResponse.json({
    plan: profile.plan,
    planName: plan.label,
    planDisplayName: plan.displayName,
    aiUsesThisMonth: used,
    aiLimit: limit,
    aiTokensIncluded: limit,
    aiTokensUsed: used,
    aiTokensRemaining: Math.max(0, limit - used),
    mockupTokensIncluded: plan.mockupTokensIncluded,
    hasAiTools: canUseAiTools(profile.plan),
    hasSubscription: ["tier_1", "tr1", "pro", "enterprise"].includes(profile.plan ?? "") || !!profile.stripe_subscription_id,
    resetMonth,
    trialEligible,
  });
}
