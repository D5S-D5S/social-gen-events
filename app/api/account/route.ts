import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type SaasSettings = {
  fullName?: string;
  businessName?: string;
  phone?: string;
  website?: string;
  marketingOptIn?: boolean;
  newsletterEnabled?: boolean;
  welcomeEmailEnabled?: boolean;
  fromName?: string;
  replyToEmail?: string;
  customDomain?: string;
  storefrontDomain?: string;
  ghlAccountName?: string;
  ghlLocationId?: string;
  ghlWhitelabelUrl?: string;
  ghlConnectedEmail?: string;
  ghlConnectionStatus?: "not_connected" | "pending" | "connected";
};

async function getUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanSettings(body: Partial<SaasSettings>): Partial<SaasSettings> {
  const next: Partial<SaasSettings> = {};
  const has = (key: keyof SaasSettings) => Object.prototype.hasOwnProperty.call(body, key);

  if (has("fullName")) next.fullName = cleanString(body.fullName);
  if (has("businessName")) next.businessName = cleanString(body.businessName);
  if (has("phone")) next.phone = cleanString(body.phone);
  if (has("website")) next.website = cleanString(body.website);
  if (has("marketingOptIn")) next.marketingOptIn = Boolean(body.marketingOptIn);
  if (has("newsletterEnabled")) next.newsletterEnabled = Boolean(body.newsletterEnabled);
  if (has("welcomeEmailEnabled")) next.welcomeEmailEnabled = body.welcomeEmailEnabled !== false;
  if (has("fromName")) next.fromName = cleanString(body.fromName);
  if (has("replyToEmail")) next.replyToEmail = cleanString(body.replyToEmail);
  if (has("customDomain")) next.customDomain = cleanString(body.customDomain).toLowerCase();
  if (has("storefrontDomain")) next.storefrontDomain = cleanString(body.storefrontDomain).toLowerCase();
  if (has("ghlAccountName")) next.ghlAccountName = cleanString(body.ghlAccountName);
  if (has("ghlLocationId")) next.ghlLocationId = cleanString(body.ghlLocationId);
  if (has("ghlWhitelabelUrl")) next.ghlWhitelabelUrl = cleanString(body.ghlWhitelabelUrl);
  if (has("ghlConnectedEmail")) next.ghlConnectedEmail = cleanString(body.ghlConnectedEmail);
  if (has("ghlConnectionStatus")) next.ghlConnectionStatus = body.ghlConnectionStatus === "connected" || body.ghlConnectionStatus === "pending" ? body.ghlConnectionStatus : "not_connected";

  return next;
}

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("plan, stripe_customer_id, stripe_subscription_id, saas_settings")
    .eq("id", user.id)
    .maybeSingle();

  const metadata = user.user_metadata ?? {};
  const settings = (profile?.saas_settings ?? {}) as SaasSettings;

  if (error) {
    return NextResponse.json({
      email: user.email,
      plan: "starter",
      settings: {
        fullName: metadata.full_name ?? "",
        businessName: metadata.business_name ?? "",
        marketingOptIn: Boolean(metadata.marketing_opt_in),
        welcomeEmailEnabled: true,
        newsletterEnabled: Boolean(metadata.marketing_opt_in),
      },
      schemaReady: false,
    });
  }

  return NextResponse.json({
    email: user.email,
    plan: profile?.plan ?? "starter",
    hasStripeCustomer: Boolean(profile?.stripe_customer_id),
    hasSubscription: Boolean(profile?.stripe_subscription_id),
    settings: {
      fullName: settings.fullName ?? metadata.full_name ?? "",
      businessName: settings.businessName ?? metadata.business_name ?? "",
      phone: settings.phone ?? "",
      website: settings.website ?? "",
      marketingOptIn: Boolean(settings.marketingOptIn ?? metadata.marketing_opt_in),
      newsletterEnabled: Boolean(settings.newsletterEnabled ?? metadata.marketing_opt_in),
      welcomeEmailEnabled: settings.welcomeEmailEnabled !== false,
      fromName: settings.fromName ?? settings.businessName ?? metadata.business_name ?? "BalloonBase",
      replyToEmail: settings.replyToEmail ?? user.email ?? "",
      customDomain: settings.customDomain ?? "",
      storefrontDomain: settings.storefrontDomain ?? "",
      ghlAccountName: settings.ghlAccountName ?? "",
      ghlLocationId: settings.ghlLocationId ?? "",
      ghlWhitelabelUrl: settings.ghlWhitelabelUrl ?? "",
      ghlConnectedEmail: settings.ghlConnectedEmail ?? "",
      ghlConnectionStatus: settings.ghlConnectionStatus ?? "not_connected",
    },
    schemaReady: true,
  });
}

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Partial<SaasSettings>;
  const incoming = cleanSettings(body);

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("saas_settings")
    .eq("id", user.id)
    .maybeSingle();

  const nextSettings = {
    ...((profile?.saas_settings ?? {}) as SaasSettings),
    ...incoming,
  };

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: user.id,
      saas_settings: nextSettings,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: "Could not save account settings. Run the SaaS settings migration first." }, { status: 500 });
  }

  await supabaseAdmin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      full_name: nextSettings.fullName,
      business_name: nextSettings.businessName,
      marketing_opt_in: nextSettings.marketingOptIn,
    },
  });

  if (user.email) {
    if (nextSettings.newsletterEnabled || nextSettings.marketingOptIn) {
      await supabaseAdmin
        .from("newsletter_subscribers")
        .upsert({
          user_id: user.id,
          email: user.email,
          full_name: nextSettings.fullName ?? "",
          business_name: nextSettings.businessName ?? "",
          source: "account_settings",
          status: "subscribed",
          updated_at: new Date().toISOString(),
        }, { onConflict: "email" });
    } else {
      await supabaseAdmin
        .from("newsletter_subscribers")
        .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
        .eq("email", user.email);
    }
  }

  return NextResponse.json({ success: true, settings: nextSettings });
}
