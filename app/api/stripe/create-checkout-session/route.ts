import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPlan, canonicalPlan } from "@/lib/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
    const { userId, email, plan } = await req.json() as { userId?: string; email?: string; plan?: string };

    if (!userId || !email) {
      return NextResponse.json({ error: "Missing userId or email" }, { status: 400 });
    }

    const planKey = canonicalPlan(plan === "pro" ? "pro" : "tier_1");
    const selectedPlan = getPlan(planKey);
    const proPlanAvailable = process.env.PRO_PLAN_AVAILABLE === "true" || process.env.NEXT_PUBLIC_PRO_PLAN_AVAILABLE === "true";

    if (selectedPlan.key === "pro" && !proPlanAvailable) {
      return NextResponse.json({ error: "Pro is coming soon. AI tools are not available for checkout yet." }, { status: 403 });
    }

    if (selectedPlan.monthlyAmount <= 0) {
      return NextResponse.json({ error: "This plan cannot be purchased through checkout." }, { status: 400 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    let customerId = profile?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { userId } });
      customerId = customer.id;
      await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
    }

    let trialEligible = true;
    try {
      const existingSubs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
      trialEligible = existingSubs.data.length === 0;
    } catch {
      trialEligible = false;
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const configuredPriceId = selectedPlan.key === "pro"
      ? process.env.STRIPE_PRICE_ID_PRO
      : process.env.STRIPE_PRICE_ID_TIER_1 ?? process.env.STRIPE_PRICE_ID_STARTER;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        configuredPriceId
          ? { price: configuredPriceId, quantity: 1 }
          : {
              price_data: {
                currency: selectedPlan.currency,
                product_data: {
                  name: selectedPlan.stripeName,
                  description: selectedPlan.description,
                },
                unit_amount: selectedPlan.monthlyAmount,
                recurring: { interval: "month" },
              },
              quantity: 1,
            },
      ],
      subscription_data: {
        ...(trialEligible ? { trial_period_days: 7 } : {}),
        metadata: { userId, plan: selectedPlan.key },
      },
      metadata: { userId, plan: selectedPlan.key },
      allow_promotion_codes: true,
      success_url: `${appUrl}/app/billing?subscribed=true&plan=${selectedPlan.key}`,
      cancel_url: `${appUrl}/app/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
