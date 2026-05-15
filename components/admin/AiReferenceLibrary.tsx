"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AiReference = {
  id: string;
  title: string;
  source_platform: string;
  source_url: string | null;
  creator_handle: string | null;
  image_url: string | null;
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
  created_at: string;
};

const emptyForm = {
  title: "",
  source_platform: "instagram",
  source_url: "",
  creator_handle: "",
  image_url: "",
  setup_type: "",
  event_type: "",
  style_level: "",
  coverage: "",
  tags: "",
  colours: "",
  notes: "",
  use_for_estimator: true,
  use_for_mockup: true,
  status: "approved",
  auto_tag: true,
};

export default function AiReferenceLibrary() {
  const [references, setReferences] = useState<AiReference[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkUrls, setBulkUrls] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadReferences().catch(() => setLoading(false));
  }, []);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function loadReferences() {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/ai-references", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load AI references.");
    } else {
      setReferences(data.references ?? []);
      setError("");
    }
    setLoading(false);
  }

  async function saveReference(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setToast("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Missing session.");

      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => body.set(key, String(value)));
      if (file) body.set("image", file);

      const res = await fetch("/api/admin/ai-references", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save AI reference.");

      setReferences((prev) => [data.reference, ...prev]);
      setForm(emptyForm);
      setFile(null);
      setToast("Reference added to the AI library.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save AI reference.");
    } finally {
      setSaving(false);
    }
  }

  function isDirectImageUrl(url: string) {
    return /\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(url.trim());
  }

  function guessPlatform(url: string) {
    const value = url.toLowerCase();
    if (value.includes("instagram.com")) return "instagram";
    if (value.includes("pinterest.")) return "pinterest";
    if (value.includes("tiktok.com")) return "tiktok";
    return isDirectImageUrl(url) ? "image-url" : "website";
  }

  async function postReference(token: string, body: FormData) {
    const res = await fetch("/api/admin/ai-references", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Could not save AI reference.");
    return data.reference as AiReference;
  }

  async function saveBulkReferences() {
    setBulkSaving(true);
    setError("");
    setToast("");
    setBulkProgress("");

    try {
      const token = await getToken();
      if (!token) throw new Error("Missing session.");

      const urls = bulkUrls
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      const total = bulkFiles.length + urls.length;
      if (!total) throw new Error("Add at least one image or URL first.");

      const created: AiReference[] = [];
      let done = 0;

      for (const imageFile of bulkFiles) {
        const body = new FormData();
        body.set("title", imageFile.name.replace(/\.[^.]+$/, ""));
        body.set("source_platform", "upload");
        body.set("notes", "Bulk uploaded admin reference.");
        body.set("auto_tag", "true");
        body.set("use_for_estimator", "true");
        body.set("use_for_mockup", "true");
        body.set("status", "approved");
        body.set("image", imageFile);
        created.push(await postReference(token, body));
        done += 1;
        setBulkProgress(`Imported ${done} of ${total} references...`);
      }

      for (const url of urls) {
        const body = new FormData();
        body.set("title", "URL reference");
        body.set("source_platform", guessPlatform(url));
        body.set("source_url", url);
        if (isDirectImageUrl(url)) body.set("image_url", url);
        body.set("notes", isDirectImageUrl(url)
          ? "Bulk imported direct image URL."
          : "Bulk imported source URL for attribution. Upload a screenshot or direct image URL if this should be visual AI context.");
        body.set("auto_tag", "true");
        body.set("use_for_estimator", "true");
        body.set("use_for_mockup", "true");
        body.set("status", "approved");
        created.push(await postReference(token, body));
        done += 1;
        setBulkProgress(`Imported ${done} of ${total} references...`);
      }

      setReferences((prev) => [...created, ...prev]);
      setBulkFiles([]);
      setBulkUrls("");
      setBulkProgress("");
      setToast(`Imported ${created.length} AI references.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import AI references.");
    } finally {
      setBulkSaving(false);
    }
  }

  async function updateReference(id: string, updates: Partial<AiReference>) {
    const token = await getToken();
    if (!token) return;
    setReferences((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
    const res = await fetch("/api/admin/ai-references", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, ...updates }),
    });
    if (!res.ok) loadReferences().catch(() => {});
  }

  async function deleteReference(id: string) {
    const token = await getToken();
    if (!token) return;
    setReferences((prev) => prev.filter((item) => item.id !== id));
    const res = await fetch(`/api/admin/ai-references?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) loadReferences().catch(() => {});
  }

  const approvedCount = references.filter((item) => item.status === "approved").length;
  const estimatorCount = references.filter((item) => item.status === "approved" && item.use_for_estimator).length;
  const mockupCount = references.filter((item) => item.status === "approved" && item.use_for_mockup).length;

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {toast && <div style={noticeStyle}>{toast}</div>}
      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }} className="ai-ref-stats">
        <Stat label="Approved references" value={String(approvedCount)} />
        <Stat label="Estimator context" value={String(estimatorCount)} />
        <Stat label="Mockup context" value={String(mockupCount)} />
      </div>

      <section style={section}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Bulk Add AI References</h2>
          <p style={subtext}>
            Upload many images at once, or paste one URL per line. Direct image URLs become visual AI context immediately; Instagram/Pinterest links are stored with attribution and should be paired with uploaded screenshots when you want visual context.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }} className="ai-ref-grid">
          <Field label="Bulk image upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setBulkFiles(Array.from(e.target.files ?? []))}
              style={inputCss}
            />
            {bulkFiles.length > 0 && (
              <span style={{ color: "var(--text-3)", fontSize: 12, fontWeight: 800 }}>
                {bulkFiles.length} image{bulkFiles.length === 1 ? "" : "s"} ready
              </span>
            )}
          </Field>
          <Field label="Bulk URLs">
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              placeholder={"Paste one URL per line\nhttps://example.com/reference.jpg\nhttps://www.instagram.com/p/..."}
              rows={5}
              style={{ ...inputCss, resize: "vertical", lineHeight: 1.5 }}
            />
          </Field>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
          <button type="button" onClick={saveBulkReferences} disabled={bulkSaving} style={{ ...primaryButton, marginLeft: 0 }}>
            {bulkSaving ? "Importing..." : "Import Bulk References"}
          </button>
          {bulkProgress && <span style={{ color: "var(--text-3)", fontSize: 13, fontWeight: 800 }}>{bulkProgress}</span>}
        </div>
      </section>

      <section style={section}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={sectionTitle}>Add AI Reference</h2>
          <p style={subtext}>
            Upload your own image or paste a direct image URL/source link. Uploaded images can be used as private AI context for the estimator and mockup tools.
          </p>
        </div>

        <form onSubmit={saveReference} style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ai-ref-grid">
            <Field label="Title">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Blush double sailboard with top garland" style={inputCss} />
            </Field>
            <Field label="Creator / handle">
              <input value={form.creator_handle} onChange={(e) => setForm({ ...form, creator_handle: e.target.value })} placeholder="@creator or your studio" style={inputCss} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ai-ref-grid">
            <Field label="Upload image">
              <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={inputCss} />
            </Field>
            <Field label="Direct image URL">
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://...jpg, png, webp" style={inputCss} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 12 }} className="ai-ref-grid">
            <Field label="Source platform">
              <select value={form.source_platform} onChange={(e) => setForm({ ...form, source_platform: e.target.value })} style={inputCss}>
                <option value="upload">Upload</option>
                <option value="instagram">Instagram</option>
                <option value="pinterest">Pinterest</option>
                <option value="tiktok">TikTok</option>
                <option value="website">Website</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Source / attribution URL">
              <input value={form.source_url} onChange={(e) => setForm({ ...form, source_url: e.target.value })} placeholder="Instagram/Pinterest/source link for attribution" style={inputCss} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 12 }} className="ai-ref-grid">
            <Field label="Setup type">
              <input value={form.setup_type} onChange={(e) => setForm({ ...form, setup_type: e.target.value })} placeholder="Double sailboard" style={inputCss} />
            </Field>
            <Field label="Event type">
              <input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} placeholder="Baby shower" style={inputCss} />
            </Field>
            <Field label="Style level">
              <input value={form.style_level} onChange={(e) => setForm({ ...form, style_level: e.target.value })} placeholder="Premium" style={inputCss} />
            </Field>
            <Field label="Coverage">
              <input value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} placeholder="Top and one side" style={inputCss} />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ai-ref-grid">
            <Field label="Tags">
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="sailboard, organic garland, cake stand" style={inputCss} />
            </Field>
            <Field label="Colours">
              <input value={form.colours} onChange={(e) => setForm({ ...form, colours: e.target.value })} placeholder="pink, white, gold" style={inputCss} />
            </Field>
          </div>

          <Field label="Notes">
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="What should the AI learn from this image?" rows={3} style={{ ...inputCss, resize: "vertical" }} />
          </Field>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <Check label="Auto-tag with Gemini" checked={form.auto_tag} onChange={(value) => setForm({ ...form, auto_tag: value })} />
            <Check label="Use for Estimator" checked={form.use_for_estimator} onChange={(value) => setForm({ ...form, use_for_estimator: value })} />
            <Check label="Use for Mockup" checked={form.use_for_mockup} onChange={(value) => setForm({ ...form, use_for_mockup: value })} />
            <button type="submit" disabled={saving} style={primaryButton}>
              {saving ? "Saving..." : "Add to AI Library"}
            </button>
          </div>
        </form>
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>AI Reference Library</h2>
        {loading ? (
          <p style={subtext}>Loading references...</p>
        ) : references.length === 0 ? (
          <p style={subtext}>No references yet. Add your first image above.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }} className="ai-ref-cards">
            {references.map((item) => (
              <article key={item.id} style={cardStyle}>
                <div style={{ aspectRatio: "4 / 3", background: "var(--surface-2)", borderRadius: "var(--r-lg)", overflow: "hidden", border: "1px solid var(--border)", marginBottom: 12 }}>
                  {item.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image_url} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-3)", fontSize: 12 }}>URL reference</div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "var(--text)", fontSize: 14, fontWeight: 900 }}>{item.title || "Untitled reference"}</h3>
                    <p style={{ margin: "4px 0 0", color: "var(--text-3)", fontSize: 12 }}>{item.setup_type || "Setup not tagged"} {item.event_type ? `- ${item.event_type}` : ""}</p>
                  </div>
                  <select value={item.status} onChange={(e) => updateReference(item.id, { status: e.target.value as AiReference["status"] })} style={{ ...inputCss, width: 110, padding: "6px 8px", fontSize: 11 }}>
                    <option value="approved">Approved</option>
                    <option value="draft">Draft</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {(item.tags ?? []).slice(0, 5).map((tag) => <span key={tag} style={chip}>{tag}</span>)}
                </div>
                <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
                  <Check label="Estimator" checked={item.use_for_estimator} onChange={(value) => updateReference(item.id, { use_for_estimator: value })} />
                  <Check label="Mockup" checked={item.use_for_mockup} onChange={(value) => updateReference(item.id, { use_for_mockup: value })} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                  {item.source_url ? <a href={item.source_url} target="_blank" style={linkStyle}>Source</a> : <span />}
                  <button type="button" onClick={() => deleteReference(item.id)} style={dangerButton}>Remove</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <style jsx>{`
        @media (max-width: 1100px) {
          .ai-ref-cards {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 760px) {
          .ai-ref-grid,
          .ai-ref-stats,
          .ai-ref-cards {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 16, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 900, color: "var(--text)" }}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={labelCss}>{label}</span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--text-2)", fontSize: 12, fontWeight: 800 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: "var(--orange)" }} />
      {label}
    </label>
  );
}

const section: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 20, boxShadow: "var(--shadow-sm)" };
const sectionTitle: React.CSSProperties = { margin: 0, color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 900 };
const subtext: React.CSSProperties = { margin: "6px 0 0", color: "var(--text-3)", fontSize: 13, lineHeight: 1.6 };
const labelCss: React.CSSProperties = { color: "var(--text-3)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em" };
const inputCss: React.CSSProperties = { width: "100%", boxSizing: "border-box", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", color: "var(--text)", padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "var(--font-ui)" };
const primaryButton: React.CSSProperties = { marginLeft: "auto", border: "none", borderRadius: "var(--r-md)", background: "var(--orange)", color: "#fff", padding: "11px 16px", fontSize: 13, fontWeight: 900, cursor: "pointer" };
const dangerButton: React.CSSProperties = { border: "1px solid #FECACA", borderRadius: "var(--r-md)", background: "#FEF2F2", color: "#DC2626", padding: "7px 10px", fontSize: 12, fontWeight: 900, cursor: "pointer" };
const cardStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "var(--r-xl)", background: "var(--surface-2)", padding: 12 };
const chip: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 99, background: "var(--surface)", color: "var(--text-2)", padding: "3px 7px", fontSize: 10, fontWeight: 800 };
const linkStyle: React.CSSProperties = { color: "var(--orange)", fontSize: 12, fontWeight: 900, textDecoration: "none" };
const noticeStyle: React.CSSProperties = { background: "#ECFDF3", border: "1px solid #A9EFC5", color: "#067647", borderRadius: "var(--r-lg)", padding: "10px 12px", fontSize: 13, fontWeight: 800 };
const errorStyle: React.CSSProperties = { background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626", borderRadius: "var(--r-lg)", padding: "10px 12px", fontSize: 13, fontWeight: 800 };
