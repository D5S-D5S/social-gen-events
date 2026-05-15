"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const WEBHOOK_URL = "/api/waitlist";

const TOTAL_STEPS = 5;

const HEARD_OPTIONS = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "google", label: "Google search" },
  { value: "word_of_mouth", label: "Word of mouth" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
];

const FEATURE_OPTIONS = [
  { value: "smart_booking", label: "Smart Booking" },
  { value: "quote_builder", label: "Quote Builder" },
  { value: "mockup_builder", label: "Mockup Builder" },
  { value: "inventory_tracking", label: "Inventory Tracking" },
  { value: "client_crm", label: "Client CRM" },
  { value: "storefront", label: "Storefront / Landing Page" },
  { value: "revenue_analytics", label: "Revenue Analytics" },
  { value: "quote_tools", label: "Quote Tools" },
];

const EVENTS_OPTIONS = [
  { value: "just_starting", label: "Just starting out" },
  { value: "1_5", label: "1 – 5 events" },
  { value: "6_15", label: "6 – 15 events" },
  { value: "16_plus", label: "16+ events" },
];

export default function WaitlistPage() {
  const [step, setStep] = useState(0); // 0 = intro
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    heardFrom: "",
    excitedFeature: "",
    eventsPerMonth: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on step change
  useEffect(() => {
    if (step > 0 && step <= 2) {
      setTimeout(() => inputRef.current?.focus(), 320);
    }
  }, [step]);

  const goTo = useCallback((next: number, dir: "forward" | "back" = "forward") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setError("");
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
    }, 260);
  }, [animating]);

  function validateCurrent(): boolean {
    if (step === 1 && !form.name.trim()) { setError("Please enter your name."); return false; }
    if (step === 2) {
      if (!form.email.trim()) { setError("Please enter your email."); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Please enter a valid email."); return false; }
    }
    return true;
  }

  function next() {
    if (!validateCurrent()) return;
    if (step < TOTAL_STEPS) goTo(step + 1, "forward");
  }

  function back() {
    if (step > 0) goTo(step - 1, "back");
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && step >= 1 && step <= 2) next();
  }

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            form.name.trim(),
          email:           form.email.trim(),
          heardFrom:       form.heardFrom,
          excitedFeature:  form.excitedFeature,
          eventsPerMonth:  form.eventsPerMonth,
        }),
      });
      if (!res.ok) throw new Error("failed");
      setSubmitted(true);
      goTo(TOTAL_STEPS + 1, "forward");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const progress = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', -apple-system, sans-serif;
          background: #fff;
          color: #0D0D0D;
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
          height: 100dvh;
        }

        .wl-shell {
          display: flex;
          flex-direction: column;
          height: 100dvh;
          position: relative;
          background: #fff;
        }

        /* ── Top bar ── */
        .wl-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 32px 0;
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }
        .wl-logo {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px; font-weight: 800;
          letter-spacing: -0.02em; color: #0D0D0D;
          text-decoration: none;
        }
        .wl-logo span { color: #F05000; }
        .wl-step-count {
          font-size: 13px; font-weight: 600; color: #9CA3AF;
          font-variant-numeric: tabular-nums;
        }

        /* ── Progress bar ── */
        .wl-progress-wrap {
          height: 3px;
          background: #F3F4F6;
          margin-top: 20px;
          flex-shrink: 0;
        }
        .wl-progress-fill {
          height: 100%;
          background: #F05000;
          transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
        }

        /* ── Stage ── */
        .wl-stage {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 24px 80px;
          overflow: hidden;
          position: relative;
        }

        /* ── Card / slide ── */
        .wl-card {
          width: 100%;
          max-width: 600px;
          transition: opacity 0.26s ease, transform 0.26s cubic-bezier(0.4,0,0.2,1);
        }
        .wl-card.exiting-forward  { opacity: 0; transform: translateY(-28px); }
        .wl-card.exiting-back     { opacity: 0; transform: translateY(28px); }
        .wl-card.entering         { opacity: 0; transform: translateY(20px); }

        /* ── Intro ── */
        .wl-intro-label {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 12px 5px 6px;
          background: #FFF4EF; border: 1px solid #FBBF9A;
          border-radius: 999px;
          font-size: 12.5px; font-weight: 600; color: #F05000;
          margin-bottom: 28px;
        }
        .wl-intro-dot {
          width: 6px; height: 6px; border-radius: 50%; background: #F05000;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(0.85); }
        }
        .wl-intro h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5.5vw, 58px);
          font-weight: 800; letter-spacing: -0.03em; line-height: 1.08;
          color: #0D0D0D; margin-bottom: 18px;
        }
        .wl-intro h1 em { font-style: normal; color: #F05000; }
        .wl-intro-sub {
          font-size: 17px; line-height: 1.65; color: #6B7280;
          max-width: 460px; margin-bottom: 36px;
        }
        .wl-intro-note {
          margin-top: 14px; font-size: 12.5px; color: #9CA3AF;
        }

        /* ── Question ── */
        .wl-question-num {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 700; color: #F05000;
          margin-bottom: 20px; letter-spacing: 0.02em;
        }
        .wl-question-num svg { flex-shrink: 0; }
        .wl-question h2 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(26px, 4vw, 40px);
          font-weight: 800; letter-spacing: -0.03em; line-height: 1.12;
          color: #0D0D0D; margin-bottom: 28px;
        }
        .wl-question h2 span { color: #F05000; }

        /* ── Text input ── */
        .wl-input {
          width: 100%;
          padding: 14px 0;
          border: none; border-bottom: 2px solid #E5E7EB;
          font-size: 22px; font-family: 'DM Sans', sans-serif;
          font-weight: 500; color: #0D0D0D;
          background: transparent; outline: none;
          transition: border-color 0.2s;
        }
        .wl-input::placeholder { color: #D1D5DB; }
        .wl-input:focus { border-bottom-color: #F05000; }

        /* ── Choice list ── */
        .wl-choices {
          display: flex; flex-direction: column; gap: 10px;
          margin-bottom: 8px;
        }
        .wl-choice {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 16px;
          border: 1.5px solid #E5E7EB;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s;
          background: #fff;
          font-size: 15px; font-weight: 500; color: #374151;
          user-select: none;
        }
        .wl-choice:hover { border-color: #F05000; background: #FFF8F5; color: #0D0D0D; }
        .wl-choice.selected {
          border-color: #F05000; background: #FFF4EF; color: #0D0D0D;
        }
        .wl-choice-key {
          width: 24px; height: 24px;
          border: 1.5px solid #D1D5DB;
          border-radius: 5px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #9CA3AF;
          flex-shrink: 0; transition: all 0.15s;
          font-family: monospace;
        }
        .wl-choice.selected .wl-choice-key {
          background: #F05000; border-color: #F05000; color: #fff;
        }

        /* ── Hint ── */
        .wl-hint {
          font-size: 12.5px; color: #9CA3AF; margin-top: 16px;
          display: flex; align-items: center; gap: 6px;
        }
        .wl-hint kbd {
          display: inline-flex; align-items: center; justify-content: center;
          padding: 2px 7px; border-radius: 4px;
          background: #F3F4F6; border: 1px solid #E5E7EB;
          font-size: 11px; font-family: monospace; color: #6B7280;
        }

        /* ── Error ── */
        .wl-error {
          font-size: 13px; color: #EF4444; margin-top: 10px;
        }

        /* ── Buttons ── */
        .wl-actions {
          position: absolute; bottom: 28px; left: 0; right: 0;
          display: flex; align-items: center; justify-content: center;
          gap: 10px; padding: 0 24px;
        }
        .wl-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 11px 22px; border-radius: 9px;
          font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600;
          cursor: pointer; border: none; transition: all 0.15s; text-decoration: none;
        }
        .wl-btn-primary {
          background: #F05000; color: #fff;
          box-shadow: 0 1px 3px rgba(240,80,0,0.25);
          min-width: 140px;
        }
        .wl-btn-primary:hover:not(:disabled) {
          background: #D94600;
          box-shadow: 0 4px 14px rgba(240,80,0,0.3);
          transform: translateY(-1px);
        }
        .wl-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
        .wl-btn-ghost {
          background: transparent; color: #9CA3AF;
          border: 1.5px solid #E5E7EB;
        }
        .wl-btn-ghost:hover { color: #374151; border-color: #D1D5DB; background: #F9FAFB; }

        /* ── Success ── */
        .wl-success { text-align: center; }
        .wl-success-icon {
          width: 72px; height: 72px;
          background: #ECFDF5; border: 1px solid #A9EFC5;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 28px; color: #16A34A;
        }
        .wl-success h2 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 800; letter-spacing: -0.03em;
          color: #0D0D0D; margin-bottom: 14px;
        }
        .wl-success p {
          font-size: 16px; line-height: 1.65; color: #6B7280;
          max-width: 380px; margin: 0 auto;
        }

        @media (max-width: 480px) {
          .wl-topbar { padding: 16px 20px 0; }
          .wl-input { font-size: 18px; }
          .wl-choice { font-size: 14px; padding: 11px 14px; }
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="wl-shell">
        {/* ── Top bar ── */}
        <div className="wl-topbar">
          <a href="/" className="wl-logo">Balloon<span>Base</span></a>
          {step > 0 && step <= TOTAL_STEPS && (
            <span className="wl-step-count">{step} / {TOTAL_STEPS}</span>
          )}
        </div>

        {/* ── Progress ── */}
        <div className="wl-progress-wrap">
          <div className="wl-progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* ── Stage ── */}
        <div className="wl-stage">
          <div className={`wl-card ${animating ? (direction === "forward" ? "exiting-forward" : "exiting-back") : ""}`}>

            {/* ─ Intro ─ */}
            {step === 0 && (
              <div className="wl-intro">
                <div className="wl-intro-label">
                  <div className="wl-intro-dot" />
                  Launching soon — get early access
                </div>
                <h1>
                  Built for balloon<br />
                  decorators.<br />
                  <em>Join the waitlist.</em>
                </h1>
                <p className="wl-intro-sub">
                  Takes 60 seconds. Be first in line for free early access and founder pricing.
                </p>
                <button className="wl-btn wl-btn-primary" onClick={() => goTo(1)}>
                  Get started
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
                <p className="wl-intro-note">No spam, ever &nbsp;·&nbsp; Unsubscribe any time</p>
              </div>
            )}

            {/* ─ Step 1: Name ─ */}
            {step === 1 && (
              <div className="wl-question">
                <div className="wl-question-num">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Question 1
                </div>
                <h2>What&apos;s your name?</h2>
                <input
                  ref={inputRef}
                  type="text"
                  className="wl-input"
                  placeholder="Type your answer here..."
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={handleKey}
                  autoComplete="name"
                />
                {error && <p className="wl-error">{error}</p>}
                <p className="wl-hint">Press <kbd>Enter</kbd> to continue</p>
              </div>
            )}

            {/* ─ Step 2: Email ─ */}
            {step === 2 && (
              <div className="wl-question">
                <div className="wl-question-num">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Question 2
                </div>
                <h2>
                  Nice to meet you,{" "}
                  <span>{form.name.split(" ")[0]}.</span>
                  <br />What&apos;s your email?
                </h2>
                <input
                  ref={inputRef}
                  type="email"
                  className="wl-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  onKeyDown={handleKey}
                  autoComplete="email"
                />
                {error && <p className="wl-error">{error}</p>}
                <p className="wl-hint">Press <kbd>Enter</kbd> to continue</p>
              </div>
            )}

            {/* ─ Step 3: How did you hear ─ */}
            {step === 3 && (
              <div className="wl-question">
                <div className="wl-question-num">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Question 3
                </div>
                <h2>How did you hear<br />about us?</h2>
                <div className="wl-choices">
                  {HEARD_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.value}
                      className={`wl-choice ${form.heardFrom === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        setForm(f => ({ ...f, heardFrom: opt.value }));
                        setTimeout(() => goTo(4, "forward"), 200);
                      }}
                    >
                      <span className="wl-choice-key">{String.fromCharCode(65 + i)}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─ Step 4: Excited feature ─ */}
            {step === 4 && (
              <div className="wl-question">
                <div className="wl-question-num">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Question 4
                </div>
                <h2>Which tool are you<br />most excited to use?</h2>
                <div className="wl-choices">
                  {FEATURE_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.value}
                      className={`wl-choice ${form.excitedFeature === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        setForm(f => ({ ...f, excitedFeature: opt.value }));
                        setTimeout(() => goTo(5, "forward"), 200);
                      }}
                    >
                      <span className="wl-choice-key">{String.fromCharCode(65 + i)}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─ Step 5: Events per month ─ */}
            {step === 5 && (
              <div className="wl-question">
                <div className="wl-question-num">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  Question 5
                </div>
                <h2>How many events do you<br />decorate per month?</h2>
                <div className="wl-choices">
                  {EVENTS_OPTIONS.map((opt, i) => (
                    <button
                      key={opt.value}
                      className={`wl-choice ${form.eventsPerMonth === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        setForm(f => ({ ...f, eventsPerMonth: opt.value }));
                      }}
                    >
                      <span className="wl-choice-key">{String.fromCharCode(65 + i)}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
                {error && <p className="wl-error">{error}</p>}
              </div>
            )}

            {/* ─ Success ─ */}
            {step > TOTAL_STEPS && (
              <div className="wl-success">
                <div className="wl-success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h2>You&apos;re on the list!</h2>
                <p>
                  We&apos;ll email you at <strong style={{ color: "#0D0D0D" }}>{form.email}</strong> as soon as early access opens. Talk soon.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* ── Bottom actions ── */}
        {step > 0 && step <= TOTAL_STEPS && (
          <div className="wl-actions">
            <button className="wl-btn wl-btn-ghost" onClick={back}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Back
            </button>

            {/* Steps 1-2 need explicit Next; steps 3-4 auto-advance on select; step 5 needs submit */}
            {(step === 1 || step === 2) && (
              <button className="wl-btn wl-btn-primary" onClick={next}>
                OK
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            )}
            {(step === 3 || step === 4) && form[step === 3 ? "heardFrom" : "excitedFeature"] && (
              <button className="wl-btn wl-btn-primary" onClick={next}>
                Next
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            )}
            {step === 5 && (
              <button
                className="wl-btn wl-btn-primary"
                onClick={submit}
                disabled={loading || !form.eventsPerMonth}
              >
                {loading ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 0.8s linear infinite" }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
