import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";

type AiReference = {
  id: string;
  title: string;
  source_platform: string;
  source_url: string | null;
  creator_handle: string | null;
  image_url: string | null;
  storage_path: string | null;
  setup_type: string;
  event_type: string;
  style_level: string;
  coverage: string;
  tags: string[];
  colours: string[];
  notes: string;
  use_for_estimator: boolean;
  use_for_mockup: boolean;
  status: "approved" | "draft" | "hidden";
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type AutoTags = {
  title?: string;
  setup_type?: string;
  event_type?: string;
  style_level?: string;
  coverage?: string;
  tags?: string[];
  colours?: string[];
  notes?: string;
};

const IMAGE_BUCKET = "ai-reference-images";
const DATA_BUCKET = "ai-reference-data";
const LIBRARY_PATH = "library/references.json";

function asCsvArray(value: FormDataEntryValue | null) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return cleaned.startsWith("{") ? cleaned : cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1);
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 90);
}

async function requireAdmin(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user } } = await supabaseAdmin.auth.getUser(token);
  if (!user) return null;
  if (isAdminEmail(user.email)) return user;
  const { data: profile } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).single();
  return profile?.is_admin ? user : null;
}

async function ensureBuckets() {
  await supabaseAdmin.storage.createBucket(IMAGE_BUCKET, {
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  }).catch(() => {});

  await supabaseAdmin.storage.createBucket(DATA_BUCKET, {
    public: false,
    fileSizeLimit: 1024 * 1024,
    allowedMimeTypes: ["application/json"],
  }).catch(() => {});
}

async function readLibrary(): Promise<AiReference[]> {
  await ensureBuckets();
  const { data, error } = await supabaseAdmin.storage.from(DATA_BUCKET).download(LIBRARY_PATH);
  if (error || !data) return [];

  try {
    const parsed = JSON.parse(await data.text()) as { references?: AiReference[] } | AiReference[];
    const references = Array.isArray(parsed) ? parsed : parsed.references ?? [];
    return references.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch {
    return [];
  }
}

async function writeLibrary(references: AiReference[]) {
  await ensureBuckets();
  const body = JSON.stringify({ references }, null, 2);
  const { error } = await supabaseAdmin.storage
    .from(DATA_BUCKET)
    .upload(LIBRARY_PATH, body, {
      contentType: "application/json",
      upsert: true,
    });
  if (error) throw new Error(error.message);
}

async function imageToInlinePart(image: File | null, imageUrl: string | null) {
  if (image && image.size > 0) {
    const data = Buffer.from(await image.arrayBuffer()).toString("base64");
    return {
      inline_data: {
        mime_type: image.type || "image/jpeg",
        data,
      },
    };
  }

  if (!imageUrl) return null;

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const data = Buffer.from(await response.arrayBuffer()).toString("base64");
    return {
      inline_data: {
        mime_type: contentType,
        data,
      },
    };
  } catch {
    return null;
  }
}

async function callGeminiJson(parts: Array<Record<string, unknown>>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const modelCandidates = [
    configuredModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
  ].filter((model, index, list): model is string => Boolean(model) && list.indexOf(model) === index);

  for (const model of modelCandidates) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.15,
        },
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      const message = body?.error?.message ?? "";
      if (response.status === 404 || /not found|not supported|model/i.test(message)) continue;
      return null;
    }

    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;
    try {
      return JSON.parse(cleanJson(text)) as AutoTags;
    } catch {
      return null;
    }
  }

  return null;
}

async function autoTagReference(params: {
  image: File | null;
  imageUrl: string | null;
  sourceUrl: string | null;
  notes: string;
}) {
  const imagePart = await imageToInlinePart(params.image, params.imageUrl);
  const parts: Array<Record<string, unknown>> = [
    {
      text: `You are tagging a balloon decor reference image for BalloonBase AI tools.

Return JSON only:
{
  "title": "short useful title",
  "setup_type": "single sailboard | double sailboard | triple sailboard | shimmer wall | hoop | arch | garland | full display | other",
  "event_type": "Birthday | Wedding | Baby shower | Gender reveal | Christening | Corporate | Graduation | Prom | Private party | Other",
  "style_level": "simple | standard | premium | luxury",
  "coverage": "top only | one side | two sides | full frame | floor garland | mixed",
  "tags": ["balloon arch", "sailboard", "organic garland"],
  "colours": ["pink", "white", "gold"],
  "notes": "short visual summary"
}

Source URL if supplied: ${params.sourceUrl ?? ""}
Admin notes if supplied: ${params.notes}`,
    },
  ];
  if (imagePart) parts.push(imagePart);
  return callGeminiJson(parts);
}

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const references = await readLibrary();
  return NextResponse.json({ references });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    await ensureBuckets();
    const form = await req.formData();
    const image = form.get("image") instanceof File ? form.get("image") as File : null;
    const directImageUrl = String(form.get("image_url") ?? "").trim();
    const sourceUrl = String(form.get("source_url") ?? "").trim();
    const notes = String(form.get("notes") ?? "").trim();
    const autoTag = String(form.get("auto_tag") ?? "true") === "true";

    const sourceLooksLikeImage = /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(sourceUrl);
    let imageUrl = directImageUrl || (sourceLooksLikeImage ? sourceUrl : null);
    let storagePath: string | null = null;

    if (image && image.size > 0) {
      storagePath = `${admin.id}/${Date.now()}-${safeFileName(image.name || "reference.jpg")}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(IMAGE_BUCKET)
        .upload(storagePath, Buffer.from(await image.arrayBuffer()), {
          contentType: image.type || "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      imageUrl = supabaseAdmin.storage.from(IMAGE_BUCKET).getPublicUrl(storagePath).data.publicUrl;
    }

    const generated = autoTag ? await autoTagReference({ image, imageUrl, sourceUrl, notes }) : null;
    const now = new Date().toISOString();

    const reference: AiReference = {
      id: crypto.randomUUID(),
      title: String(form.get("title") ?? generated?.title ?? "AI reference").trim(),
      source_platform: String(form.get("source_platform") ?? "upload").trim() || "upload",
      source_url: sourceUrl || null,
      creator_handle: String(form.get("creator_handle") ?? "").trim() || null,
      image_url: imageUrl,
      storage_path: storagePath,
      setup_type: String(form.get("setup_type") ?? generated?.setup_type ?? "").trim(),
      event_type: String(form.get("event_type") ?? generated?.event_type ?? "").trim(),
      style_level: String(form.get("style_level") ?? generated?.style_level ?? "").trim(),
      coverage: String(form.get("coverage") ?? generated?.coverage ?? "").trim(),
      tags: asCsvArray(form.get("tags")).length ? asCsvArray(form.get("tags")) : generated?.tags ?? [],
      colours: asCsvArray(form.get("colours")).length ? asCsvArray(form.get("colours")) : generated?.colours ?? [],
      notes: notes || generated?.notes || "",
      use_for_estimator: String(form.get("use_for_estimator") ?? "true") === "true",
      use_for_mockup: String(form.get("use_for_mockup") ?? "true") === "true",
      status: ["approved", "draft", "hidden"].includes(String(form.get("status"))) ? String(form.get("status")) as AiReference["status"] : "approved",
      created_by: admin.id,
      created_at: now,
      updated_at: now,
    };

    const references = await readLibrary();
    references.unshift(reference);
    await writeLibrary(references);

    return NextResponse.json({ reference });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save AI reference.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const references = await readLibrary();
    let updated: AiReference | null = null;
    const next = references.map((item) => {
      if (item.id !== id) return item;
      updated = { ...item, ...updates, updated_at: new Date().toISOString() } as AiReference;
      return updated;
    });

    if (!updated) return NextResponse.json({ error: "Reference not found" }, { status: 404 });
    await writeLibrary(next);
    return NextResponse.json({ reference: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update AI reference.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const references = await readLibrary();
    const existing = references.find((item) => item.id === id);
    await writeLibrary(references.filter((item) => item.id !== id));

    if (existing?.storage_path) {
      await supabaseAdmin.storage.from(IMAGE_BUCKET).remove([existing.storage_path]);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not delete AI reference.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
