"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Sidebar from "@/components/Sidebar";
import { isAdminEmail } from "@/lib/admin";
import BrandLogo from "@/components/BrandLogo";
import { PLAN_DEFINITIONS, formatPlanPrice } from "@/lib/plans";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }

      const isAdmin = isAdminEmail(session.user.email);

      if (isAdmin) { setSubscribed(true); setChecking(false); return; }

      // Check subscription status
      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, stripe_subscription_id")
        .eq("id", session.user.id)
        .single();

      const hasSub = ["tier_1", "pro", "enterprise"].includes(profile?.plan ?? "") || !!profile?.stripe_subscription_id;
      setSubscribed(hasSub);
      setChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.replace("/login");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <BrandLogo compact />
          <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!subscribed) {
    return <PaywallPage />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />
      <main style={{ flex: 1, width: "100%", minWidth: 0, overflowY: "auto", padding: "28px 32px", boxSizing: "border-box" }}>
        {children}
      </main>
    </div>
  );
}

function PaywallPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (plan: "tier_1" | "pro") => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const res = await fetch("/api/stripe/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, email: session.user.email, plan }),
      });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url) { window.location.href = json.url; }
      else { setError(json.error ?? "Something went wrong"); setLoading(false); }
    } catch {
      setError("Failed to start checkout");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 40 }}>
          <BrandLogo />
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "36px 32px", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>Subscription Required</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text)", margin: "0 0 10px", fontFamily: "var(--font-display)" }}>Choose your BalloonBase plan.</h1>
          <p style={{ fontSize: 14, color: "var(--text-3)", margin: "0 0 28px", lineHeight: 1.6 }}>
            Start with core quoting on Tier 1, or unlock AI tools and 200 monthly AI usage tokens on Pro.
          </p>

          <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
            <PlanCard plan="tier_1" loading={loading} onSelect={handleSubscribe} />
            <PlanCard plan="pro" loading={loading} onSelect={handleSubscribe} featured />
          </div>

          {error && (
            <div style={{ background: "var(--red-dim)", border: "1px solid var(--red-border)", borderRadius: "var(--r-md)", padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "var(--red)" }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogout}
            style={{ width: "100%", padding: "10px", background: "none", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  loading,
  featured,
  onSelect,
}: {
  plan: "tier_1" | "pro";
  loading: boolean;
  featured?: boolean;
  onSelect: (plan: "tier_1" | "pro") => void;
}) {
  const item = PLAN_DEFINITIONS[plan];
  return (
    <div style={{ background: featured ? "var(--orange-dim)" : "var(--surface-2)", border: featured ? "1.5px solid var(--orange)" : "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "16px 18px", textAlign: "left" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{item.displayName}</div>
          <div style={{ fontSize: 30, fontWeight: 900, color: "var(--text)", fontFamily: "var(--font-display)", marginTop: 4 }}>
            {formatPlanPrice(item.monthlyAmount)}<span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-3)" }}>/month</span>
          </div>
        </div>
        {featured && <span style={{ fontSize: 10, fontWeight: 900, color: "var(--orange)", border: "1px solid var(--orange-border)", borderRadius: 99, padding: "3px 7px", background: "var(--surface)" }}>PRO</span>}
      </div>
      <p style={{ margin: "0 0 10px", color: "var(--text-3)", fontSize: 12, lineHeight: 1.45 }}>{item.description}</p>
      <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, marginBottom: 12 }}>
        {item.features.slice(0, 3).map((feature) => <div key={feature}>- {feature}</div>)}
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => onSelect(plan)}
        style={{ width: "100%", border: "none", borderRadius: "var(--r-md)", padding: "10px 12px", background: loading ? "var(--text-3)" : featured ? "var(--orange)" : "var(--text)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Starting..." : `Start ${item.displayName}`}
      </button>
    </div>
  );
}
