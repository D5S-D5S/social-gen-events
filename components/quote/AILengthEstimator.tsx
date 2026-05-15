"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Usage = {
  planName: string;
  aiTokensIncluded: number;
  aiTokensUsed: number;
  aiTokensRemaining: number;
};

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
  confidence: "Low" | "Medium" | "High";
  reasoning: string;
  assumptions: string[];
  warning?: string;
  usage?: Usage;
};

const inputCss: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  fontFamily: "var(--font-ui)",
  boxSizing: "border-box",
};

const labelCss: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 800,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
};

export default function AILengthEstimator() {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [unit, setUnit] = useState<"ft" | "m">("ft");
  const [designNotes, setDesignNotes] = useState("");
  const [referenceObjects, setReferenceObjects] = useState<ReferenceObject[]>([]);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [loadingStep, setLoadingStep] = useState<"analyze" | "estimate" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadUsage() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/billing/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setUsage({
        planName: data.planName ?? "TR1",
        aiTokensIncluded: Number(data.aiTokensIncluded ?? 0),
        aiTokensUsed: Number(data.aiTokensUsed ?? 0),
        aiTokensRemaining: Number(data.aiTokensRemaining ?? 0),
      });
    }

    loadUsage().catch(() => {});
  }, []);

  const canEstimate = (usage?.aiTokensRemaining ?? 0) > 0 || usage?.planName === "ADMIN";
  const resultUrl = useMemo(() => {
    if (!result) return "";
    return `length=${encodeURIComponent(result.recommendedLength)}&unit=${encodeURIComponent(result.unit)}`;
  }, [result]);

  async function callEstimator(mode: "analyze" | "estimate") {
    setError(null);
    setLoadingStep(mode);
    if (mode === "estimate") setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please log in to use the AI Length Estimator.");
      if (!image) throw new Error("Upload a reference image first.");

      const form = new FormData();
      form.set("mode", mode);
      form.set("unit", unit);
      form.set("designNotes", designNotes);
      form.set("referenceObjects", JSON.stringify(referenceObjects));
      form.set("image", image);

      const res = await fetch("/api/ai/estimate-length", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "AI Length Estimator failed.");

      if (mode === "analyze") {
        setReferenceObjects((data.referenceObjects ?? []).map((item: ReferenceObject, index: number) => ({
          id: item.id ?? `ref-${index}`,
          label: item.label ?? "Reference object",
          estimatedSize: item.estimatedSize ?? "",
          userSize: item.userSize ?? item.estimatedSize ?? "",
          reason: item.reason ?? "",
        })));
      } else {
        setResult(data as EstimateResult);
        if (data.usage) setUsage(data.usage);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI Length Estimator failed.");
    } finally {
      setLoadingStep(null);
    }
  }

  function updateReference(id: string, userSize: string) {
    setReferenceObjects((prev) => prev.map((item) => item.id === id ? { ...item, userSize } : item));
  }

  function copyRecommended() {
    if (!result) return;
    navigator.clipboard.writeText(`${result.recommendedLength}${result.unit}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "var(--orange)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Tools</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0, color: "var(--text)" }}>AI Length Estimator</h1>
        <p style={{ color: "var(--text-3)", fontSize: 13, maxWidth: 680, lineHeight: 1.6 }}>
          Upload a reference image. The AI identifies real-world scale objects first, then uses your confirmed sizes to estimate a balloon garland length range.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 300px", gap: 18, alignItems: "start" }} className="estimator-layout">
        <div>
          <StepCard number="1" title="Upload image">
            <label style={{ ...inputCss, minHeight: 150, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", borderStyle: "dashed", cursor: "pointer", background: "var(--surface-2)" }}>
              <input type="file" accept="image/*" onChange={(e) => { setImage(e.target.files?.[0] ?? null); setReferenceObjects([]); setResult(null); }} style={{ display: "none" }} />
              <span>
                <strong style={{ color: "var(--text)" }}>{image ? image.name : "Choose reference image"}</strong>
                <br />
                <span style={{ color: "var(--text-3)", fontSize: 12 }}>Previous setup, inspiration image, venue photo, mockup, or sketch</span>
              </span>
            </label>
            <div style={{ marginTop: 14 }}>
              <Field title="Measurement unit">
                <select value={unit} onChange={(e) => setUnit(e.target.value as "ft" | "m")} style={inputCss}>
                  <option value="ft">Feet</option>
                  <option value="m">Metres</option>
                </select>
              </Field>
            </div>
            <div style={{ marginTop: 14 }}>
              <Field title="Design notes">
                <textarea
                  value={designNotes}
                  onChange={(e) => setDesignNotes(e.target.value)}
                  rows={4}
                  placeholder="Example: balloons across the top and down one side of a double sailboard setup with a cake stand in front."
                  style={{ ...inputCss, resize: "vertical" }}
                />
              </Field>
            </div>
            <button type="button" onClick={() => callEstimator("analyze")} disabled={!image || loadingStep !== null} style={primaryButton(!image || loadingStep !== null)}>
              {loadingStep === "analyze" ? "Analyzing image..." : "Analyze image"}
            </button>
          </StepCard>

          <StepCard number="2" title="Confirm reference sizes">
            {referenceObjects.length === 0 ? (
              <p style={{ margin: 0, color: "var(--text-3)", fontSize: 13 }}>Upload an image and click Analyze image. The AI will list visible reference objects here.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                <p style={{ margin: "0 0 4px", color: "var(--text-3)", fontSize: 13 }}>Edit any sizes you know. Leave unknown sizes blank.</p>
                {referenceObjects.map((item) => (
                  <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 12, background: "var(--surface-2)" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12 }} className="reference-row">
                      <div>
                        <strong style={{ fontSize: 13, color: "var(--text)" }}>{item.label}</strong>
                        <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--text-3)", lineHeight: 1.45 }}>
                          Estimated: {item.estimatedSize || "Unknown"}{item.reason ? ` - ${item.reason}` : ""}
                        </p>
                      </div>
                      <input value={item.userSize} onChange={(e) => updateReference(item.id, e.target.value)} placeholder="e.g. 6ft" style={inputCss} />
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => callEstimator("estimate")} disabled={!canEstimate || loadingStep !== null} style={primaryButton(!canEstimate || loadingStep !== null)}>
                  {loadingStep === "estimate" ? "Estimating length..." : "Estimate balloon length"}
                </button>
                {!canEstimate && (
                  <p style={{ margin: 0, color: "var(--red)", fontSize: 12, fontWeight: 700 }}>You have used all {usage?.aiTokensIncluded ?? 0} AI estimates included in your {usage?.planName ?? "Pro"} plan.</p>
                )}
              </div>
            )}
          </StepCard>

          {result && (
            <StepCard number="3" title="Estimate result">
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", marginBottom: 14 }} className="result-head">
                <div>
                  <div style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>Estimated Range</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 900, color: "var(--text)" }}>{result.minLength}{result.unit}-{result.maxLength}{result.unit}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.07em" }}>Recommended</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: 38, fontWeight: 900, color: "var(--orange)" }}>{result.recommendedLength}{result.unit}</div>
                </div>
              </div>
              <p style={bodyText}><strong>Confidence:</strong> {result.confidence}</p>
              <p style={bodyText}><strong>Reasoning:</strong> {result.reasoning}</p>
              <p style={bodyText}><strong>Assumptions:</strong> {result.assumptions.join("; ")}</p>
              <p style={{ ...bodyText, fontSize: 12 }}>{result.warning ?? "This is an estimate, not a guarantee. Check real measurements before quoting."}</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
                <button type="button" onClick={copyRecommended} style={secondaryButton}>{copied ? "Copied" : "Copy recommended length"}</button>
                <Link href={`/app/quick-quote?${resultUrl}`} style={linkButton}>Send to Quick Quote</Link>
                <Link href={`/app/detailed-quote?${resultUrl}`} style={linkButton}>Send to Detailed Quote</Link>
                <button type="button" onClick={() => localStorage.setItem("bb_last_ai_length_estimate", JSON.stringify(result))} style={secondaryButton}>Save estimate</button>
              </div>
            </StepCard>
          )}

          {error && <div style={{ color: "var(--red)", background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: "var(--r-lg)", padding: 12, fontSize: 13, fontWeight: 700 }}>{error}</div>}
        </div>

        <aside style={{ position: "sticky", top: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 18, boxShadow: "var(--shadow-sm)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 16, margin: "0 0 8px", color: "var(--text)" }}>Usage</h2>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-3)", lineHeight: 1.5 }}>
            {usage ? `${usage.aiTokensRemaining} of ${usage.aiTokensIncluded} estimates remaining on ${usage.planName}.` : "Loading AI usage..."}
          </p>
          <div style={{ display: "grid", gap: 8, fontSize: 12, color: "var(--text-3)" }}>
            <div>This tool does not change quote pricing by itself.</div>
            <div>Use the send buttons after an estimate to pre-fill a quote length.</div>
            <div>Leave unknown reference sizes blank.</div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .estimator-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 680px) {
          .reference-row,
          .result-head {
            grid-template-columns: 1fr !important;
            text-align: left !important;
          }
        }
      `}</style>
    </div>
  );
}

function StepCard({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 22, boxShadow: "var(--shadow-sm)", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--orange-dim)", color: "var(--orange)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 12 }}>{number}</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: 0, color: "var(--text)" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <label><span style={labelCss}>{title}</span>{children}</label>;
}

const bodyText: React.CSSProperties = {
  margin: "0 0 8px",
  color: "var(--text-3)",
  fontSize: 13,
  lineHeight: 1.55,
};

const secondaryButton: React.CSSProperties = {
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text-2)",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const linkButton: React.CSSProperties = {
  ...secondaryButton,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

function primaryButton(disabled: boolean): React.CSSProperties {
  return {
    border: "none",
    borderRadius: "var(--r-md)",
    background: disabled ? "var(--border)" : "var(--orange)",
    color: "#fff",
    padding: "11px 15px",
    fontSize: 13,
    fontWeight: 900,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: 14,
  };
}
