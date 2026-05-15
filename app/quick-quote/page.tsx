"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GlobalSettings, QuoteInput, QuoteBreakdown as QBT, Unit } from "@/lib/types";
import { calculateBreakdown } from "@/lib/pricing/engine";
import TierSelector from "@/components/quote/TierSelector";
import LengthInput from "@/components/quote/LengthInput";
import QuoteBreakdown from "@/components/quote/QuoteBreakdown";

const DEFAULT: QuoteInput = {
  clientName: "", clientEmail: "", eventDate: "", eventLocation: "",
  tierId: "", length: 20, unit: "ft", selectedAddonIds: [],
  lineItems: [], deliveryMode: "none", flatDeliveryFee: 0,
};

const S: React.CSSProperties = {
  background: "#fff",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-xl)",
  padding: "20px 22px",
  marginBottom: 12,
  boxShadow: "var(--shadow-sm)",
};

export default function QuickQuotePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [input, setInput]       = useState<QuoteInput>(DEFAULT);
  const [breakdown, setBreakdown] = useState<QBT | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: GlobalSettings) => {
        setSettings(data);
        const first = data.tiers.find((t) => t.active);
        setInput((p) => ({ ...p, tierId: first?.id ?? "", unit: data.defaultUnit }));
      })
      .catch(() => setLoadError("Failed to load settings. Please refresh."));
  }, []);

  useEffect(() => {
    if (!settings || !input.tierId) { setBreakdown(null); return; }
    try { setBreakdown(calculateBreakdown(input, settings)); }
    catch { setBreakdown(null); }
  }, [input, settings]);

  const upd = (u: Partial<QuoteInput>) => setInput((p) => ({ ...p, ...u }));

  const handleBuildFullQuote = () => {
    const params = new URLSearchParams({
      tierId: input.tierId,
      length: String(input.length),
      unit: input.unit,
    });
    router.push(`/quotes/new?${params.toString()}`);
  };

  if (loadError) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--red)", fontSize: 14 }}>{loadError}</div>
    </div>
  );

  if (!settings) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "var(--text-3)", fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (settings.tiers.length === 0) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "32px 28px", maxWidth: 400, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>No pricing tiers configured</div>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20, lineHeight: 1.6 }}>
          {isLoggedIn
            ? "Set up pricing tiers in Admin Settings before generating quotes."
            : "A signed-in admin needs to set up pricing tiers before quotes can be generated."}
        </p>
        <Link
          href={isLoggedIn ? "/admin" : "/login"}
          style={{ display: "inline-block", padding: "9px 18px", background: "var(--orange)", color: "#fff", borderRadius: "var(--r-md)", fontWeight: 600, fontSize: 13, textDecoration: "none" }}
        >
          {isLoggedIn ? "Go to Admin Settings" : "Sign in to configure"}
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "#fff", padding: "0 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 26, height: 26, background: "var(--orange)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", boxShadow: "0 1px 4px rgba(240,80,0,0.3)" }}>
              B
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              BalloonBase
            </span>
          </div>
          {isLoggedIn ? (
            <Link href="/dashboard" style={{ padding: "7px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-2)", fontSize: 12, fontWeight: 600, background: "#fff", boxShadow: "var(--shadow-xs)" }}>
              Dashboard
            </Link>
          ) : (
            <Link href="/login" style={{ padding: "7px 14px", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", color: "var(--text-2)", fontSize: 12, fontWeight: 600, background: "#fff", boxShadow: "var(--shadow-xs)" }}>
              Sign in
            </Link>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 32px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "var(--orange-dim)", border: "1px solid var(--orange-border)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "var(--orange)", marginBottom: 12 }}>
            Instant Pricing
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Quick Quote
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-3)" }}>
            Instant estimate for your balloon installation — no signup required.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
          <div>
            <div style={S}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Select a Tier</p>
              <TierSelector tiers={settings.tiers} selectedId={input.tierId} unit={input.unit} onChange={(id) => upd({ tierId: id })} />
            </div>
            <div style={S}>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Length</p>
              <LengthInput length={input.length} unit={input.unit} tierId={input.tierId} tiers={settings.tiers} onLengthChange={(length) => upd({ length })} onUnitChange={(unit: Unit) => upd({ unit })} />
            </div>
          </div>

          <div style={{ position: "sticky", top: 24 }}>
            {breakdown ? (
              <QuoteBreakdown breakdown={breakdown} currency={settings.currency} mode="compact" />
            ) : (
              <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "32px 24px", textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 24, marginBottom: 10, opacity: 0.2 }}>◻</div>
                <p style={{ fontSize: 13, color: "var(--text-3)" }}>Select a tier and length to see your quote.</p>
              </div>
            )}

            <div style={{ marginTop: 12, background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 18, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
              {isLoggedIn ? (
                <>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.6 }}>
                    Ready to send this to a client? Build a full quote with their details.
                  </p>
                  <button
                    onClick={handleBuildFullQuote}
                    style={{ display: "block", width: "100%", padding: "10px 16px", background: "var(--orange)", color: "#fff", borderRadius: "var(--r-md)", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", boxShadow: "0 1px 4px rgba(240,80,0,0.3)", marginBottom: 8 }}
                  >
                    Build Full Quote
                  </button>
                  <Link href="/dashboard" style={{ display: "block", padding: "9px 16px", background: "var(--surface-2)", color: "var(--text-2)", borderRadius: "var(--r-md)", fontWeight: 600, fontSize: 12, border: "1px solid var(--border)", textDecoration: "none" }}>
                    Back to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12, lineHeight: 1.6 }}>
                    Want to save this quote and manage your business?
                  </p>
                  <Link href="/login" style={{ display: "block", padding: "10px 16px", background: "var(--orange)", color: "#fff", borderRadius: "var(--r-md)", fontWeight: 600, fontSize: 13, textDecoration: "none", boxShadow: "0 1px 4px rgba(240,80,0,0.3)" }}>
                    Sign in to continue
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
