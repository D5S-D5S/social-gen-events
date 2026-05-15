import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const { slug } = params;

  const { data: storefront, error } = await supabaseAdmin
    .from("storefronts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (error || !storefront) {
    return NextResponse.json({ error: "Storefront not found" }, { status: 404 });
  }

  const { data: packages } = await supabaseAdmin
    .from("storefront_packages")
    .select("*")
    .eq("storefront_id", storefront.id)
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  const { data: testimonials } = await supabaseAdmin
    .from("storefront_testimonials")
    .select("*")
    .eq("storefront_id", storefront.id)
    .order("sort_order", { ascending: true });

  return NextResponse.json({
    storefront,
    packages: packages ?? [],
    testimonials: testimonials ?? [],
  });
}
