"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { PRO_PLAN_COMING_SOON_MESSAGE, PRO_PLAN_PUBLICLY_AVAILABLE } from "@/lib/plans";

type BillingStatus = {
  plan: string;
  planName: string;
  hasAiTools: boolean;
  aiTokensIncluded: number;
  aiTokensUsed: number;
  aiTokensRemaining: number;
};

export default function ProFeatureGate({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const res = await fetch("/api/billing/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) setStatus(await res.json());
      setLoading(false);
    }

    load().catch(() => setLoading(false));
  }, []);

  async function startProCheckout() {
    if (!PRO_PLAN_PUBLICLY_AVAILABLE) return;
    setCheckoutLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    const res = await fetch("/api/stripe/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session.user.id,
        email: session.user.email,
        plan: "pro",
      }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setCheckoutLoading(false);
  }

  if (loading) {
    return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Checking plan...</div>;
  }

  if (status?.hasAiTools) {
    return <>{children}</>;
  }

  return (
    <div style={{ width: "100%", minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <section style={{ width: "100%", maxWidth: 720, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 28, boxShadow: "var(--shadow-lg)" }}>
        <p style={{ color: "var(--orange)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 8px" }}>Pro tool</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text)", margin: "0 0 8px" }}>{title}</h1>
        <p style={{ color: "var(--text-3)", fontSize: 14, lineHeight: 1.6, margin: "0 0 20px" }}>{description}</p>
        {!PRO_PLAN_PUBLICLY_AVAILABLE && (
          <div style={{ background: "var(--orange-dim)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-lg)", padding: "12px 14px", color: "var(--text-2)", fontSize: 13, fontWeight: 800, lineHeight: 1.5, marginBottom: 16 }}>
            {PRO_PLAN_COMING_SOON_MESSAGE}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }} className="pro-gate-grid">
          <div style={statBox}>
            <div style={statLabel}>Current plan</div>
            <div style={statValue}>{status?.planName ?? "TR1"}</div>
          </div>
          <div style={statBox}>
            <div style={statLabel}>Pro AI tokens</div>
            <div style={statValue}>200/mo</div>
          </div>
        </div>

        <ul style={{ margin: "0 0 22px", paddingLeft: 18, color: "var(--text-2)", fontSize: 13, lineHeight: 1.8 }}>
          <li>AI Length Estimator</li>
          <li>AI Mockup Generator access</li>
          <li>200 shared AI usage tokens per month</li>
          <li>GHL white-label connection settings</li>
        </ul>

        <button
          type="button"
          onClick={startProCheckout}
          disabled={checkoutLoading || !PRO_PLAN_PUBLICLY_AVAILABLE}
          style={{
            border: "none",
            borderRadius: "var(--r-md)",
            background: checkoutLoading || !PRO_PLAN_PUBLICLY_AVAILABLE ? "var(--border)" : "var(--orange)",
            color: "#fff",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: 900,
            cursor: checkoutLoading || !PRO_PLAN_PUBLICLY_AVAILABLE ? "not-allowed" : "pointer",
          }}
        >
          {!PRO_PLAN_PUBLICLY_AVAILABLE ? "Upgrade to Pro - coming soon" : checkoutLoading ? "Opening checkout..." : "Upgrade to Pro - $49.99/month"}
        </button>
        <button
          type="button"
          onClick={() => { window.location.href = "/app/billing"; }}
          style={{ marginLeft: 10, border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", color: "var(--text-2)", padding: "11px 14px", fontSize: 14, fontWeight: 900, cursor: "pointer" }}
        >
          View plans
        </button>

        <style jsx>{`
          @media (max-width: 640px) {
            .pro-gate-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </section>
    </div>
  );
}

const statBox: React.CSSProperties = {
  background: "var(--surface-2)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-lg)",
  padding: "12px 14px",
};

const statLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 900,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 5,
};

const statValue: React.CSSProperties = {
  fontFamily: "var(--font-display)",
  fontSize: 24,
  fontWeight: 900,
  color: "var(--text)",
};
