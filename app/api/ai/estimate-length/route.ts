import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminEmail } from "@/lib/admin";
import { canUseAiTools, getPlan } from "@/lib/plans";

type Confidence = "Low" | "Medium" | "High";

type ReferenceObject = {
  id: string;
  label: string;
  estimatedSize: string;
  userSize: string;
  reason: string;
};

type EstimateResult = {
  minLength: number;
  maxLength: number;
  recommendedLength: number;
  unit: "ft" | "m";
  confidence: Confidence;
  reasoning: string;
  assumptions: string[];
};

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
  use_for_estimator?: boolean;
  status?: string;
};

function currentResetMonth() {
  return new Date().toISOString().slice(0, 7);
}

function cleanJson(text: string) {
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return cleaned.startsWith("{") ? cleaned : cleaned.slice(cleaned.indexOf("{"), cleaned.lastIndexOf("}") + 1);
}

function parseReferenceObjects(text: string): ReferenceObject[] {
  const parsed = JSON.parse(cleanJson(text)) as { referenceObjects?: Partial<ReferenceObject>[] };
  const rows = Array.isArray(parsed.referenceObjects) ? parsed.referenceObjects : [];
  return rows.slice(0, 8).map((item, index) => ({
    id: item.id ? String(item.id) : `ref-${index + 1}`,
    label: String(item.label ?? "Reference object"),
    estimatedSize: String(item.estimatedSize ?? ""),
    userSize: String(item.userSize ?? item.estimatedSize ?? ""),
    reason: String(item.reason ?? ""),
  }));
}

function parseEstimate(text: string): EstimateResult {
  const parsed = JSON.parse(cleanJson(text)) as Partial<EstimateResult>;
  const unit = parsed.unit === "m" ? "m" : "ft";
  const recommendedLength = Math.max(0, Number(parsed.recommendedLength ?? 0));
  const minLength = Math.max(0, Number(parsed.minLength ?? recommendedLength));
  const maxLength = Math.max(minLength, Number(parsed.maxLength ?? recommendedLength));
  const confidence = ["Low", "Medium", "High"].includes(String(parsed.confidence))
    ? parsed.confidence as Confidence
    : "Medium";

  return {
    minLength,
    maxLength,
    recommendedLength: recommendedLength || Math.round((minLength + maxLength) / 2),
    unit,
    confidence,
    reasoning: String(parsed.reasoning ?? "Estimate based on the supplied reference image and confirmed reference sizes."),
    assumptions: Array.isArray(parsed.assumptions) ? parsed.assumptions.map(String) : ["Final length should be checked against real venue measurements."],
  };
}

async function getGeminiParts(form: FormData, prompt: string) {
  const image = form.get("image");
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (image instanceof File && image.size > 0) {
    const bytes = Buffer.from(await image.arrayBuffer()).toString("base64");
    parts.push({
      inline_data: {
        mime_type: image.type || "image/jpeg",
        data: bytes,
      },
    });
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

async function loadAiReferenceContext() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from("ai-reference-data")
      .download("library/references.json");

    if (error || !data) {
      return { summary: "No approved BalloonBase AI reference images are available yet.", parts: [] as Array<Record<string, unknown>> };
    }

    const parsed = JSON.parse(await data.text()) as { references?: AiReferenceRow[] } | AiReferenceRow[];
    const rows = (Array.isArray(parsed) ? parsed : parsed.references ?? [])
      .filter((item) => item.status === "approved")
      .slice(0, 6);

    if (!rows.length) {
      return { summary: "No approved BalloonBase AI reference images are available yet.", parts: [] as Array<Record<string, unknown>> };
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
    for (const [index, item] of rows.slice(0, 3).entries()) {
      if (!item.image_url) continue;
      const imagePart = await imageUrlToPart(item.image_url);
      if (!imagePart) continue;
      parts.push({ text: `Approved BalloonBase reference image ${index + 1}. Use this only as visual context for common balloon proportions, coverage patterns, and styling. Do not copy it directly.` });
      parts.push(imagePart);
    }

    return { summary, parts };
  } catch {
    return { summary: "No approved BalloonBase AI reference images are available yet.", parts: [] as Array<Record<string, unknown>> };
  }
}

async function callGemini(parts: Array<Record<string, unknown>>) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

  const configuredModel = process.env.GEMINI_MODEL?.trim();
  const modelCandidates = [
    configuredModel,
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-flash-lite",
  ].filter((model, index, list): model is string => Boolean(model) && list.indexOf(model) === index);

  let lastError = "Gemini request failed.";

  for (const model of modelCandidates) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      lastError = body?.error?.message ?? `Gemini request failed for ${model}.`;
      const isModelProblem = response.status === 404 || /not found|not supported|model/i.test(lastError);
      if (isModelProblem) continue;
      throw new Error(lastError);
    }

    const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      lastError = `Gemini did not return a response from ${model}.`;
      continue;
    }
    return text as string;
  }

  throw new Error(`${lastError} Check GEMINI_MODEL or remove it to use gemini-2.5-flash.`);
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const mode = String(form.get("mode") ?? "estimate");
  const unit = form.get("unit") === "m" ? "m" : "ft";
  const designNotes = String(form.get("designNotes") ?? "");

  try {
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
        error: "AI Length Estimator is available on the Pro plan.",
        usage: {
          planName: planDefinition.label,
          aiTokensIncluded: tokenLimit,
          aiTokensUsed: usedThisMonth,
          aiTokensRemaining: 0,
        },
      }, { status: 403 });
    }

    if (mode === "analyze") {
      const referenceContext = await loadAiReferenceContext();
      const prompt = `You are an expert balloon decor assistant.

Analyze the uploaded image and identify visible real-world reference objects that could help estimate scale for a balloon setup.

Look for:
- people, adults, children
- door frames, ceilings, windows
- chairs, tables, cars, houses
- cake stands, plinths, sailboards, shimmer walls, backdrop frames
- balloon walls, known decor items, floor tiles, standard furniture

Do not estimate balloon garland length yet.

Return JSON only:
{
  "referenceObjects": [
    {
      "id": "short-id",
      "label": "Woman in image",
      "estimatedSize": "5ft 6in",
      "userSize": "5ft 6in",
      "reason": "Useful human height reference"
    }
  ]
}

If unclear, return likely references with conservative estimated sizes and explain uncertainty in reason.

Approved BalloonBase reference library context:
${referenceContext.summary}

The reference library examples are only visual vocabulary. The user's uploaded image is the primary image to analyze.

Design notes:
${designNotes}`;

      const parts = await getGeminiParts(form, prompt);
      parts.push(...referenceContext.parts);
      const text = await callGemini(parts);
      return NextResponse.json({ referenceObjects: parseReferenceObjects(text) });
    }

    if (!admin && remaining <= 0) {
      return NextResponse.json({
        error: `You have used all ${tokenLimit} AI estimates included in your ${planDefinition.label} plan.`,
        usage: {
          planName: planDefinition.label,
          aiTokensIncluded: tokenLimit,
          aiTokensUsed: usedThisMonth,
          aiTokensRemaining: 0,
        },
      }, { status: 402 });
    }

    let referenceObjects: ReferenceObject[] = [];
    try {
      referenceObjects = JSON.parse(String(form.get("referenceObjects") ?? "[]")) as ReferenceObject[];
    } catch {
      referenceObjects = [];
    }

    const referenceContext = await loadAiReferenceContext();
    const prompt = `You are an expert balloon decor pricing assistant.

Estimate the likely balloon garland length required for the uploaded event setup image.

Use the confirmed reference object sizes supplied by the user to infer real-world scale.
Return a range, not one exact number.

Consider:
- visible balloon coverage: top only, one side, two sides, full frame, floor area, multiple boards
- reference object sizes
- backdrop proportions
- design notes
- uncertainty in the image

Return JSON only:
{
  "minLength": number,
  "maxLength": number,
  "recommendedLength": number,
  "unit": "${unit}",
  "confidence": "Low" | "Medium" | "High",
  "reasoning": "string",
  "assumptions": ["string"]
}

If information is unclear, give a wider range and lower confidence.
Do not overpromise accuracy.

Approved BalloonBase reference library context:
${referenceContext.summary}

The reference library examples are only supporting context for common balloon decor proportions, coverage patterns, and style language. The user's uploaded image and confirmed reference sizes are the primary source of truth.

Measurement unit: ${unit}
Design notes: ${designNotes}
Reference objects and confirmed sizes:
${JSON.stringify(referenceObjects, null, 2)}`;

    const parts = await getGeminiParts(form, prompt);
    parts.push(...referenceContext.parts);
    const text = await callGemini(parts);
    const result = parseEstimate(text);
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
        return NextResponse.json({ error: "Estimate succeeded, but AI usage could not be saved. Please try again." }, { status: 500 });
      }
    }

    return NextResponse.json({
      ...result,
      warning: "This is an estimate. Check real measurements, venue constraints, and final design coverage before quoting.",
      usage: {
        planName: planDefinition.label,
        aiTokensIncluded: tokenLimit,
        aiTokensUsed: nextUsed,
        aiTokensRemaining: Math.max(0, tokenLimit - nextUsed),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI Length Estimator failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
