import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const occasion = searchParams.get("occasion");
  const style = searchParams.get("style");
  const color = searchParams.get("color");
  const search = searchParams.get("search");
  const limit = Number(searchParams.get("limit") ?? 50);

  let query = supabaseAdmin
    .from("inspiration_posts")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (occasion && occasion !== "all") {
    query = query.eq("occasion", occasion);
  }
  if (style && style !== "all") {
    query = query.contains("style_tags", [style]);
  }
  if (color) {
    query = query.contains("colour_palette", [color]);
  }
  if (search) {
    query = query.ilike("caption_snippet", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ posts: data ?? [] });
}
