import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: storefront } = await supabaseAdmin
    .from("storefronts")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: packages } = await supabaseAdmin
    .from("storefront_packages")
    .select("*")
    .eq("storefront_id", storefront?.id ?? "")
    .order("sort_order", { ascending: true });

  return NextResponse.json({ storefront: storefront ?? null, packages: packages ?? [] });
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    slug, business_name, tagline, logo_url, hero_url,
    brand_primary, brand_accent, enquiry_mode,
    show_prices, collect_deposit, published, template,
    bio, gallery_urls, contact_email, contact_phone, instagram_handle,
  } = body;

  // Check slug uniqueness (if changing)
  if (slug) {
    const { data: existing } = await supabaseAdmin
      .from("storefronts")
      .select("id, user_id")
      .eq("slug", slug)
      .single();
    if (existing && existing.user_id !== user.id) {
      return NextResponse.json({ error: "This URL slug is already taken" }, { status: 409 });
    }
  }

  const { data, error } = await supabaseAdmin
    .from("storefronts")
    .upsert({
      user_id: user.id,
      slug: slug ?? user.id.slice(0, 12),
      business_name, tagline, logo_url, hero_url,
      brand_primary: brand_primary ?? "#F05000",
      brand_accent: brand_accent ?? "#1A1A1A",
      enquiry_mode: enquiry_mode ?? "enquire",
      show_prices: show_prices ?? true,
      collect_deposit: collect_deposit ?? false,
      published: published ?? false,
      template: template ?? "studio",
      bio: bio ?? null,
      gallery_urls: gallery_urls ?? [],
      contact_email: contact_email ?? null,
      contact_phone: contact_phone ?? null,
      instagram_handle: instagram_handle ?? null,
    }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ storefront: data });
}
