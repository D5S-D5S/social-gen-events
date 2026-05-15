import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";
import { canUseAiTools, getPlan } from "@/lib/plans";

export const runtime = "nodejs";

type AiReferenceRow = {
  title: string;
  image_url: string | null;
  source_url: string | null;
  setup_type: string | null;
  event_type: string | null;
  style_level: string | null;
  coverage: string | null;
  tags: string[] | null;
  colours: string[] | null;
  notes: string | null;
  use_for_mockup?: boolean;
  status?: string;
};

type InlineImage = {
  data: string;
  mimeType: string;
};

const OUTPUT_BUCKET = "mockup-generations";
const DATA_BUCKET = "ai-reference-data";
const LIBRARY_PATH = "library/references.json";

function currentResetMonth() {
  return new Date().toISOString().slice(0, 7);
}

function safeStorageName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(0, 90);
}

function imageExtension(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  return "png";
}

async function ensureOutputBucket() {
  await supabaseAdmin.storage.createBucket(OUTPUT_BUCKET, {
    public: true,
    fileSizeLimit: 12 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  }).catch(() => {});
}

async function fileToPart(file: File | null) {
  if (!file || file.size <= 0) return null;
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  return {
    inline_data: {
      mime_type: file.type || "image/jpeg",
      data,
    },
  };
}

async function filesToNumberedParts(files: File[]) {
  const parts: Array<Record<string, unknown>> = [];
  for (const [index, file] of files.entries()) {
    const imagePart = await fileToPart(file);
    if (!imagePart) continue;
    parts.push({
      text: `User-uploaded extra reference image ${index + 1}. If the prompt mentions Reference ${index + 1}, follow that instruction carefully.`,
    });
    parts.push(imagePart);
  }
  return parts;
}

async function imageUrlToPart(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;

    const length = Number(response.headers.get("content-length") ?? 0);
    if (length > 7_000_000) return null;

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

async function loadMockupReferenceContext() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(DATA_BUCKET)
      .download(LIBRARY_PATH);

    if (error || !data) {
      return { summary: "No approved BalloonBase mockup reference images are available yet.", parts: [] as Array<Record<string, unknown>> };
    }

    const parsed = JSON.parse(await data.text()) as { references?: AiReferenceRow[] } | AiReferenceRow[];
    const rows = (Array.isArray(parsed) ? parsed : parsed.references ?? [])
      .filter((item) => item.status === "approved" && item.image_url)
      .slice(0, 10);

    if (!rows.length) {
      return { summary: "No approved BalloonBase mockup reference images are available yet.", parts: [] as Array<Record<string, unknown>> };
    }

    const summary = rows.map((item, index) => {
      const bits = [
        item.setup_type && `setup: ${item.setup_type}`,
        item.event_type && `event: ${item.event_type}`,
        item.style_level && `style: ${item.style_level}`,
        item.coverage && `coverage: ${item.coverage}`,
        item.colours?.length && `colours: ${item.colours.join(", ")}`,
        item.tags?.length && `tags: ${item.tags.join(", ")}`,
        item.notes && `notes: ${item.notes}`,
      ].filter(Boolean);
      return `${index + 1}. ${item.title || "Reference image"} - ${bits.join("; ")}`;
    }).join("\n");

    const parts: Array<Record<string, unknown>> = [];
    for (const [index, item] of rows.slice(0, 6).entries()) {
      if (!item.image_url) continue;
      const imagePart = await imageUrlToPart(item.image_url);
      if (!imagePart) continue;
      parts.push({ text: `Global BalloonBase AI reference ${index + 1}. Use this to understand balloon realism, density, proportions, coverage, and styling used across the product. User-uploaded images still take priority.` });
      parts.push(imagePart);
    }

    return { summary, parts };
  } catch {
    return { summary: "No approved BalloonBase mockup reference images are available yet.", parts: [] as Array<Record<string, unknown>> };
  }
}

function getOutputImage(parts: Array<Record<string, unknown>>): InlineImage | null {
  for (const part of parts) {
    const inlineData = (part.inlineData ?? part.inline_data) as { data?: string; mimeType?: string; mime_type?: string } | undefined;
    if (!inlineData?.data) continue;
    return {
      data: inlineData.data,
      mimeType: inlineData.mimeType ?? inlineData.mime_type ?? "image/png",
    };
  }
  return null;
}

async function callGeminiImage(parts: Array<Record<string, unknown>>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const configuredModel = process.env.GEMINI_IMAGE_MODEL?.trim();
  const modelCandidates = [
    configuredModel,
    "gemini-2.5-flash-image",
    "gemini-3-pro-image-preview",
  ].filter((model, index, list): model is string => Boolean(model) && list.indexOf(model) === index);

  let lastError = "Gemini image generation failed.";

  for (const model of modelCandidates) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.7,
        },
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      lastError = body?.error?.message ?? `Gemini image generation failed for ${model}.`;
      const isModelProblem = response.status === 404 || /not found|not supported|model/i.test(lastError);
      if (isModelProblem) continue;
      throw new Error(lastError);
    }

    const outputParts = body?.candidates?.[0]?.content?.parts ?? [];
    const image = getOutputImage(outputParts);
    const text = outputParts.map((part: { text?: string }) => part.text).filter(Boolean).join("\n").trim();
    if (image) return { image, text, model };

    lastError = text
      ? `Gemini returned text but no image: ${text}`
      : `Gemini did not return an image from ${model}.`;
  }

  throw new Error(`${lastError} Check GEMINI_IMAGE_MODEL, or leave it blank to use Gemini image defaults.`);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const inspirationImage = form.get("image") instanceof File ? form.get("image") as File : null;
    const referenceImages = form.getAll("referenceImages").filter((item): item is File => item instanceof File && item.size > 0).slice(0, 6);
    const eventType = String(form.get("eventType") ?? "Birthday");
    const backdropType = String(form.get("backdropType") ?? "Double sailboard");
    const styleLevel = String(form.get("styleLevel") ?? "Premium");
    const colours = String(form.get("colours") ?? "");
    const addOns = String(form.get("addOns") ?? "");
    const outputBackground = String(form.get("outputBackground") ?? "Clean white studio background");
    const designNotes = String(form.get("designNotes") ?? "");

    const admin = isAdminEmail(user.email);
    const month = currentResetMonth();
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("plan, ai_uses_this_month, ai_uses_reset_month")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: "Could not load AI usage for this account." }, { status: 500 });
    }

    const plan = profile?.plan ?? "starter";
    const planDefinition = getPlan(plan, admin);
    const tokenLimit = planDefinition.aiTokensIncluded;
    const storedMonth = profile?.ai_uses_reset_month as string | null | undefined;
    const usedThisMonth = storedMonth === month ? Number(profile?.ai_uses_this_month ?? 0) : 0;
    const remaining = tokenLimit - usedThisMonth;

    if (!canUseAiTools(plan, admin)) {
      return NextResponse.json({
        error: "AI Mockup Generator is available on the Pro plan.",
        usage: {
          planName: planDefinition.label,
          aiTokensIncluded: tokenLimit,
          aiTokensUsed: usedThisMonth,
          aiTokensRemaining: 0,
        },
      }, { status: 403 });
    }

    if (!admin && remaining <= 0) {
      return NextResponse.json({
        error: `You have used all ${tokenLimit} AI tokens included in your ${planDefinition.label} plan.`,
        usage: {
          planName: planDefinition.label,
          aiTokensIncluded: tokenLimit,
          aiTokensUsed: usedThisMonth,
          aiTokensRemaining: 0,
        },
      }, { status: 402 });
    }

    const referenceContext = await loadMockupReferenceContext();
    const promptSummary = [
      `${styleLevel} ${eventType.toLowerCase()} balloon mockup`,
      backdropType,
      colours ? `Colours: ${colours}` : "",
      addOns ? `Add-ons: ${addOns}` : "",
      referenceImages.length ? `${referenceImages.length} extra reference image${referenceImages.length === 1 ? "" : "s"}` : "",
      outputBackground,
    ].filter(Boolean).join(" | ");

    const prompt = `You are an expert balloon decor mockup designer for BalloonBase.

Create one client-ready balloon decor mockup image.

The image must be:
- realistic and buildable for a balloon decorator
- clean, polished, and suitable to send to a client for approval
- centered on the decor setup
- free from watermarks, logos, UI, screenshots, text blocks, people, hands, and messy backgrounds
- on this output background: ${outputBackground}

Priority order:
1. The main inspiration image is the primary visual target. Match its balloon layout, shape, density, scale, coverage, composition, and overall arrangement as closely as possible while changing the requested details.
2. Extra user-uploaded reference images are secondary. They are numbered Reference 1, Reference 2, etc. If the user prompt mentions a specific reference number, follow that instruction.
3. Global BalloonBase reference images are background style knowledge. Use them for realistic balloon sizing, organic clustering, fullness, and buildable balloon decor language.

Do not reproduce creator branding, watermarks, people, or text from any reference image. Do not make a loose generic arch if the main image shows a specific setup. The result should clearly look inspired by the uploaded image.

The user's selected fields are the ground truth:
- Event type: ${eventType}
- Backdrop type: ${backdropType}
- Style level: ${styleLevel}
- Colours: ${colours || "Use tasteful neutral balloon colours"}
- Add-ons/extras: ${addOns || "No extra add-ons requested"}
- Design notes: ${designNotes || "No extra notes"}

Global BalloonBase AI reference context:
${referenceContext.summary}

The final image must be one coherent, clean mockup, not a collage.

Generate the image now.`;

    const parts: Array<Record<string, unknown>> = [{ text: prompt }];
    const inspirationPart = await fileToPart(inspirationImage);
    if (inspirationPart) {
      parts.push({ text: "MAIN INSPIRATION IMAGE. Treat this as the primary visual target for layout, shape, balloon density, and arrangement." });
      parts.push(inspirationPart);
    }
    parts.push(...await filesToNumberedParts(referenceImages));
    parts.push(...referenceContext.parts);

    const generated = await callGeminiImage(parts);
    await ensureOutputBucket();

    const ext = imageExtension(generated.image.mimeType);
    const storagePath = `${user.id}/${Date.now()}-${safeStorageName(`${backdropType}-${eventType}`)}.${ext}`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from(OUTPUT_BUCKET)
      .upload(storagePath, Buffer.from(generated.image.data, "base64"), {
        contentType: generated.image.mimeType,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const imageUrl = supabaseAdmin.storage.from(OUTPUT_BUCKET).getPublicUrl(storagePath).data.publicUrl;
    const nextUsed = admin ? usedThisMonth : usedThisMonth + 1;

    if (!admin) {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          ai_uses_this_month: nextUsed,
          ai_uses_reset_month: month,
        })
        .eq("id", user.id);

      if (updateError) {
        return NextResponse.json({ error: "Mockup generated, but AI usage could not be saved. Please try again." }, { status: 500 });
      }
    }

    return NextResponse.json({
      imageUrl,
      model: generated.model,
      promptSummary,
      usage: {
        planName: planDefinition.label,
        aiTokensIncluded: tokenLimit,
        aiTokensUsed: nextUsed,
        aiTokensRemaining: Math.max(0, tokenLimit - nextUsed),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI Mockup Generator failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
