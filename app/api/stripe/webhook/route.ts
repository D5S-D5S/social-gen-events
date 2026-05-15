import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

function planFromSubscription(sub: Stripe.Subscription) {
  const metadataPlan = sub.metadata?.plan;
  if (metadataPlan === "pro" || metadataPlan === "tier_1" || metadataPlan === "tr1") return metadataPlan === "tr1" ? "tier_1" : metadataPlan;
  const priceId = sub.items.data[0]?.price?.id;
  if (priceId && priceId === process.env.STRIPE_PRICE_ID_PRO) return "pro";
  return "tier_1";
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription") {
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        if (userId) {
          await supabaseAdmin.from("profiles").update({
            plan: session.metadata?.plan === "pro" ? "pro" : "tier_1",
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
          }).eq("id", userId);
        }
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const active = ["active", "trialing"].includes(sub.status);
      const userId = sub.metadata?.userId;
      if (userId) {
        const plan = planFromSubscription(sub);
        await supabaseAdmin.from("profiles").update({
          plan: active ? plan : "starter",
          stripe_subscription_id: sub.id,
        }).eq("id", userId);
      } else {
        // Fall back to customer_id lookup
        const plan = planFromSubscription(sub);
        await supabaseAdmin.from("profiles").update({
          plan: active ? plan : "starter",
        }).eq("stripe_subscription_id", sub.id);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabaseAdmin.from("profiles").update({
        plan: "starter",
        stripe_subscription_id: null,
      }).eq("stripe_subscription_id", sub.id);
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
