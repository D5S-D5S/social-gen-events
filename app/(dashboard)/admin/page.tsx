"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import AiReferenceLibrary from "@/components/admin/AiReferenceLibrary";

interface Account {
  id: string;
  email: string;
  plan: string;
  is_admin: boolean;
  revenue: number;
  quotes: number;
  joinedAt: string;
  storefront: { slug: string; published: boolean } | null;
}

interface Stats {
  totalUsers: number;
  totalRevenue: number;
  totalQuotes: number;
  recentSignups: number;
  planCounts: Record<string, number>;
  accounts: Account[];
}

const PLAN_COLORS: Record<string, string> = {
  free: "#9CA3AF",
  starter: "#3B82F6",
  pro: "#F05000",
  enterprise: "#7C3AED",
};

const PLANS = ["free", "starter", "pro", "enterprise"];

function fmt(n: number) {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "ai-library">("overview");
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"joined" | "revenue" | "quotes">("joined");
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const tokenRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setAuthenticated(false); return; }
        tokenRef.current = session.access_token;

        const res = await fetch("/api/admin/check", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        if (!data.isAdmin) { setAuthenticated(false); return; }
        setAuthenticated(true);

        const statsRes = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const statsData = await statsRes.json();
        setStats(statsData);
        setLoading(false);
      } catch {
        setAuthenticated(false);
      }
    })();
  }, []);

  async function updateUser(userId: string, updates: { plan?: string; is_admin?: boolean }) {
    const token = tokenRef.current;
    if (!token) return;
    setSaving((prev) => ({ ...prev, [userId]: true }));
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId, ...updates }),
      });
      if (res.ok) {
        setStats((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            accounts: prev.accounts.map((a) =>
              a.id === userId ? { ...a, ...updates } : a
            ),
          };
        });
      }
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  }

  if (authenticated === false) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "70vh" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "32px 36px", width: 360, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: "var(--text)", marginBottom: 8 }}>Access Denied</div>
          <div style={{ fontSize: 13, color: "var(--text-3)" }}>You do not have admin access.</div>
        </div>
      </div>
    );
  }

  if (authenticated === null || loading || !stats) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading platform data…</div>
      </div>
    );
  }

  const filteredAccounts = stats.accounts
    .filter((a) => {
      const matchPlan = planFilter === "all" || a.plan === planFilter;
      const matchSearch = !search || a.email.toLowerCase().includes(search.toLowerCase());
      return matchPlan && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "revenue") return b.revenue - a.revenue;
      if (sortBy === "quotes") return b.quotes - a.quotes;
      return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    });

  const statCards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), sub: `+${stats.recentSignups} last 30 days` },
    { label: "Platform Revenue", value: fmt(stats.totalRevenue), sub: "All time across users" },
    { label: "Total Quotes", value: stats.totalQuotes.toLocaleString(), sub: "Across all accounts" },
    { label: "Paid Accounts", value: ((stats.planCounts.starter ?? 0) + (stats.planCounts.pro ?? 0) + (stats.planCounts.enterprise ?? 0)).toLocaleString(), sub: `${stats.planCounts.pro ?? 0} Pro · ${stats.planCounts.starter ?? 0} Starter` },
  ];

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "var(--orange-dim)", border: "1px solid var(--orange-border)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "var(--orange)", marginBottom: 10 }}>
          Admin Only
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>Platform Overview</h1>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Monitor accounts, usage, and revenue across all BalloonBase users.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
        {(["overview", "users", "ai-library"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "transparent",
              borderBottom: `2px solid ${activeTab === tab ? "var(--orange)" : "transparent"}`,
              color: activeTab === tab ? "var(--orange)" : "var(--text-3)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "capitalize",
              transition: "all 0.15s",
              marginBottom: -1,
            }}
          >
            {tab === "overview" ? "Overview" : tab === "users" ? `Users (${stats.totalUsers})` : "AI Library"}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
            {statCards.map((s) => (
              <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.02em", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-3)" }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Plan distribution */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "18px 20px", boxShadow: "var(--shadow-sm)" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 14 }}>Plan Distribution</div>
            <div style={{ display: "flex", gap: 12 }}>
              {["free", "starter", "pro", "enterprise"].map((plan) => {
                const count = stats.planCounts[plan] ?? 0;
                const total = stats.totalUsers || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={plan} style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: PLAN_COLORS[plan] ?? "#9CA3AF", textTransform: "capitalize" }}>{plan}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{count}</span>
                    </div>
                    <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: PLAN_COLORS[plan] ?? "#9CA3AF", borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          {/* Toolbar */}
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search by email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 180, padding: "7px 12px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, background: "var(--surface-2)", color: "var(--text)", outline: "none" }}
            />
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }}
            >
              <option value="all">All plans</option>
              {PLANS.map((p) => <option key={p} value={p} style={{ textTransform: "capitalize" }}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{ padding: "7px 10px", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, background: "var(--surface-2)", color: "var(--text)", cursor: "pointer" }}
            >
              <option value="joined">Sort: Newest</option>
              <option value="revenue">Sort: Revenue</option>
              <option value="quotes">Sort: Quotes</option>
            </select>
            <span style={{ fontSize: 12, color: "var(--text-3)", flexShrink: 0 }}>{filteredAccounts.length} accounts</span>
          </div>

          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 80px 80px 70px 110px 120px", padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)" }}>
            {["Email", "Plan", "Admin", "Revenue", "Quotes", "Joined", "Actions"].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</div>
            ))}
          </div>

          {/* Rows */}
          <div style={{ maxHeight: 560, overflowY: "auto" }}>
            {filteredAccounts.length === 0 ? (
              <div style={{ padding: "32px 18px", textAlign: "center", fontSize: 13, color: "var(--text-3)" }}>No accounts found.</div>
            ) : (
              filteredAccounts.map((acc) => (
                <div key={acc.id} style={{ display: "grid", gridTemplateColumns: "1fr 130px 80px 80px 70px 110px 120px", padding: "11px 18px", borderBottom: "1px solid var(--border)", alignItems: "center", opacity: saving[acc.id] ? 0.6 : 1, transition: "opacity 0.15s" }}>
                  {/* Email */}
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>
                    {acc.is_admin && <span style={{ display: "inline-block", marginRight: 6, fontSize: 9, fontWeight: 800, background: "#7C3AED20", color: "#7C3AED", padding: "1px 5px", borderRadius: 4, verticalAlign: "middle" }}>ADMIN</span>}
                    {acc.email}
                  </div>

                  {/* Plan dropdown */}
                  <div>
                    <select
                      value={acc.plan}
                      disabled={saving[acc.id]}
                      onChange={(e) => updateUser(acc.id, { plan: e.target.value })}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 700,
                        background: `${PLAN_COLORS[acc.plan] ?? "#9CA3AF"}18`,
                        color: PLAN_COLORS[acc.plan] ?? "#9CA3AF",
                        border: `1px solid ${PLAN_COLORS[acc.plan] ?? "#9CA3AF"}40`,
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      {PLANS.map((p) => (
                        <option key={p} value={p} style={{ background: "#fff", color: "#1a1a1a" }}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Admin toggle */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={acc.is_admin}
                        disabled={saving[acc.id]}
                        onChange={(e) => updateUser(acc.id, { is_admin: e.target.checked })}
                        style={{ accentColor: "#7C3AED", width: 14, height: 14, cursor: "pointer" }}
                      />
                      <span style={{ fontSize: 11, color: "var(--text-3)" }}>Admin</span>
                    </label>
                  </div>

                  {/* Revenue */}
                  <div style={{ fontSize: 13, color: "var(--text)", fontWeight: acc.revenue > 0 ? 600 : 400 }}>{acc.revenue > 0 ? fmt(acc.revenue) : "—"}</div>

                  {/* Quotes */}
                  <div style={{ fontSize: 13, color: "var(--text)" }}>{acc.quotes}</div>

                  {/* Joined */}
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{fmtDate(acc.joinedAt)}</div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    {acc.storefront && (
                      <a
                        href={`/store/${acc.storefront.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "4px 8px",
                          background: acc.storefront.published ? "#ECFDF3" : "var(--surface-2)",
                          border: `1px solid ${acc.storefront.published ? "#A9EFC5" : "var(--border)"}`,
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 600,
                          color: acc.storefront.published ? "#12B76A" : "var(--text-3)",
                          textDecoration: "none",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {acc.storefront.published ? "Live ↗" : "Draft ↗"}
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "ai-library" && <AiReferenceLibrary />}
    </div>
  );
}
