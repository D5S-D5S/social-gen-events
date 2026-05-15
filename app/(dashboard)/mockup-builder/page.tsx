"use client";

import { useEffect, useMemo, useState } from "react";
import ProFeatureGate from "@/components/ProFeatureGate";
import { supabase } from "@/lib/supabase";

type MockupResult = {
  imageUrl: string;
  promptSummary: string;
  usage?: {
    planName: string;
    aiTokensIncluded: number;
    aiTokensUsed: number;
    aiTokensRemaining: number;
  };
};

const eventTypes = [
  "Birthday",
  "Wedding",
  "Baby shower",
  "Gender reveal",
  "Christening",
  "Corporate",
  "Graduation",
  "Prom",
  "Private party",
  "Other",
];

const backdropTypes = [
  "Single sailboard",
  "Double sailboard",
  "Triple sailboard",
  "Shimmer wall",
  "Ripple wall",
  "Hoop",
  "Rectangle frame",
  "Open wall",
  "Custom backdrop",
  "No backdrop",
];

const styleLevels = ["Simple", "Standard", "Premium", "Luxury"];

export default function MockupBuilderPage() {
  return (
    <ProFeatureGate
      title="AI Mockup Generator"
      description="Create client-ready balloon mockups from an inspiration image, extra references, and a clear design prompt."
    >
      <MockupGenerator />
    </ProFeatureGate>
  );
}

function MockupGenerator() {
  const [eventType, setEventType] = useState("Baby shower");
  const [backdropType, setBackdropType] = useState("Double sailboard");
  const [styleLevel, setStyleLevel] = useState("Premium");
  const [colours, setColours] = useState("Light blue, white, gold");
  const [addOns, setAddOns] = useState("Cake stand, personalised sign");
  const [outputBackground, setOutputBackground] = useState("Clean white studio background");
  const [designPrompt, setDesignPrompt] = useState("");
  const [inspirationImage, setInspirationImage] = useState<File | null>(null);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<MockupResult | null>(null);

  useEffect(() => {
    if (!inspirationImage) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(inspirationImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [inspirationImage]);

  useEffect(() => {
    const urls = referenceImages.map((file) => URL.createObjectURL(file));
    setReferencePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [referenceImages]);

  const promptPreview = useMemo(() => {
    return [
      `${styleLevel} ${eventType.toLowerCase()} balloon mockup`,
      `${backdropType}`,
      colours ? `Colours: ${colours}` : "",
      addOns ? `Extras: ${addOns}` : "",
      referenceImages.length ? `${referenceImages.length} extra reference image${referenceImages.length === 1 ? "" : "s"}` : "",
      outputBackground,
    ].filter(Boolean).join(" | ");
  }, [addOns, backdropType, colours, eventType, outputBackground, referenceImages.length, styleLevel]);

  async function generateMockup() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      const body = new FormData();
      body.set("eventType", eventType);
      body.set("backdropType", backdropType);
      body.set("styleLevel", styleLevel);
      body.set("colours", colours);
      body.set("addOns", addOns);
      body.set("outputBackground", outputBackground);
      body.set("designNotes", designPrompt);
      if (inspirationImage) body.set("image", inspirationImage);
      referenceImages.forEach((file) => body.append("referenceImages", file));

      const res = await fetch("/api/ai/mockup-generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not generate mockup.");

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate mockup.");
    } finally {
      setLoading(false);
    }
  }

  async function copyPromptSummary() {
    const text = result?.promptSummary || promptPreview;
    await navigator.clipboard.writeText(text);
  }

  return (
    <div style={{ width: "100%", display: "grid", gap: 22 }}>
      <header style={headerRow}>
        <div>
          <p style={eyebrow}>Tools</p>
          <h1 style={pageTitle}>AI Mockup Generator</h1>
          <p style={pageSubtext}>
            Upload a main inspiration image, add extra references if needed, then tell the AI exactly what to change or keep.
          </p>
        </div>
        {result?.usage && (
          <div style={usagePill}>
            {result.usage.aiTokensRemaining} of {result.usage.aiTokensIncluded} AI tokens left
          </div>
        )}
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.95fr) minmax(430px, 1.05fr)", gap: 20, alignItems: "start" }} className="mockup-shell">
        <section style={section}>
          <div style={sectionHeader}>
            <Step number="1" />
            <div>
              <h2 style={sectionTitle}>Mockup Brief</h2>
              <p style={subtext}>The main image drives the layout. Extra references can be named in your prompt as Reference 1, Reference 2, and so on.</p>
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Main inspiration image">
              <label style={uploadBox}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setInspirationImage(e.target.files?.[0] ?? null)}
                  style={{ display: "none" }}
                />
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="Uploaded inspiration" style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: "var(--r-lg)" }} />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <strong style={{ color: "var(--text)", fontSize: 14 }}>Upload the main image to follow</strong>
                    <p style={{ margin: "6px 0 0", color: "var(--text-3)", fontSize: 13 }}>
                      This should be the strongest reference for the shape, layout, balloon density, and overall feel.
                    </p>
                  </div>
                )}
              </label>
            </Field>

            <Field label="Extra reference images">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setReferenceImages(Array.from(e.target.files ?? []))}
                style={inputCss}
              />
              {referencePreviews.length > 0 && (
                <div style={referenceGrid}>
                  {referencePreviews.map((url, index) => (
                    <div key={url} style={referenceThumb}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Reference ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <span style={referenceBadge}>Reference {index + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            <div style={twoCol} className="mockup-grid">
              <Field label="Event type">
                <select value={eventType} onChange={(e) => setEventType(e.target.value)} style={inputCss}>
                  {eventTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Backdrop">
                <select value={backdropType} onChange={(e) => setBackdropType(e.target.value)} style={inputCss}>
                  {backdropTypes.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
            </div>

            <div style={twoCol} className="mockup-grid">
              <Field label="Style level">
                <select value={styleLevel} onChange={(e) => setStyleLevel(e.target.value)} style={inputCss}>
                  {styleLevels.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Output">
                <select value={outputBackground} onChange={(e) => setOutputBackground(e.target.value)} style={inputCss}>
                  <option>Clean white studio background</option>
                  <option>White background with soft floor shadow</option>
                  <option>Minimal venue-style background</option>
                </select>
              </Field>
            </div>

            <Field label="Colours">
              <input value={colours} onChange={(e) => setColours(e.target.value)} placeholder="Light blue, white, gold" style={inputCss} />
            </Field>

            <Field label="Add-ons / visible extras">
              <input value={addOns} onChange={(e) => setAddOns(e.target.value)} placeholder="Cake stand, plinths, neon sign, florals" style={inputCss} />
            </Field>

            <Field label="Prompt">
              <textarea
                value={designPrompt}
                onChange={(e) => setDesignPrompt(e.target.value)}
                rows={6}
                placeholder="Example: Use the main image for the overall balloon shape. Make the balloons light blue and white. Use Reference 1 for the balloon density and Reference 2 for the cake stand style. Add more balloons on the left side."
                style={{ ...inputCss, resize: "vertical", lineHeight: 1.5 }}
              />
            </Field>

            <div style={promptCard}>
              <span style={labelCss}>Brief</span>
              <p style={{ margin: "7px 0 0", color: "var(--text-2)", fontSize: 13, lineHeight: 1.6 }}>{promptPreview}</p>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={generateMockup} disabled={loading} style={primaryButton}>
                {loading ? "Generating mockup..." : "Generate Mockup"}
              </button>
              <button type="button" onClick={copyPromptSummary} style={secondaryButton}>
                Copy brief
              </button>
            </div>
          </div>
        </section>

        <aside style={stickyPanel}>
          <div style={sectionHeader}>
            <Step number="2" />
            <div>
              <h2 style={sectionTitle}>Generated Mockup</h2>
              <p style={subtext}>Use this as a client-facing visual guide, then refine the prompt and generate again if needed.</p>
            </div>
          </div>

          <div style={resultFrame}>
            {loading ? (
              <div style={emptyState}>
                <strong>Building your mockup...</strong>
                <span>Using your uploaded images and prompt.</span>
              </div>
            ) : result?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result.imageUrl} alt="Generated balloon mockup" style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fff" }} />
            ) : (
              <div style={emptyState}>
                <strong>No mockup generated yet</strong>
                <span>Upload a main image, write the prompt, and click Generate Mockup.</span>
              </div>
            )}
          </div>

          {result && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={result.imageUrl} target="_blank" style={primaryLink}>Open image</a>
              <a href={result.imageUrl} download style={secondaryLink}>Download image</a>
            </div>
          )}
        </aside>
      </div>

      <style jsx>{`
        @media (max-width: 1180px) {
          .mockup-shell {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 760px) {
          .mockup-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <span style={labelCss}>{label}</span>
      {children}
    </label>
  );
}

function Step({ number }: { number: string }) {
  return (
    <span style={{
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "var(--orange-dim)",
      color: "var(--orange)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: 900,
      flex: "0 0 auto",
    }}>
      {number}
    </span>
  );
}

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 18,
  alignItems: "flex-start",
};
const eyebrow: React.CSSProperties = {
  margin: "0 0 8px",
  color: "var(--orange)",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};
const pageTitle: React.CSSProperties = {
  margin: 0,
  color: "var(--text)",
  fontFamily: "var(--font-display)",
  fontSize: 34,
  fontWeight: 900,
};
const pageSubtext: React.CSSProperties = {
  margin: "8px 0 0",
  maxWidth: 760,
  color: "var(--text-3)",
  fontSize: 15,
  lineHeight: 1.6,
};
const section: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-xl)",
  padding: 26,
  boxShadow: "var(--shadow-sm)",
};
const stickyPanel: React.CSSProperties = {
  ...section,
  position: "sticky",
  top: 24,
  display: "grid",
  gap: 18,
};
const sectionHeader: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  marginBottom: 18,
};
const sectionTitle: React.CSSProperties = {
  margin: 0,
  color: "var(--text)",
  fontFamily: "var(--font-display)",
  fontSize: 22,
  fontWeight: 900,
};
const subtext: React.CSSProperties = {
  margin: "5px 0 0",
  color: "var(--text-3)",
  fontSize: 13,
  lineHeight: 1.6,
};
const labelCss: React.CSSProperties = {
  color: "var(--text-3)",
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};
const inputCss: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text)",
  padding: "12px 14px",
  fontSize: 14,
  outline: "none",
  fontFamily: "var(--font-ui)",
};
const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};
const uploadBox: React.CSSProperties = {
  minHeight: 220,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1.5px dashed var(--border)",
  borderRadius: "var(--r-xl)",
  background: "var(--surface-2)",
  padding: 12,
  cursor: "pointer",
};
const referenceGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 8,
};
const referenceThumb: React.CSSProperties = {
  position: "relative",
  aspectRatio: "1 / 1",
  borderRadius: "var(--r-md)",
  overflow: "hidden",
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
};
const referenceBadge: React.CSSProperties = {
  position: "absolute",
  left: 6,
  bottom: 6,
  borderRadius: 99,
  background: "rgba(0,0,0,0.72)",
  color: "#fff",
  padding: "3px 7px",
  fontSize: 10,
  fontWeight: 900,
};
const promptCard: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--r-lg)",
  background: "var(--surface-2)",
  padding: 13,
};
const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: "var(--r-md)",
  background: "var(--orange)",
  color: "#fff",
  padding: "13px 18px",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
};
const secondaryButton: React.CSSProperties = {
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text-2)",
  padding: "12px 16px",
  fontSize: 14,
  fontWeight: 900,
  cursor: "pointer",
};
const primaryLink: React.CSSProperties = {
  ...primaryButton,
  display: "inline-flex",
  textDecoration: "none",
};
const secondaryLink: React.CSSProperties = {
  ...secondaryButton,
  display: "inline-flex",
  textDecoration: "none",
};
const resultFrame: React.CSSProperties = {
  minHeight: 560,
  border: "1px solid var(--border)",
  borderRadius: "var(--r-xl)",
  background: "#fff",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const emptyState: React.CSSProperties = {
  display: "grid",
  gap: 6,
  textAlign: "center",
  color: "var(--text-3)",
  fontSize: 13,
  padding: 26,
};
const usagePill: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 999,
  background: "var(--surface)",
  padding: "9px 12px",
  color: "var(--text-2)",
  fontSize: 12,
  fontWeight: 900,
  whiteSpace: "nowrap",
};
const errorStyle: React.CSSProperties = {
  background: "#FEF2F2",
  border: "1px solid #FECACA",
  color: "#DC2626",
  borderRadius: "var(--r-lg)",
  padding: "12px 14px",
  fontSize: 13,
  fontWeight: 800,
};
