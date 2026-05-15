"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type TemplateKey = "studio" | "fiesta" | "luxe";

interface StorefrontPackage {
  id: string;
  title: string;
  description: string;
  starting_price: number | null;
  fixed_price: number | null;
  tags: string[];
  occasion: string;
  image_url: string | null;
  visible: boolean;
  sort_order: number;
}

interface StorefrontData {
  id: string;
  slug: string;
  business_name: string;
  tagline: string;
  bio: string | null;
  logo_url: string | null;
  hero_url: string | null;
  brand_primary: string;
  brand_accent: string;
  enquiry_mode: "enquire" | "book";
  show_prices: boolean;
  published: boolean;
  template: TemplateKey;
  gallery_urls: string[];
  contact_email: string | null;
  contact_phone: string | null;
  instagram_handle: string | null;
}

/* ─── Template definitions ─────────────────────────────────────────────────── */

const TEMPLATES: {
  key: TemplateKey;
  name: string;
  vibe: string;
  desc: string;
  preview: React.ReactNode;
}[] = [
  {
    key: "studio",
    name: "Studio",
    vibe: "Clean & Professional",
    desc: "White minimal layout. Photo-forward hero. Ideal for weddings, corporate, and upscale events.",
    preview: (
      <svg viewBox="0 0 240 140" fill="none" style={{ width: "100%", display: "block" }}>
        <rect width="240" height="140" fill="#FAFAF8" />
        <rect x="0" y="0" width="240" height="58" fill="#F0ECE7" />
        <rect x="20" y="18" width="80" height="8" rx="2" fill="#D0C8C0" />
        <rect x="20" y="30" width="50" height="5" rx="2" fill="#E0D8D0" />
        <rect x="20" y="70" width="60" height="7" rx="2" fill="#1A1A1A" />
        <rect x="20" y="82" width="120" height="4" rx="1" fill="#D0C8C0" />
        <rect x="20" y="90" width="100" height="4" rx="1" fill="#D0C8C0" />
        <rect x="20" y="105" width="32" height="12" rx="3" fill="#F05000" />
        <rect x="58" y="105" width="32" height="12" rx="3" fill="#F2EDE8" />
        <rect x="96" y="105" width="32" height="12" rx="3" fill="#F2EDE8" />
        <rect x="138" y="70" width="82" height="52" rx="4" fill="#E8E4DF" />
        <rect x="145" y="77" width="68" height="38" rx="2" fill="#D8D0C8" />
      </svg>
    ),
  },
  {
    key: "fiesta",
    name: "Fiesta",
    vibe: "Bold & Festive",
    desc: "Warm cream canvas, punchy accents. Perfect for birthdays, baby showers, and fun celebrations.",
    preview: (
      <svg viewBox="0 0 240 140" fill="none" style={{ width: "100%", display: "block" }}>
        <rect width="240" height="140" fill="#FFF8F0" />
        <rect x="0" y="0" width="240" height="68" fill="#FF6B35" />
        <rect x="60" y="16" width="120" height="10" rx="3" fill="rgba(255,255,255,0.9)" />
        <rect x="80" y="30" width="80" height="5" rx="2" fill="rgba(255,255,255,0.7)" />
        <rect x="95" y="44" width="50" height="13" rx="6" fill="white" />
        <rect x="14" y="80" width="60" height="42" rx="5" fill="#FFE4D0" />
        <rect x="82" y="80" width="60" height="42" rx="5" fill="#FFE4D0" />
        <rect x="150" y="80" width="60" height="42" rx="5" fill="#FFE4D0" />
        <rect x="20" y="88" width="48" height="5" rx="1" fill="#E8430C" />
        <rect x="88" y="88" width="48" height="5" rx="1" fill="#E8430C" />
        <rect x="156" y="88" width="48" height="5" rx="1" fill="#E8430C" />
      </svg>
    ),
  },
  {
    key: "luxe",
    name: "Luxe",
    vibe: "Premium & Elegant",
    desc: "Dark charcoal with gold accents. For premium installs, galas, weddings, and VIP events.",
    preview: (
      <svg viewBox="0 0 240 140" fill="none" style={{ width: "100%", display: "block" }}>
        <rect width="240" height="140" fill="#1A1914" />
        <rect x="0" y="0" width="240" height="70" fill="#141410" />
        <rect x="60" y="15" width="120" height="12" rx="2" fill="#C9A84C" opacity="0.9" />
        <rect x="80" y="31" width="80" height="4" rx="1" fill="#8A8070" />
        <rect x="95" y="44" width="50" height="12" rx="2" fill="#C9A84C" />
        <rect x="14" y="82" width="64" height="40" rx="3" fill="#28261E" />
        <rect x="18" y="86" width="56" height="22" rx="2" fill="#3A3830" />
        <rect x="18" y="112" width="40" height="4" rx="1" fill="#C9A84C" />
        <rect x="86" y="82" width="64" height="40" rx="3" fill="#28261E" />
        <rect x="90" y="86" width="56" height="22" rx="2" fill="#3A3830" />
        <rect x="90" y="112" width="40" height="4" rx="1" fill="#C9A84C" />
        <rect x="158" y="82" width="64" height="40" rx="3" fill="#28261E" />
        <rect x="162" y="86" width="56" height="22" rx="2" fill="#3A3830" />
        <rect x="162" y="112" width="40" height="4" rx="1" fill="#C9A84C" />
      </svg>
    ),
  },
];

const OCCASIONS = [
  "Wedding", "Birthday", "Baby Shower", "Corporate",
  "Grand Opening", "Quinceañera", "Sweet 16", "Anniversary", "Other",
];

/* ─── Style helpers ───────────────────────────────────────────────────────── */

const lbl: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.06em", color: "#9A8070", marginBottom: 6, display: "block",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "10px 14px", border: "1px solid #EDE8E3",
  borderRadius: 10, fontSize: 14, color: "#1A1208", background: "#fff",
  outline: "none", boxSizing: "border-box",
};
const crd: React.CSSProperties = {
  background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16,
  padding: "20px 22px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 16,
};
const crdHead: React.CSSProperties = {
  fontSize: 15, fontWeight: 800, color: "#1A1208", marginBottom: 14,
};

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function StorefrontPage() {
  const [token, setToken]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"template" | "content" | "packages" | "publish">("template");

  const [sf, setSf] = useState<Partial<StorefrontData>>({
    template: "studio", business_name: "", tagline: "", bio: "",
    slug: "", hero_url: "", logo_url: "",
    brand_primary: "#F05000", brand_accent: "#1A1A1A",
    enquiry_mode: "enquire", show_prices: true, published: false,
    gallery_urls: [], contact_email: "", contact_phone: "", instagram_handle: "",
  });

  const [packages, setPackages]   = useState<StorefrontPackage[]>([]);
  const [pkgSaving, setPkgSaving] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Partial<StorefrontPackage> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setToken(session.access_token);
      fetch("/api/storefront/settings", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.storefront) setSf((prev) => ({ ...prev, ...d.storefront }));
          if (d.packages)   setPackages(d.packages);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  async function save(extra?: Partial<StorefrontData>) {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/storefront/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...sf, ...extra }),
      });
      const d = await res.json();
      if (d.storefront) setSf((prev) => ({ ...prev, ...d.storefront }));
      showToast("Saved");
    } catch {
      showToast("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function savePkg(pkg: Partial<StorefrontPackage>) {
    if (!token) return;
    setPkgSaving(true);
    try {
      const method = pkg.id ? "PUT" : "POST";
      const res = await fetch("/api/storefront/packages", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(pkg),
      });
      const d = await res.json();
      if (d.package) {
        if (pkg.id) {
          setPackages((prev) => prev.map((p) => (p.id === d.package.id ? d.package : p)));
        } else {
          setPackages((prev) => [...prev, d.package]);
        }
      }
      setEditingPkg(null);
      showToast(pkg.id ? "Package updated" : "Package added");
    } catch {
      showToast("Failed to save package");
    } finally {
      setPkgSaving(false);
    }
  }

  async function deletePkg(id: string) {
    if (!token) return;
    await fetch(`/api/storefront/packages?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setPackages((prev) => prev.filter((p) => p.id !== id));
    showToast("Package removed");
  }

  const liveUrl = sf.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/store/${sf.slug}`
    : null;

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ color: "#9A8070", fontSize: 14, fontWeight: 600 }}>Loading your storefront...</div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1A1208", margin: "0 0 4px" }}>Your Storefront</h1>
        <p style={{ margin: 0, fontSize: 14, color: "#9A8070" }}>
          A shareable landing page you send to customers — no website needed.
          {liveUrl && sf.published && (
            <> &nbsp;
              <a href={liveUrl} target="_blank" rel="noreferrer" style={{ color: "#F05A00", fontWeight: 600 }}>
                View live
              </a>
            </>
          )}
        </p>
      </div>

      {/* Tab bar */}
      <div style={{ display: "flex", borderBottom: "2px solid #EDE8E3", marginBottom: 24 }}>
        {(["template", "content", "packages", "publish"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: "10px 18px", background: "none", border: "none",
              borderBottom: activeTab === t ? "2px solid #F05A00" : "2px solid transparent",
              marginBottom: -2,
              fontSize: 14, fontWeight: activeTab === t ? 700 : 500,
              color: activeTab === t ? "#1A1208" : "#9A8070",
              cursor: "pointer", transition: "all 0.15s",
              textTransform: "capitalize",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ── TEMPLATE TAB ────────────────────────────────────────────────────── */}
      {activeTab === "template" && (
        <div>
          <p style={{ fontSize: 14, color: "#6A5A4A", margin: "0 0 20px" }}>
            Choose the layout that matches your brand. You can switch anytime — your content stays.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            {TEMPLATES.map((tmpl) => {
              const active = sf.template === tmpl.key;
              return (
                <button
                  key={tmpl.key}
                  onClick={() => setSf((p) => ({ ...p, template: tmpl.key }))}
                  style={{
                    background: active ? "#FFF7F3" : "#fff",
                    border: active ? "2px solid #F05A00" : "2px solid #EDE8E3",
                    borderRadius: 14, padding: 0, cursor: "pointer", textAlign: "left",
                    overflow: "hidden", transition: "all 0.15s",
                    boxShadow: active ? "0 0 0 3px rgba(240,90,0,0.1)" : "none",
                  }}
                >
                  <div style={{ borderRadius: "12px 12px 0 0", overflow: "hidden" }}>{tmpl.preview}</div>
                  <div style={{ padding: "12px 14px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1208" }}>{tmpl.name}</span>
                      {active && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: "#F05A00", color: "#fff", borderRadius: 20, padding: "2px 7px" }}>ACTIVE</span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#9A8070", marginBottom: 3 }}>{tmpl.vibe}</div>
                    <div style={{ fontSize: 11, color: "#B0A098", lineHeight: 1.5 }}>{tmpl.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Brand colours */}
          <div style={crd}>
            <div style={crdHead}>Brand Colours</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={lbl}>Primary Colour</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={sf.brand_primary ?? "#F05000"} onChange={(e) => setSf((p) => ({ ...p, brand_primary: e.target.value }))} style={{ width: 44, height: 38, border: "1px solid #EDE8E3", borderRadius: 8, cursor: "pointer", padding: 2 }} />
                  <input type="text" value={sf.brand_primary ?? ""} onChange={(e) => setSf((p) => ({ ...p, brand_primary: e.target.value }))} style={{ ...inp, flex: 1 }} placeholder="#F05000" />
                </div>
              </div>
              <div>
                <label style={lbl}>Accent Colour</label>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input type="color" value={sf.brand_accent ?? "#1A1A1A"} onChange={(e) => setSf((p) => ({ ...p, brand_accent: e.target.value }))} style={{ width: 44, height: 38, border: "1px solid #EDE8E3", borderRadius: 8, cursor: "pointer", padding: 2 }} />
                  <input type="text" value={sf.brand_accent ?? ""} onChange={(e) => setSf((p) => ({ ...p, brand_accent: e.target.value }))} style={{ ...inp, flex: 1 }} placeholder="#1A1A1A" />
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => { save(); setActiveTab("content"); }} disabled={saving} style={{ padding: "11px 28px", background: saving ? "#EDE8E3" : "#F05A00", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save & Continue"}
          </button>
        </div>
      )}

      {/* ── CONTENT TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "content" && (
        <div>
          <div style={crd}>
            <div style={crdHead}>Business Identity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Business Name</label>
                  <input type="text" value={sf.business_name ?? ""} onChange={(e) => setSf((p) => ({ ...p, business_name: e.target.value }))} placeholder="Bloom Balloon Studio" style={inp} />
                </div>
                <div>
                  <label style={lbl}>URL Slug</label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#9A8070" }}>/store/</span>
                    <input type="text" value={sf.slug ?? ""} onChange={(e) => setSf((p) => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))} placeholder="bloom-balloons" style={{ ...inp, paddingLeft: 65 }} />
                  </div>
                </div>
              </div>
              <div>
                <label style={lbl}>Tagline</label>
                <input type="text" value={sf.tagline ?? ""} onChange={(e) => setSf((p) => ({ ...p, tagline: e.target.value }))} placeholder="Making your moments magical — one balloon at a time" style={inp} />
              </div>
              <div>
                <label style={lbl}>About</label>
                <textarea value={sf.bio ?? ""} onChange={(e) => setSf((p) => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Tell customers who you are, where you cover, and what makes your work special..." style={{ ...inp, resize: "vertical" }} />
              </div>
            </div>
          </div>

          <div style={crd}>
            <div style={crdHead}>Hero Image & Logo</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={lbl}>Hero Image URL</label>
                <input type="url" value={sf.hero_url ?? ""} onChange={(e) => setSf((p) => ({ ...p, hero_url: e.target.value }))} placeholder="https://... paste a direct image link (Imgur, Cloudinary, Google Drive)" style={inp} />
                {sf.hero_url && <img src={sf.hero_url} alt="Hero" style={{ marginTop: 10, width: "100%", height: 180, objectFit: "cover", borderRadius: 10, border: "1px solid #EDE8E3" }} onError={(e) => (e.currentTarget.style.display = "none")} />}
              </div>
              <div>
                <label style={lbl}>Logo URL (optional — leave blank to show business name)</label>
                <input type="url" value={sf.logo_url ?? ""} onChange={(e) => setSf((p) => ({ ...p, logo_url: e.target.value }))} placeholder="https://..." style={inp} />
              </div>
            </div>
          </div>

          <div style={crd}>
            <div style={crdHead}>Gallery</div>
            <p style={{ fontSize: 13, color: "#9A8070", margin: "0 0 12px", lineHeight: 1.5 }}>Add up to 9 photos from past events — one URL per line.</p>
            <textarea
              value={(sf.gallery_urls ?? []).join("\n")}
              onChange={(e) => setSf((p) => ({ ...p, gallery_urls: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 9) }))}
              rows={5}
              placeholder={"https://...\nhttps://...\nhttps://..."}
              style={{ ...inp, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
            />
            {(sf.gallery_urls ?? []).length > 0 && (
              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {(sf.gallery_urls ?? []).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: "1px solid #EDE8E3" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                ))}
              </div>
            )}
          </div>

          <div style={crd}>
            <div style={crdHead}>Contact & Social</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={lbl}>Contact Email</label>
                <input type="email" value={sf.contact_email ?? ""} onChange={(e) => setSf((p) => ({ ...p, contact_email: e.target.value }))} placeholder="hello@bloomballoons.com" style={inp} />
              </div>
              <div>
                <label style={lbl}>Contact Phone</label>
                <input type="tel" value={sf.contact_phone ?? ""} onChange={(e) => setSf((p) => ({ ...p, contact_phone: e.target.value }))} placeholder="+44 7700 900 123" style={inp} />
              </div>
              <div>
                <label style={lbl}>Instagram Handle</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "#9A8070" }}>@</span>
                  <input type="text" value={sf.instagram_handle ?? ""} onChange={(e) => setSf((p) => ({ ...p, instagram_handle: e.target.value.replace(/^@/, "") }))} placeholder="bloomballoonstudio" style={{ ...inp, paddingLeft: 32 }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Enquiry Mode</label>
                <select value={sf.enquiry_mode ?? "enquire"} onChange={(e) => setSf((p) => ({ ...p, enquiry_mode: e.target.value as "enquire" | "book" }))} style={{ ...inp, cursor: "pointer" }}>
                  <option value="enquire">Enquire (contact form)</option>
                  <option value="book">Book (direct booking)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => save()} disabled={saving} style={{ padding: "11px 28px", background: saving ? "#EDE8E3" : "#F05A00", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
              {saving ? "Saving..." : "Save Content"}
            </button>
            <button onClick={() => setActiveTab("packages")} style={{ padding: "11px 28px", background: "#fff", color: "#1A1208", border: "1px solid #EDE8E3", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Next: Packages
            </button>
          </div>
        </div>
      )}

      {/* ── PACKAGES TAB ────────────────────────────────────────────────────── */}
      {activeTab === "packages" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#6A5A4A" }}>
              Packages appear on your storefront. Customers can enquire about any of them.
            </p>
            <button
              onClick={() => setEditingPkg({ title: "", description: "", starting_price: null, fixed_price: null, tags: [], occasion: "Other", image_url: null, visible: true, sort_order: packages.length })}
              style={{ padding: "9px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              + Add Package
            </button>
          </div>

          {packages.length === 0 && !editingPkg && (
            <div style={{ ...crd, textAlign: "center", padding: "40px 20px" }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ display: "block", margin: "0 auto 12px" }}>
                <circle cx="24" cy="18" r="12" fill="#F0ECE8" stroke="#D8D0C8" strokeWidth="1.5" />
                <path d="M24 30v10M20 38h8" stroke="#D8D0C8" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="15" cy="34" r="7" fill="#F0ECE8" stroke="#D8D0C8" strokeWidth="1.5" />
                <circle cx="33" cy="34" r="7" fill="#F0ECE8" stroke="#D8D0C8" strokeWidth="1.5" />
              </svg>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1208", marginBottom: 6 }}>No packages yet</div>
              <div style={{ fontSize: 13, color: "#9A8070", marginBottom: 16, lineHeight: 1.5 }}>
                Add the packages you offer. They will appear on your storefront with pricing.
              </div>
              <button onClick={() => setEditingPkg({ title: "", description: "", starting_price: null, fixed_price: null, tags: [], occasion: "Other", image_url: null, visible: true, sort_order: 0 })} style={{ padding: "9px 20px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                Add Your First Package
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {packages.map((pkg) => (
              <div key={pkg.id} style={{ ...crd, marginBottom: 0, display: "flex", gap: 14, alignItems: "flex-start" }}>
                {pkg.image_url && (
                  <img src={pkg.image_url} alt="" style={{ width: 68, height: 68, objectFit: "cover", borderRadius: 8, flexShrink: 0, border: "1px solid #EDE8E3" }} onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1208" }}>{pkg.title}</div>
                  {pkg.description && <div style={{ fontSize: 12, color: "#9A8070", marginTop: 2 }}>{pkg.description}</div>}
                  <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {pkg.fixed_price != null && <span style={{ fontSize: 13, fontWeight: 700, color: "#F05A00" }}>£{Number(pkg.fixed_price).toFixed(2)}</span>}
                    {pkg.starting_price != null && pkg.fixed_price == null && <span style={{ fontSize: 13, fontWeight: 700, color: "#F05A00" }}>from £{Number(pkg.starting_price).toFixed(2)}</span>}
                    <span style={{ fontSize: 11, color: "#9A8070", background: "#F5F0EB", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{pkg.occasion}</span>
                    {!pkg.visible && <span style={{ fontSize: 11, color: "#B0A098" }}>hidden</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setEditingPkg({ ...pkg })} style={{ padding: "6px 12px", background: "#F5F0EB", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#6A5A4A", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => deletePkg(pkg.id)} style={{ padding: "6px 12px", background: "#FDF2F2", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, color: "#c0392b", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {packages.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <button onClick={() => setActiveTab("publish")} style={{ padding: "11px 28px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Next: Publish
              </button>
            </div>
          )}

          {/* Package editor modal */}
          {editingPkg && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
              <div style={{ background: "#fff", borderRadius: 18, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#1A1208", marginBottom: 20 }}>
                  {editingPkg.id ? "Edit Package" : "Add Package"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={lbl}>Package Name *</label>
                    <input type="text" value={editingPkg.title ?? ""} onChange={(e) => setEditingPkg((p) => ({ ...p!, title: e.target.value }))} placeholder='e.g. "Classic Arch Package"' style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Description</label>
                    <textarea value={editingPkg.description ?? ""} onChange={(e) => setEditingPkg((p) => ({ ...p!, description: e.target.value }))} rows={3} placeholder="What's included, size, colours available..." style={{ ...inp, resize: "vertical" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={lbl}>Starting Price (£)</label>
                      <input type="number" min={0} value={editingPkg.starting_price ?? ""} onChange={(e) => setEditingPkg((p) => ({ ...p!, starting_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="e.g. 299" style={inp} />
                    </div>
                    <div>
                      <label style={lbl}>Fixed Price (£)</label>
                      <input type="number" min={0} value={editingPkg.fixed_price ?? ""} onChange={(e) => setEditingPkg((p) => ({ ...p!, fixed_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="e.g. 450" style={inp} />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={lbl}>Occasion</label>
                      <select value={editingPkg.occasion ?? "Other"} onChange={(e) => setEditingPkg((p) => ({ ...p!, occasion: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                        {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Visibility</label>
                      <select value={editingPkg.visible ? "visible" : "hidden"} onChange={(e) => setEditingPkg((p) => ({ ...p!, visible: e.target.value === "visible" }))} style={{ ...inp, cursor: "pointer" }}>
                        <option value="visible">Visible on storefront</option>
                        <option value="hidden">Hidden (draft)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Photo URL (optional)</label>
                    <input type="url" value={editingPkg.image_url ?? ""} onChange={(e) => setEditingPkg((p) => ({ ...p!, image_url: e.target.value || null }))} placeholder="https://..." style={inp} />
                    {editingPkg.image_url && <img src={editingPkg.image_url} alt="" style={{ marginTop: 8, width: "100%", height: 140, objectFit: "cover", borderRadius: 8, border: "1px solid #EDE8E3" }} onError={(e) => (e.currentTarget.style.display = "none")} />}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button
                    onClick={() => savePkg(editingPkg)}
                    disabled={pkgSaving || !editingPkg.title?.trim()}
                    style={{ flex: 1, padding: "11px 0", background: pkgSaving || !editingPkg.title?.trim() ? "#EDE8E3" : "#F05A00", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: pkgSaving || !editingPkg.title?.trim() ? "not-allowed" : "pointer" }}
                  >
                    {pkgSaving ? "Saving..." : editingPkg.id ? "Save Changes" : "Add Package"}
                  </button>
                  <button onClick={() => setEditingPkg(null)} style={{ padding: "11px 20px", background: "#F5F0EB", color: "#6A5A4A", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PUBLISH TAB ─────────────────────────────────────────────────────── */}
      {activeTab === "publish" && (
        <div>
          <div style={crd}>
            <div style={crdHead}>Publish Settings</div>

            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Pricing visibility</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ v: true, l: "Show prices" }, { v: false, l: "Hide prices (enquire only)" }].map(({ v, l }) => (
                  <button
                    key={String(v)}
                    onClick={() => setSf((p) => ({ ...p, show_prices: v }))}
                    style={{ flex: 1, padding: "9px 14px", background: sf.show_prices === v ? "#FFF7F3" : "#F5F0EB", border: sf.show_prices === v ? "1.5px solid #F05A00" : "1px solid #EDE8E3", borderRadius: 10, fontSize: 13, fontWeight: sf.show_prices === v ? 700 : 500, color: sf.show_prices === v ? "#F05A00" : "#6A5A4A", cursor: "pointer" }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: sf.published ? "#F0FFF4" : "#F5F0EB", borderRadius: 12, border: sf.published ? "1.5px solid #2ecc71" : "1px solid #EDE8E3", marginBottom: 18 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1208" }}>
                  {sf.published ? "Storefront is Live" : "Storefront is Unpublished"}
                </div>
                <div style={{ fontSize: 12, color: "#9A8070", marginTop: 2 }}>
                  {sf.published ? "Customers can visit your page" : "Only you can see a preview"}
                </div>
              </div>
              <button
                onClick={() => { const next = !sf.published; setSf((p) => ({ ...p, published: next })); save({ published: next }); }}
                style={{ padding: "9px 20px", background: sf.published ? "#FDF2F2" : "#F05A00", color: sf.published ? "#c0392b" : "#fff", border: sf.published ? "1px solid #fcdede" : "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                {sf.published ? "Unpublish" : "Publish Now"}
              </button>
            </div>

            {liveUrl && sf.published && (
              <div>
                <label style={lbl}>Your Shareable Link</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ flex: 1, padding: "10px 14px", background: "#F5F0EB", borderRadius: 10, fontSize: 13, color: "#6A5A4A", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {liveUrl}
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(liveUrl); showToast("Link copied!"); }} style={{ padding: "10px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}>
                    Copy Link
                  </button>
                  <a href={liveUrl} target="_blank" rel="noreferrer" style={{ padding: "10px 16px", background: "#F5F0EB", color: "#6A5A4A", borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: "none", whiteSpace: "nowrap" }}>
                    Preview
                  </a>
                </div>
              </div>
            )}

            {!sf.published && sf.slug && (
              <div style={{ marginTop: 10, fontSize: 13, color: "#9A8070", lineHeight: 1.6 }}>
                Your page is saved and ready. Hit "Publish Now" to make it live — you can unpublish anytime.
              </div>
            )}

            {!sf.slug && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "#FFF8E8", border: "1px solid #F0D080", borderRadius: 10, fontSize: 13, color: "#8A6A20" }}>
                Set a URL slug in the Content tab before publishing.
              </div>
            )}
          </div>

          <button onClick={() => save()} disabled={saving} style={{ padding: "11px 28px", background: saving ? "#EDE8E3" : "#F05A00", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save All Settings"}
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#1A1208", color: "#fff", padding: "10px 22px", borderRadius: 40, fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", whiteSpace: "nowrap" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
