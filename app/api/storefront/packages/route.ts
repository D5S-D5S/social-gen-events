import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function getAuthUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}

async function getUserStorefront(userId: string) {
  const { data } = await supabaseAdmin
    .from("storefronts")
    .select("id")
    .eq("user_id", userId)
    .single();
  return data?.id ?? null;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storefrontId = await getUserStorefront(user.id);
  if (!storefrontId) return NextResponse.json({ error: "No storefront found — save brand settings first" }, { status: 404 });

  const body = await req.json();
  const { title, description, starting_price, fixed_price, tags, occasion, image_url, visible, sort_order } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("storefront_packages")
    .insert({
      storefront_id: storefrontId,
      title,
      description: description ?? "",
      starting_price: starting_price ?? null,
      fixed_price: fixed_price ?? null,
      tags: tags ?? [],
      occasion: occasion ?? "Other",
      image_url: image_url ?? null,
      visible: visible ?? true,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ package: data });
}

export async function PUT(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storefrontId = await getUserStorefront(user.id);
  if (!storefrontId) return NextResponse.json({ error: "No storefront" }, { status: 404 });

  const body = await req.json();
  const { id, title, description, starting_price, fixed_price, tags, occasion, image_url, visible, sort_order } = body;

  // Allowlist — never allow storefront_id or id to be overwritten via body
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (starting_price !== undefined) updates.starting_price = starting_price;
  if (fixed_price !== undefined) updates.fixed_price = fixed_price;
  if (tags !== undefined) updates.tags = tags;
  if (occasion !== undefined) updates.occasion = occasion;
  if (image_url !== undefined) updates.image_url = image_url;
  if (visible !== undefined) updates.visible = visible;
  if (sort_order !== undefined) updates.sort_order = sort_order;

  const { data, error } = await supabaseAdmin
    .from("storefront_packages")
    .update(updates)
    .eq("id", id)
    .eq("storefront_id", storefrontId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ package: data });
}

export async function DELETE(req: NextRequest) {
  const user = await getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storefrontId = await getUserStorefront(user.id);
  if (!storefrontId) return NextResponse.json({ error: "No storefront" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin
    .from("storefront_packages")
    .delete()
    .eq("id", id)
    .eq("storefront_id", storefrontId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
