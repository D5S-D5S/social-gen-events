import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).single();
  return profile?.is_admin ? user : null;
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const {
    source_platform, source_url, external_post_id,
    creator_handle, creator_display_name, thumbnail_url,
    media_type, caption_snippet, tags, colour_palette,
    occasion, style_tags, attribution_required, status,
  } = body;

  if (!creator_handle || !caption_snippet) {
    return NextResponse.json({ error: "creator_handle and caption_snippet are required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("inspiration_posts")
    .insert({
      source_platform: source_platform ?? "instagram",
      source_url: source_url ?? null,
      external_post_id: external_post_id ?? null,
      creator_handle,
      creator_display_name: creator_display_name ?? creator_handle,
      thumbnail_url: thumbnail_url ?? null,
      media_type: media_type ?? "image",
      caption_snippet,
      tags: tags ?? [],
      colour_palette: colour_palette ?? [],
      occasion: occasion ?? "Birthday",
      style_tags: style_tags ?? [],
      attribution_required: attribution_required ?? true,
      status: status ?? "published",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabaseAdmin.from("inspiration_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, source_platform, source_url, creator_handle, creator_display_name, thumbnail_url,
    media_type, caption_snippet, tags, colour_palette, occasion, style_tags,
    attribution_required, status } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (source_platform !== undefined) updates.source_platform = source_platform;
  if (source_url !== undefined) updates.source_url = source_url;
  if (creator_handle !== undefined) updates.creator_handle = creator_handle;
  if (creator_display_name !== undefined) updates.creator_display_name = creator_display_name;
  if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
  if (media_type !== undefined) updates.media_type = media_type;
  if (caption_snippet !== undefined) updates.caption_snippet = caption_snippet;
  if (tags !== undefined) updates.tags = tags;
  if (colour_palette !== undefined) updates.colour_palette = colour_palette;
  if (occasion !== undefined) updates.occasion = occasion;
  if (style_tags !== undefined) updates.style_tags = style_tags;
  if (attribution_required !== undefined) updates.attribution_required = attribution_required;
  if (status !== undefined) updates.status = status;

  const { data, error } = await supabaseAdmin
    .from("inspiration_posts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}
