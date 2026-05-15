"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Quote, QuoteStatus } from "@/lib/types";
import Link from "next/link";

const STATUSES: QuoteStatus[] = ["draft", "sent", "won", "paid", "lost", "cancelled"];

const STATUS: Record<QuoteStatus, { bg: string; color: string; border: string; dot: string }> = {
  draft:     { bg: "#F2F4F7", color: "#667085", border: "#E4E7EC", dot: "#98A2B3" },
  sent:      { bg: "var(--blue-dim)",  color: "var(--blue)",  border: "var(--blue-border)",  dot: "var(--blue)" },
  won:       { bg: "var(--green-dim)", color: "var(--green)", border: "var(--green-border)", dot: "var(--green)" },
  paid:      { bg: "var(--green-dim)", color: "var(--green)", border: "var(--green-border)", dot: "var(--green)" },
  lost:      { bg: "var(--red-dim)",   color: "var(--red)",   border: "var(--red-border)",   dot: "var(--red)" },
  cancelled: { bg: "var(--red-dim)",   color: "var(--red)",   border: "var(--red-border)",   dot: "var(--red)" },
};

const fmt = (n: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(n);
const fmtDate = (s: string) => { if (!s) return ""; try { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(s)); } catch { return s; } };

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes]           = useState<Quote[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [statusMenu, setStatusMenu]   = useState<string | null>(null);
  const [toast, setToast]             = useState<string | null>(null);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | QuoteStatus>("all");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const res = await fetch("/api/quotes", { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (!res.ok) { setError("Failed to load quotes."); setLoading(false); return; }
      setQuotes((await res.json()) as Quote[]);
      setLoading(false);
    }
    load();
  }, [router]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  async function handleStatusChange(id: string, status: QuoteStatus) {
    setStatusMenu(null);
    setQuotes((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch(`/api/quotes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ status }) });
    showToast(`Status updated to ${status}`);
  }

  async function handleDelete(quote: Quote) {
    if (!confirm(`Delete quote ${quote.number}? This cannot be undone.`)) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setQuotes((prev) => prev.filter((q) => q.id !== quote.id));
    await fetch(`/api/quotes/${quote.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } });
    showToast("Quote deleted");
  }

  const filtered = quotes.filter((q) => {
    const ms = search === "" || q.input.clientName.toLowerCase().includes(search.toLowerCase()) || q.number.toLowerCase().includes(search.toLowerCase());
    return ms && (filterStatus === "all" || q.status === filterStatus);
  });

  const totalValue = filtered.reduce((s, q) => s + (q.breakdown.subtotal ?? q.breakdown.total), 0);

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Quotes
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 13 }}>
            {quotes.length} total &middot; <span style={{ color: "var(--orange)", fontWeight: 600 }}>{fmt(totalValue)}</span> showing
          </p>
        </div>
        <Link
          href="/app/detailed-quote"
          style={{
            padding: "9px 16px",
            background: "var(--orange)",
            color: "#fff",
            borderRadius: "var(--r-md)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            boxShadow: "0 1px 4px rgba(240,80,0,0.3)",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          + New Quote
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center", flexWrap: "wrap" }}>
        <input
          placeholder="Search client or quote #…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "7px 12px",
            borderRadius: "var(--r-md)",
            border: "1.5px solid var(--border)",
            fontSize: 13,
            outline: "none",
            background: "var(--surface)",
            color: "var(--text)",
            width: 240,
            boxShadow: "var(--shadow-xs)",
            fontFamily: "var(--font-ui)",
          }}
        />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(["all", ...STATUSES] as const).map((s) => {
            const active = filterStatus === s;
            const st = s !== "all" ? STATUS[s] : null;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s as "all" | QuoteStatus)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                  border: `1.5px solid ${active ? (st?.border ?? "var(--orange-border)") : "var(--border)"}`,
                  background: active ? (st?.bg ?? "var(--orange-dim)") : "var(--surface)",
                  color: active ? (st?.color ?? "var(--orange)") : "var(--text-3)",
                  fontFamily: "var(--font-ui)",
                  transition: "all 0.12s",
                  boxShadow: "var(--shadow-xs)",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ fontSize: 13, color: "var(--red)", padding: "10px 14px", background: "var(--red-dim)", borderRadius: "var(--r-md)", border: "1px solid var(--red-border)", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bb-skeleton" style={{ height: 52, borderRadius: "var(--r-lg)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 56, textAlign: "center", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6, fontFamily: "var(--font-display)" }}>
            {quotes.length === 0 ? "No quotes yet" : "No results"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>
            {quotes.length === 0 ? "Create your first quote to get started." : "Try adjusting your search or filter."}
          </div>
          {quotes.length === 0 && (
            <Link href="/app/detailed-quote" style={{ display: "inline-flex", padding: "9px 18px", background: "var(--orange)", color: "#fff", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600 }}>
              Create First Quote
            </Link>
          )}
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Quote #", "Client", "Event Date", "Subtotal", "Status", ""].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "10px 16px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      background: "var(--surface-2)",
                      borderBottom: "1px solid var(--border)",
                      fontFamily: "var(--font-ui)",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((quote, idx) => {
                const st = STATUS[quote.status] ?? STATUS.draft;
                return (
                  <tr
                    key={quote.id}
                    style={{ borderBottom: idx < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <Link href={`/app/quotes/${quote.id}`} style={{ fontSize: 13, fontWeight: 700, color: "var(--orange)", fontFamily: "var(--font-display)" }}>
                        {quote.number}
                      </Link>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{quote.input.clientName}</div>
                      {quote.input.clientEmail && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{quote.input.clientEmail}</div>}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-2)" }}>
                      {quote.input.eventDate ? fmtDate(quote.input.eventDate) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)" }}>
                      {fmt(quote.breakdown.subtotal ?? quote.breakdown.total)}
                    </td>
                    <td style={{ padding: "12px 16px", position: "relative" }}>
                      <button
                        onClick={() => setStatusMenu(statusMenu === quote.id ? null : quote.id)}
                        style={{
                          padding: "3px 10px 3px 8px",
                          borderRadius: 99,
                          border: `1.5px solid ${st.border}`,
                          background: st.bg,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          textTransform: "capitalize",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontFamily: "var(--font-ui)",
                        }}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: st.dot, flexShrink: 0 }} />
                        {quote.status} ▾
                      </button>
                      {statusMenu === quote.id && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 16,
                            zIndex: 50,
                            background: "var(--surface)",
                            border: "1.5px solid var(--border)",
                            borderRadius: "var(--r-lg)",
                            boxShadow: "var(--shadow-xl)",
                            minWidth: 150,
                            overflow: "hidden",
                            padding: 4,
                          }}
                        >
                          {STATUSES.map((s) => {
                            const ss = STATUS[s];
                            return (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(quote.id, s)}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 8,
                                  width: "100%",
                                  padding: "8px 10px",
                                  border: "none",
                                  borderRadius: "var(--r-sm)",
                                  background: quote.status === s ? "var(--hover)" : "transparent",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  color: ss.color,
                                  textTransform: "capitalize",
                                  fontFamily: "var(--font-ui)",
                                }}
                              >
                                <span style={{ width: 6, height: 6, borderRadius: "50%", background: ss.dot }} />
                                {s}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Link
                          href={`/app/quotes/${quote.id}`}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "var(--r-sm)",
                            border: "1.5px solid var(--border)",
                            background: "var(--surface)",
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--text-2)",
                            textDecoration: "none",
                            boxShadow: "var(--shadow-xs)",
                          }}
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDelete(quote)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "var(--r-sm)",
                            border: "1.5px solid var(--red-border)",
                            background: "var(--red-dim)",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            color: "var(--red)",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {statusMenu && <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setStatusMenu(null)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--text)", color: "#fff", borderRadius: "var(--r-lg)", padding: "12px 18px", fontSize: 13, fontWeight: 600, zIndex: 300, boxShadow: "var(--shadow-xl)", animation: "fadeUp 0.2s ease forwards" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
