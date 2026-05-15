import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  if (isAdminEmail(user.email)) return user;
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).single();
  return profile?.is_admin ? user : null;
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Fetch all profiles
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, user_id, plan, is_admin, stripe_customer_id, created_at")
    .order("created_at", { ascending: false });

  // Fetch all auth users for email + signup date
  const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });

  // Fetch total payments
  const { data: payments } = await supabaseAdmin
    .from("payments")
    .select("amount, user_id, created_at");

  // Fetch total quotes
  const { data: quotes } = await supabaseAdmin
    .from("quotes")
    .select("id, user_id, created_at");

  // Fetch storefronts for "view storefront" links
  const { data: storefronts } = await supabaseAdmin
    .from("storefronts")
    .select("user_id, slug, published");

  const profileList = profiles ?? [];
  const paymentList = payments ?? [];
  const quoteList = quotes ?? [];

  // Build storefront map: userId → { slug, published }
  const storefrontMap: Record<string, { slug: string; published: boolean }> = {};
  for (const sf of storefronts ?? []) {
    storefrontMap[sf.user_id] = { slug: sf.slug, published: sf.published };
  }

  // Build user map
  const userMap: Record<string, { email: string; created_at: string }> = {};
  for (const u of authUsers ?? []) {
    userMap[u.id] = { email: u.email ?? "", created_at: u.created_at };
  }

  // Per-plan counts
  const planCounts: Record<string, number> = { free: 0, starter: 0, pro: 0 };
  for (const p of profileList) {
    const plan = p.plan ?? "free";
    planCounts[plan] = (planCounts[plan] ?? 0) + 1;
  }

  // Total revenue (all payments)
  const totalRevenue = paymentList.reduce((s, p) => s + Number(p.amount ?? 0), 0);

  // Revenue per user
  const revenueByUser: Record<string, number> = {};
  for (const p of paymentList) {
    revenueByUser[p.user_id] = (revenueByUser[p.user_id] ?? 0) + Number(p.amount ?? 0);
  }

  // Quotes per user
  const quotesByUser: Record<string, number> = {};
  for (const q of quoteList) {
    quotesByUser[q.user_id] = (quotesByUser[q.user_id] ?? 0) + 1;
  }

  // Recent signups (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentSignups = (authUsers ?? []).filter((u) => u.created_at >= thirtyDaysAgo).length;

  // Build accounts list
  const accounts = profileList.map((p) => {
    const uid = p.user_id ?? p.id;
    const auth = userMap[uid];
    return {
      id: uid,
      email: auth?.email ?? "—",
      plan: p.plan ?? "free",
      is_admin: p.is_admin ?? false,
      revenue: revenueByUser[uid] ?? 0,
      quotes: quotesByUser[uid] ?? 0,
      joinedAt: auth?.created_at ?? p.created_at,
      storefront: storefrontMap[uid] ?? null,
    };
  });

  return NextResponse.json({
    totalUsers: profileList.length,
    totalRevenue,
    planCounts,
    recentSignups,
    accounts,
    totalQuotes: quoteList.length,
  });
}
