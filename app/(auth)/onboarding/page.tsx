"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const TOTAL_STEPS = 4; // business, events, hear about us, done
const EVENT_TYPES = ["Weddings", "Birthdays", "Corporate", "Baby Showers", "Gender Reveals", "Mixed / All"];
const MONTHLY_OPTIONS = ["1–5", "6–15", "16–30", "30+"];
const HEAR_OPTIONS = ["Instagram", "TikTok", "Google", "Facebook", "Word of mouth", "A friend / colleague", "Online ad", "Other"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=welcome, 1=business, 2=events, 3=hear, 4=done
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [monthlyEvents, setMonthlyEvents] = useState("");
  const [hearAboutUs, setHearAboutUs] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }
      if (user.user_metadata?.onboarding_completed) router.replace("/dashboard");
    });
  }, [router]);

  function toggleType(t: string) {
    setEventTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function finish() {
    setSaving(true);
    setError("");
    const { error: e } = await supabase.auth.updateUser({
      data: {
        business_name: businessName.trim() || undefined,
        phone: phone.trim() || undefined,
        event_types: eventTypes,
        monthly_events: monthlyEvents,
        hear_about_us: hearAboutUs,
        onboarding_completed: true,
      },
    });
    if (e) { setError(e.message); setSaving(false); return; }
    router.replace("/dashboard");
  }

  // Progress = steps 1-4 (skip welcome step 0 from progress bar)
  const progressStep = Math.max(0, step - 1);
  const pct = step === 0 ? 0 : Math.round((progressStep / TOTAL_STEPS) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'DM Sans', sans-serif" }}>

      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 48, color: "#0D0D0D" }}>
        Balloon<span style={{ color: "#F05000" }}>Base</span>
      </div>

      <div style={{ width: "100%", maxWidth: 480 }}>
        {/* Progress bar — only show after welcome */}
        {step > 0 && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#F05000" }}>
                Step {step} of {TOTAL_STEPS}
              </span>
              <span style={{ fontSize: 12, color: "#9CA3AF" }}>{pct}%</span>
            </div>
            <div style={{ height: 3, background: "#E5E7EB", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: "#F05000", borderRadius: 99, transition: "width 0.4s ease" }} />
            </div>
          </div>
        )}

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 34, fontWeight: 800, letterSpacing: "-0.03em", color: "#0D0D0D", marginBottom: 14, lineHeight: 1.1 }}>
              Welcome to BalloonBase
            </h1>
            <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.65, marginBottom: 40 }}>
              Let&apos;s set up your account in 60 seconds. You can change anything later in Settings.
            </p>
            <button onClick={() => setStep(1)} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
              Let&apos;s go
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
            <button onClick={finish} style={{ ...ghostBtn, width: "100%", marginTop: 10, justifyContent: "center", display: "flex" }}>
              Skip for now
            </button>
          </div>
        )}

        {/* Step 1 — Business info */}
        {step === 1 && (
          <div>
            <h2 style={heading}>Tell us about your business</h2>
            <p style={subtext}>This personalises your workspace and client-facing quotes.</p>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Business name</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Jess's Balloon Studio" style={inputStyle} autoFocus />
            </div>
            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>
                Phone number <span style={{ color: "#9CA3AF", fontWeight: 400 }}>(optional)</span>
              </label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="+44 7700 000000" style={inputStyle} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(0)} style={ghostBtn}>Back</button>
              <button onClick={() => setStep(2)} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}>
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Events */}
        {step === 2 && (
          <div>
            <h2 style={heading}>What type of events do you do?</h2>
            <p style={subtext}>Select all that apply — helps us tailor your experience.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 }}>
              {EVENT_TYPES.map((t) => {
                const active = eventTypes.includes(t);
                return (
                  <button key={t} onClick={() => toggleType(t)}
                    style={{ padding: "12px 14px", border: `1.5px solid ${active ? "#F05000" : "#E5E7EB"}`, borderRadius: 10, background: active ? "#FFF4EF" : "#fff", color: active ? "#F05000" : "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}>
                    {t}
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: 32 }}>
              <label style={labelStyle}>How many events per month?</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {MONTHLY_OPTIONS.map((o) => {
                  const active = monthlyEvents === o;
                  return (
                    <button key={o} onClick={() => setMonthlyEvents(o)}
                      style={{ padding: "11px 8px", border: `1.5px solid ${active ? "#F05000" : "#E5E7EB"}`, borderRadius: 10, background: active ? "#FFF4EF" : "#fff", color: active ? "#F05000" : "#374151", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" }}>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(1)} style={ghostBtn}>Back</button>
              <button onClick={() => setStep(3)} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}>Continue</button>
            </div>
          </div>
        )}

        {/* Step 3 — How did you hear about us */}
        {step === 3 && (
          <div>
            <h2 style={heading}>How did you hear about us?</h2>
            <p style={subtext}>Helps us understand how people find BalloonBase.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 36 }}>
              {HEAR_OPTIONS.map((o) => {
                const active = hearAboutUs === o;
                return (
                  <button key={o} onClick={() => setHearAboutUs(o)}
                    style={{ padding: "13px 14px", border: `1.5px solid ${active ? "#F05000" : "#E5E7EB"}`, borderRadius: 10, background: active ? "#FFF4EF" : "#fff", color: active ? "#F05000" : "#374151", fontSize: 14, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 16, height: 16, border: `1.5px solid ${active ? "#F05000" : "#D1D5DB"}`, borderRadius: "50%", background: active ? "#F05000" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {active && <span style={{ width: 6, height: 6, background: "#fff", borderRadius: "50%", display: "block" }} />}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStep(2)} style={ghostBtn}>Back</button>
              <button onClick={() => setStep(4)} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}>
                {hearAboutUs ? "Continue" : "Skip"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#FFF4EF", border: "1.5px solid #FBBF9A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F05000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 style={{ ...heading, textAlign: "center" }}>You&apos;re ready to go</h2>
            <p style={{ ...subtext, textAlign: "center", marginBottom: 40 }}>
              Your account is set up. Start with a quote, add your pricing tiers, or set up a booking form.
            </p>

            {error && (
              <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>
            )}

            <button onClick={finish} disabled={saving} style={{ ...primaryBtn, width: "100%", justifyContent: "center" }}>
              {saving ? "Setting up…" : "Go to dashboard"}
              {!saving && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const heading: React.CSSProperties = { fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "#0D0D0D", marginBottom: 8 };
const subtext: React.CSSProperties = { fontSize: 15, color: "#6B7280", lineHeight: 1.65, marginBottom: 24 };
const labelStyle: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const inputStyle: React.CSSProperties = { width: "100%", padding: "11px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 15, color: "#0D0D0D", outline: "none", background: "#fff", boxSizing: "border-box" };
const primaryBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#F05000", color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.15s" };
const ghostBtn: React.CSSProperties = { padding: "12px 20px", background: "transparent", color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: "pointer" };
