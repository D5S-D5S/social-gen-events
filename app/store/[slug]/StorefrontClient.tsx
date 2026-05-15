"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface StorefrontPackage {
  id: string;
  storefront_id: string;
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
  collect_deposit: boolean;
  published: boolean;
  template: "studio" | "fiesta" | "luxe";
  gallery_urls: string[];
  contact_email: string | null;
  contact_phone: string | null;
  instagram_handle: string | null;
}

interface Testimonial {
  id: string;
  author_name: string;
  body: string;
  occasion: string;
  rating: number;
  sort_order: number;
}

interface Props {
  storefront: StorefrontData;
  packages: StorefrontPackage[];
  testimonials: Testimonial[];
}

/* ─── Shared components ───────────────────────────────────────────────────── */

function StarRating({ rating, color = "#F0A020" }: { rating: number; color?: string }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 13 13" fill={i <= rating ? color : "#D8D0C8"}>
          <path d="M6.5 1l1.55 3.14L11.5 4.64l-2.5 2.43.59 3.44L6.5 8.77l-3.09 1.74.59-3.44L1.5 4.64l3.45-.5L6.5 1z" />
        </svg>
      ))}
    </div>
  );
}

function EnquiryModal({ storefront, preselectedPackage, onClose }: {
  storefront: StorefrontData;
  preselectedPackage: StorefrontPackage | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", event_date: "", message: "",
    occasion: preselectedPackage?.occasion ?? "",
    package_id: preselectedPackage?.id ?? "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/storefront/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storefront_id: storefront.id, ...form }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const fi: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid #DDD",
    borderRadius: 9, fontSize: 13, outline: "none", boxSizing: "border-box",
  };

  return (
    <>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200 }} onClick={onClose} />
      <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#fff", borderRadius: 20, width: "min(520px,94vw)", maxHeight: "90vh", overflowY: "auto", zIndex: 201, boxShadow: "0 24px 80px rgba(0,0,0,0.22)" }}>
        <div style={{ padding: "22px 26px", borderBottom: "1px solid #EDE8E3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#1A1A1A" }}>{submitted ? "Enquiry received!" : "Make an enquiry"}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{storefront.business_name}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#888", fontSize: 22, lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {submitted ? (
          <div style={{ padding: "40px 28px", textAlign: "center" }}>
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ display: "block", margin: "0 auto 16px" }}>
              <circle cx="28" cy="28" r="28" fill={`${storefront.brand_primary}18`} />
              <path d="M18 28l7 7 13-13" stroke={storefront.brand_primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A1A", marginBottom: 8 }}>Thank you, {form.name}!</div>
            <div style={{ fontSize: 14, color: "#666", lineHeight: 1.6 }}>
              Your enquiry has been sent to {storefront.business_name}. They&apos;ll be in touch soon.
            </div>
            <button onClick={onClose} style={{ marginTop: 24, padding: "10px 28px", border: "none", borderRadius: 10, background: storefront.brand_primary, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "20px 26px 26px" }}>
            {preselectedPackage && (
              <div style={{ background: `${storefront.brand_primary}10`, border: `1px solid ${storefront.brand_primary}30`, borderRadius: 10, padding: "9px 13px", marginBottom: 14, fontSize: 13, color: "#444" }}>
                Enquiring about: <strong>{preselectedPackage.title}</strong>
              </div>
            )}
            {error && (
              <div style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 10, padding: "9px 13px", marginBottom: 14, fontSize: 13, color: "#B91C1C" }}>{error}</div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#777", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={fi} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#777", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Email *</label>
                <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={fi} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#777", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={fi} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "#777", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Event Date</label>
                <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} style={fi} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#777", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.04em" }}>Message</label>
              <textarea rows={4} placeholder="Tell us about your event, colour scheme, and any special requirements..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} style={{ ...fi, resize: "vertical" }} />
            </div>
            <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", border: "none", borderRadius: 10, background: storefront.brand_primary, color: "#fff", fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Sending…" : "Send Enquiry"}
            </button>
          </form>
        )}
      </div>
    </>
  );
}

/* ─── Template: STUDIO ────────────────────────────────────────────────────── */
// Clean minimal. White/cream. Typographic. Photo-forward.

function TemplateStudio({ storefront, packages, testimonials, openEnquiry }: {
  storefront: StorefrontData;
  packages: StorefrontPackage[];
  testimonials: Testimonial[];
  openEnquiry: (pkg?: StorefrontPackage) => void;
}) {
  const p = storefront.brand_primary;
  const hasHero = !!storefront.hero_url;

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#FAFAF8", minHeight: "100dvh" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(250,250,248,0.96)", backdropFilter: "blur(10px)", borderBottom: "1px solid #EDE8E3", padding: "0 max(24px, env(safe-area-inset-left))", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {storefront.logo_url
            ? <img src={storefront.logo_url} alt={storefront.business_name} style={{ height: 30, objectFit: "contain" }} />
            : <div style={{ width: 30, height: 30, borderRadius: 8, background: p, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>{storefront.business_name.charAt(0)}</div>
          }
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1A1208", letterSpacing: "-0.01em" }}>{storefront.business_name}</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {packages.length > 0 && <a href="#packages" style={{ fontSize: 13, fontWeight: 600, color: "#666", textDecoration: "none", padding: "6px 8px" }}>Packages</a>}
          {storefront.gallery_urls?.length > 0 && <a href="#gallery" style={{ fontSize: 13, fontWeight: 600, color: "#666", textDecoration: "none", padding: "6px 8px" }}>Gallery</a>}
          <button onClick={() => openEnquiry()} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: p, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enquire</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", minHeight: 500, display: "flex", alignItems: "center" }}>
        {hasHero && <img src={storefront.hero_url!} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        {hasHero && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.42)" }} />}
        <div style={{ position: "relative", maxWidth: 700, padding: "80px 40px", zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: hasHero ? "rgba(255,255,255,0.65)" : p, marginBottom: 14 }}>Balloon Décor</div>
          <h1 style={{ fontSize: "clamp(36px,5vw,64px)", fontWeight: 800, color: hasHero ? "#fff" : "#1A1208", letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 16px" }}>{storefront.business_name}</h1>
          {storefront.tagline && <p style={{ fontSize: "clamp(15px,1.8vw,19px)", color: hasHero ? "rgba(255,255,255,0.82)" : "#6A5A4A", lineHeight: 1.55, margin: "0 0 32px", maxWidth: 520 }}>{storefront.tagline}</p>}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button onClick={() => openEnquiry()} style={{ padding: "13px 28px", border: "none", borderRadius: 10, background: p, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Get a Quote</button>
            {packages.length > 0 && <a href="#packages" style={{ padding: "13px 28px", border: `2px solid ${hasHero ? "rgba(255,255,255,0.5)" : "#DDD"}`, borderRadius: 10, background: "transparent", color: hasHero ? "#fff" : "#1A1208", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>View Packages</a>}
          </div>
        </div>
      </section>

      {/* Bio */}
      {storefront.bio && (
        <section style={{ background: "#fff", padding: "60px max(24px,4vw)" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 40, height: 3, background: p, margin: "0 auto 24px", borderRadius: 2 }} />
            <p style={{ fontSize: "clamp(15px,1.6vw,17px)", color: "#5A4A3A", lineHeight: 1.75, margin: 0 }}>{storefront.bio}</p>
          </div>
        </section>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <section id="packages" style={{ padding: "64px max(24px,4vw)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: p, marginBottom: 8 }}>Packages</div>
              <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, color: "#1A1208", letterSpacing: "-0.03em", margin: 0 }}>What we offer</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 24 }}>
              {packages.map((pkg) => {
                const price = pkg.fixed_price != null ? `£${Number(pkg.fixed_price).toFixed(2)}` : pkg.starting_price != null ? `from £${Number(pkg.starting_price).toFixed(2)}` : null;
                return (
                  <div key={pkg.id} style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                    <div style={{ height: 200, background: `${p}12`, position: "relative" }}>
                      {pkg.image_url
                        ? <img src={pkg.image_url} alt={pkg.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.25">
                              <circle cx="24" cy="20" r="16" fill={p} /><path d="M24 36v8M20 42h8" stroke={p} strokeWidth="2" strokeLinecap="round" />
                              <circle cx="14" cy="40" r="8" fill={p} /><circle cx="34" cy="40" r="8" fill={p} />
                            </svg>
                          </div>
                      }
                      {pkg.occasion && <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(255,255,255,0.92)", borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#444" }}>{pkg.occasion}</div>}
                    </div>
                    <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1208", marginBottom: 6 }}>{pkg.title}</div>
                      <div style={{ fontSize: 13, color: "#7A6A5A", lineHeight: 1.55, flex: 1, marginBottom: 14 }}>{pkg.description}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {storefront.show_prices && price ? <span style={{ fontSize: 18, fontWeight: 800, color: "#1A1208" }}>{price}</span> : <span style={{ fontSize: 12, color: "#999" }}>Price on enquiry</span>}
                        <button onClick={() => openEnquiry(pkg)} style={{ padding: "8px 16px", border: "none", borderRadius: 8, background: p, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Enquire</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 48, background: `${p}0D`, border: `1px solid ${p}22`, borderRadius: 18, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 4 }}>Need something bespoke?</div>
                <div style={{ fontSize: 14, color: "#7A6A5A" }}>We&apos;ll design a custom setup perfectly tailored to your event.</div>
              </div>
              <button onClick={() => openEnquiry()} style={{ padding: "12px 26px", border: "none", borderRadius: 10, background: p, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>Request Custom Quote</button>
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {(storefront.gallery_urls ?? []).length > 0 && (
        <section id="gallery" style={{ background: "#F5F0EB", padding: "64px max(24px,4vw)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 36 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: p, marginBottom: 8 }}>Gallery</div>
              <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 800, color: "#1A1208", letterSpacing: "-0.03em", margin: 0 }}>Our work</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {storefront.gallery_urls.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 12, border: "1px solid #EDE8E3" }} onError={(e) => (e.currentTarget.style.display = "none")} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section style={{ padding: "64px max(24px,4vw)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: p, marginBottom: 8 }}>Reviews</div>
              <h2 style={{ fontSize: "clamp(24px,3.5vw,36px)", fontWeight: 800, color: "#1A1208", letterSpacing: "-0.03em", margin: 0 }}>What our clients say</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 18 }}>
              {testimonials.map((t) => (
                <div key={t.id} style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.05)", border: "1px solid #EDE8E3" }}>
                  <StarRating rating={t.rating} color={p} />
                  <p style={{ fontSize: 14, color: "#5A4A3A", lineHeight: 1.65, margin: "12px 0 14px", fontStyle: "italic" }}>&ldquo;{t.body}&rdquo;</p>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{t.author_name}</div>
                  {t.occasion && <div style={{ fontSize: 11, color: "#9A8070" }}>{t.occasion}</div>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: p, padding: "64px max(24px,4vw)", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px,4vw,40px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", marginBottom: 12 }}>Ready to make memories?</h2>
        <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", marginBottom: 28 }}>Let&apos;s create something beautiful for your event.</p>
        <button onClick={() => openEnquiry()} style={{ padding: "14px 34px", border: "2px solid rgba(255,255,255,0.45)", borderRadius: 12, background: "#fff", color: p, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Get in Touch</button>
      </section>

      <StorefrontFooter storefront={storefront} primary={p} />
    </div>
  );
}

/* ─── Template: FIESTA ────────────────────────────────────────────────────── */
// Warm cream, bold orange header, circular cards, festive energy.

function TemplateFiesta({ storefront, packages, testimonials, openEnquiry }: {
  storefront: StorefrontData;
  packages: StorefrontPackage[];
  testimonials: Testimonial[];
  openEnquiry: (pkg?: StorefrontPackage) => void;
}) {
  const p = storefront.brand_primary;

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: "#FFF8F0", minHeight: "100dvh" }}>
      {/* Hero — full colour block */}
      <section style={{ background: p, padding: "0 max(24px,4vw)", position: "relative", overflow: "hidden" }}>
        {/* Decorative blobs */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />

        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "relative", zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {storefront.logo_url
              ? <img src={storefront.logo_url} alt={storefront.business_name} style={{ height: 32, objectFit: "contain", filter: "brightness(10)" }} />
              : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>{storefront.business_name.charAt(0)}</div>
            }
            <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>{storefront.business_name}</span>
          </div>
          <button onClick={() => openEnquiry()} style={{ padding: "8px 18px", border: "2px solid rgba(255,255,255,0.6)", borderRadius: 99, background: "transparent", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Get a Quote</button>
        </nav>

        <div style={{ textAlign: "center", padding: "48px 0 60px", position: "relative", zIndex: 2 }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.15)", borderRadius: 99, padding: "5px 16px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.9)", marginBottom: 16 }}>Balloon Décor Studio</div>
          <h1 style={{ fontSize: "clamp(36px,5vw,62px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.05, margin: "0 0 14px" }}>{storefront.business_name}</h1>
          {storefront.tagline && <p style={{ fontSize: "clamp(15px,1.8vw,19px)", color: "rgba(255,255,255,0.85)", lineHeight: 1.5, margin: "0 auto 30px", maxWidth: 500 }}>{storefront.tagline}</p>}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => openEnquiry()} style={{ padding: "13px 30px", border: "none", borderRadius: 99, background: "#fff", color: p, fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Book Now</button>
            {packages.length > 0 && <a href="#packages" style={{ padding: "13px 30px", border: "2px solid rgba(255,255,255,0.55)", borderRadius: 99, color: "#fff", fontSize: 15, fontWeight: 700, textDecoration: "none" }}>See Packages</a>}
          </div>
        </div>

        {storefront.hero_url && <img src={storefront.hero_url} alt="" style={{ display: "block", width: "100%", maxHeight: 380, objectFit: "cover", borderRadius: "20px 20px 0 0", position: "relative", zIndex: 1 }} onError={(e) => (e.currentTarget.style.display = "none")} />}
      </section>

      {/* Bio */}
      {storefront.bio && (
        <section style={{ padding: "56px max(24px,4vw)" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: "clamp(15px,1.6vw,17px)", color: "#6A4A2A", lineHeight: 1.75, margin: 0 }}>{storefront.bio}</p>
          </div>
        </section>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <section id="packages" style={{ padding: "8px max(24px,4vw) 64px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2 style={{ fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, color: "#2A1A0A", letterSpacing: "-0.03em", margin: 0 }}>Our Packages</h2>
              <div style={{ width: 48, height: 4, background: p, margin: "14px auto 0", borderRadius: 2 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {packages.map((pkg) => {
                const price = pkg.fixed_price != null ? `£${Number(pkg.fixed_price).toFixed(2)}` : pkg.starting_price != null ? `from £${Number(pkg.starting_price).toFixed(2)}` : null;
                return (
                  <div key={pkg.id} style={{ background: "#fff", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(220,100,0,0.10)", border: "1px solid rgba(220,100,0,0.1)" }}>
                    <div style={{ height: 190, background: `${p}15`, position: "relative" }}>
                      {pkg.image_url
                        ? <img src={pkg.image_url} alt={pkg.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${p}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: p, opacity: 0.4 }} />
                            </div>
                          </div>
                      }
                      <div style={{ position: "absolute", top: 12, left: 12, background: "#fff", borderRadius: 99, padding: "4px 11px", fontSize: 10, fontWeight: 700, color: p }}>{pkg.occasion}</div>
                    </div>
                    <div style={{ padding: "18px 20px" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: "#1A0A00", marginBottom: 6 }}>{pkg.title}</div>
                      <div style={{ fontSize: 13, color: "#7A5A3A", lineHeight: 1.55, marginBottom: 16, minHeight: 40 }}>{pkg.description}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        {storefront.show_prices && price ? <span style={{ fontSize: 18, fontWeight: 900, color: p }}>{price}</span> : <span style={{ fontSize: 12, color: "#999" }}>Price on enquiry</span>}
                        <button onClick={() => openEnquiry(pkg)} style={{ padding: "8px 18px", border: "none", borderRadius: 99, background: p, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Book Now</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {(storefront.gallery_urls ?? []).length > 0 && (
        <section id="gallery" style={{ padding: "32px max(24px,4vw) 64px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 900, color: "#2A1A0A", letterSpacing: "-0.03em", margin: 0 }}>Real Events, Real Magic</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {storefront.gallery_urls.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 16 }} onError={(e) => (e.currentTarget.style.display = "none")} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section style={{ background: `${p}0F`, padding: "64px max(24px,4vw)" }}>
          <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(24px,3.5vw,38px)", fontWeight: 900, color: "#2A1A0A", letterSpacing: "-0.03em", marginBottom: 36 }}>Happy Customers</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
              {testimonials.map((t) => (
                <div key={t.id} style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 4px 20px rgba(220,100,0,0.08)", textAlign: "left" }}>
                  <StarRating rating={t.rating} color={p} />
                  <p style={{ fontSize: 14, color: "#5A3A1A", lineHeight: 1.65, margin: "10px 0 12px", fontStyle: "italic" }}>&ldquo;{t.body}&rdquo;</p>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A0A00" }}>{t.author_name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: "64px max(24px,4vw)", textAlign: "center", background: "#FFF0E4" }}>
        <h2 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, color: "#2A1A0A", letterSpacing: "-0.03em", marginBottom: 10 }}>Your event deserves to pop</h2>
        <p style={{ fontSize: 16, color: "#7A5A3A", marginBottom: 28 }}>Get in touch and let&apos;s make it happen.</p>
        <button onClick={() => openEnquiry()} style={{ padding: "14px 36px", border: "none", borderRadius: 99, background: p, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Send an Enquiry</button>
        {storefront.instagram_handle && (
          <div style={{ marginTop: 16, fontSize: 13, color: "#9A7A5A" }}>
            or find us on Instagram{" "}
            <a href={`https://instagram.com/${storefront.instagram_handle}`} target="_blank" rel="noreferrer" style={{ color: p, fontWeight: 700 }}>@{storefront.instagram_handle}</a>
          </div>
        )}
      </section>

      <StorefrontFooter storefront={storefront} primary={p} />
    </div>
  );
}

/* ─── Template: LUXE ──────────────────────────────────────────────────────── */
// Dark charcoal, gold accents. Premium events.

function TemplateLuxe({ storefront, packages, testimonials, openEnquiry }: {
  storefront: StorefrontData;
  packages: StorefrontPackage[];
  testimonials: Testimonial[];
  openEnquiry: (pkg?: StorefrontPackage) => void;
}) {
  const gold = "#C9A84C";
  const dark = "#0F0F0D";
  const card = "#1C1B18";
  const border = "rgba(201,168,76,0.25)";

  return (
    <div style={{ fontFamily: "'DM Sans', -apple-system, sans-serif", background: dark, color: "#E8E0D0", minHeight: "100dvh" }}>
      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(15,15,13,0.95)", backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`, padding: "0 max(24px,4vw)", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {storefront.logo_url
            ? <img src={storefront.logo_url} alt={storefront.business_name} style={{ height: 28, objectFit: "contain", filter: "sepia(1) saturate(2) hue-rotate(10deg) brightness(1.2)" }} />
            : <div style={{ width: 30, height: 30, border: `1px solid ${gold}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: gold }}>{storefront.business_name.charAt(0)}</div>
          }
          <span style={{ fontSize: 14, fontWeight: 700, color: "#E8E0D0", letterSpacing: "0.04em" }}>{storefront.business_name.toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {packages.length > 0 && <a href="#packages" style={{ fontSize: 12, fontWeight: 600, color: "#8A8070", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>Services</a>}
          <button onClick={() => openEnquiry()} style={{ padding: "8px 18px", border: `1px solid ${gold}`, borderRadius: 3, background: "transparent", color: gold, fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>Enquire</button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: "relative", minHeight: 580, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden" }}>
        {storefront.hero_url && <img src={storefront.hero_url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.3 }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(15,15,13,0.3), rgba(15,15,13,0.7))" }} />
        <div style={{ position: "relative", zIndex: 1, padding: "80px max(24px,4vw)" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, marginBottom: 20, fontWeight: 600 }}>Luxury Balloon Décor</div>
          <h1 style={{ fontSize: "clamp(36px,5vw,68px)", fontWeight: 300, color: "#F0E8D8", letterSpacing: "0.08em", lineHeight: 1.1, margin: "0 0 20px", textTransform: "uppercase" }}>
            {storefront.business_name}
          </h1>
          {storefront.tagline && <p style={{ fontSize: "clamp(14px,1.6vw,17px)", color: "#A09080", lineHeight: 1.7, margin: "0 auto 36px", maxWidth: 480 }}>{storefront.tagline}</p>}
          <div style={{ width: 60, height: 1, background: gold, margin: "0 auto 36px" }} />
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => openEnquiry()} style={{ padding: "13px 32px", border: `1px solid ${gold}`, borderRadius: 3, background: gold, color: "#0F0F0D", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase" }}>Request a Quote</button>
            {packages.length > 0 && <a href="#packages" style={{ padding: "13px 32px", border: `1px solid rgba(201,168,76,0.4)`, borderRadius: 3, color: "#E8E0D0", fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase" }}>Our Services</a>}
          </div>
        </div>
      </section>

      {/* Bio */}
      {storefront.bio && (
        <section style={{ padding: "64px max(24px,4vw)", borderBottom: `1px solid ${border}` }}>
          <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
            <div style={{ width: 40, height: 1, background: gold, margin: "0 auto 28px" }} />
            <p style={{ fontSize: "clamp(14px,1.5vw,16px)", color: "#9A9080", lineHeight: 1.8, margin: 0 }}>{storefront.bio}</p>
          </div>
        </section>
      )}

      {/* Packages */}
      {packages.length > 0 && (
        <section id="packages" style={{ padding: "72px max(24px,4vw)", borderBottom: `1px solid ${border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, marginBottom: 14 }}>Our Services</div>
              <h2 style={{ fontSize: "clamp(24px,3.5vw,42px)", fontWeight: 300, color: "#F0E8D8", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Packages</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 20 }}>
              {packages.map((pkg) => {
                const price = pkg.fixed_price != null ? `£${Number(pkg.fixed_price).toFixed(2)}` : pkg.starting_price != null ? `from £${Number(pkg.starting_price).toFixed(2)}` : null;
                return (
                  <div key={pkg.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: 200, background: "#141410", position: "relative" }}>
                      {pkg.image_url
                        ? <img src={pkg.image_url} alt={pkg.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
                        : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 2, height: 60, background: `${gold}40` }} />
                          </div>
                      }
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(to top, rgba(28,27,24,0.8) 0%, transparent 60%)" }} />
                    </div>
                    <div style={{ padding: "20px 22px" }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: gold, marginBottom: 8 }}>{pkg.occasion}</div>
                      <div style={{ fontSize: 17, fontWeight: 600, color: "#E8E0D0", marginBottom: 8, letterSpacing: "0.01em" }}>{pkg.title}</div>
                      <div style={{ fontSize: 13, color: "#7A7060", lineHeight: 1.6, marginBottom: 18 }}>{pkg.description}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${border}`, paddingTop: 16 }}>
                        {storefront.show_prices && price ? <span style={{ fontSize: 17, fontWeight: 600, color: gold }}>{price}</span> : <span style={{ fontSize: 12, color: "#6A6050" }}>Price on request</span>}
                        <button onClick={() => openEnquiry(pkg)} style={{ padding: "7px 16px", border: `1px solid ${gold}`, borderRadius: 2, background: "transparent", color: gold, fontSize: 11, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>Enquire</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Gallery */}
      {(storefront.gallery_urls ?? []).length > 0 && (
        <section id="gallery" style={{ padding: "72px max(24px,4vw)", borderBottom: `1px solid ${border}` }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: gold, marginBottom: 14 }}>Portfolio</div>
              <h2 style={{ fontSize: "clamp(22px,3.5vw,38px)", fontWeight: 300, color: "#F0E8D8", letterSpacing: "0.06em", textTransform: "uppercase", margin: 0 }}>Our Work</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {storefront.gallery_urls.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", opacity: 0.88 }} onError={(e) => (e.currentTarget.style.display = "none")} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section style={{ padding: "72px max(24px,4vw)", borderBottom: `1px solid ${border}` }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 300, color: "#F0E8D8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 48 }}>Client Testimonials</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
              {testimonials.map((t) => (
                <div key={t.id} style={{ background: card, border: `1px solid ${border}`, padding: "22px 24px", textAlign: "left" }}>
                  <StarRating rating={t.rating} color={gold} />
                  <p style={{ fontSize: 14, color: "#9A9080", lineHeight: 1.7, margin: "14px 0 16px", fontStyle: "italic" }}>&ldquo;{t.body}&rdquo;</p>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#D0C8B8", letterSpacing: "0.04em" }}>{t.author_name.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ padding: "80px max(24px,4vw)", textAlign: "center" }}>
        <div style={{ width: 60, height: 1, background: gold, margin: "0 auto 32px" }} />
        <h2 style={{ fontSize: "clamp(24px,4vw,44px)", fontWeight: 300, color: "#F0E8D8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>Begin Your Vision</h2>
        <p style={{ fontSize: 15, color: "#8A8070", marginBottom: 32 }}>Every extraordinary event starts with a conversation.</p>
        <button onClick={() => openEnquiry()} style={{ padding: "14px 40px", border: `1px solid ${gold}`, borderRadius: 3, background: gold, color: "#0F0F0D", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>Request a Consultation</button>
      </section>

      {/* Footer */}
      <footer style={{ background: "#08080A", borderTop: `1px solid ${border}`, padding: "24px max(24px,4vw)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontSize: 12, color: "#5A5040", letterSpacing: "0.06em" }}>{storefront.business_name.toUpperCase()}</span>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {storefront.contact_email && <a href={`mailto:${storefront.contact_email}`} style={{ fontSize: 12, color: "#6A6050", textDecoration: "none" }}>{storefront.contact_email}</a>}
          {storefront.instagram_handle && <a href={`https://instagram.com/${storefront.instagram_handle}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: gold, textDecoration: "none" }}>@{storefront.instagram_handle}</a>}
        </div>
        <span style={{ fontSize: 11, color: "#4A4030" }}>Powered by BalloonBase</span>
      </footer>
    </div>
  );
}

/* ─── Shared footer ───────────────────────────────────────────────────────── */

function StorefrontFooter({ storefront, primary }: { storefront: StorefrontData; primary: string }) {
  return (
    <footer style={{ background: "#1A1208", padding: "24px max(24px,4vw)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#7A6A5A" }}>{storefront.business_name}</span>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        {storefront.contact_email && <a href={`mailto:${storefront.contact_email}`} style={{ fontSize: 12, color: "#9A8A7A", textDecoration: "none" }}>{storefront.contact_email}</a>}
        {storefront.contact_phone && <a href={`tel:${storefront.contact_phone}`} style={{ fontSize: 12, color: "#9A8A7A", textDecoration: "none" }}>{storefront.contact_phone}</a>}
        {storefront.instagram_handle && <a href={`https://instagram.com/${storefront.instagram_handle}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: primary, fontWeight: 600, textDecoration: "none" }}>@{storefront.instagram_handle}</a>}
      </div>
      <span style={{ fontSize: 12, color: "#5A4A3A" }}>Powered by <span style={{ color: primary, fontWeight: 700 }}>BalloonBase</span></span>
    </footer>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────────── */

export default function StorefrontClient({ storefront, packages, testimonials }: Props) {
  const searchParams = useSearchParams();
  const [enquiryPackage, setEnquiryPackage] = useState<StorefrontPackage | null>(null);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    const enquireId = searchParams.get("enquire");
    if (enquireId) {
      const pkg = packages.find((p) => p.id === enquireId) ?? null;
      setEnquiryPackage(pkg);
      setShowEnquiry(true);
    }
  }, [searchParams, packages]);

  const openEnquiry = (pkg?: StorefrontPackage) => {
    setEnquiryPackage(pkg ?? null);
    setShowEnquiry(true);
  };

  const tmpl = storefront.template ?? "studio";
  const commonProps = { storefront, packages, testimonials, openEnquiry };

  return (
    <>
      {tmpl === "studio" && <TemplateStudio {...commonProps} />}
      {tmpl === "fiesta" && <TemplateFiesta {...commonProps} />}
      {tmpl === "luxe"   && <TemplateLuxe   {...commonProps} />}
      {!["studio", "fiesta", "luxe"].includes(tmpl) && <TemplateStudio {...commonProps} />}

      {showEnquiry && (
        <EnquiryModal
          storefront={storefront}
          preselectedPackage={enquiryPackage}
          onClose={() => { setShowEnquiry(false); setEnquiryPackage(null); }}
        />
      )}
    </>
  );
}
