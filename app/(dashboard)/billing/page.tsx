"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PLAN_DEFINITIONS, PRO_PLAN_COMING_SOON_MESSAGE, PRO_PLAN_PUBLICLY_AVAILABLE, formatPlanPrice } from "@/lib/plans";

type BillingStatus = {
  plan: string;
  planName: string;
  planDisplayName?: string;
  hasSubscription: boolean;
  hasAiTools: boolean;
  aiTokensIncluded: number;
  aiTokensUsed: number;
  aiTokensRemaining: number;
  resetMonth?: string;
  trialEligible?: boolean;
};

type Invoice = {
  id: string;
  number: string | null;
  status: string | null;
  currency: string;
  amountPaid: number;
  amountDue: number;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

export default function BillingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadBilling().catch(() => setLoading(false));
  }, []);

  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.replace("/login");
    return session;
  }

  async function loadBilling() {
    const session = await getSession();
    if (!session) return;

    const [statusRes, invoicesRes] = await Promise.all([
      fetch("/api/billing/status", { headers: { Authorization: `Bearer ${session.access_token}` } }),
      fetch("/api/billing/invoices", { headers: { Authorization: `Bearer ${session.access_token}` } }),
    ]);

    if (statusRes.ok) setStatus(await statusRes.json());
    if (invoicesRes.ok) {
      const data = await invoicesRes.json();
      setInvoices(data.invoices ?? []);
    }
    setLoading(false);
  }

  async function startCheckout(plan: "tier_1" | "pro" | "enterprise") {
    if (plan === "enterprise") {
      setToast("Studio plan is coming soon. Use Pro while the higher-volume AI tools are being finalized.");
      return;
    }

    if (plan === "pro" && !PRO_PLAN_PUBLICLY_AVAILABLE) {
      setToast(PRO_PLAN_COMING_SOON_MESSAGE);
      return;
    }

    setCheckoutLoading(plan);
    const session = await getSession();
    if (!session?.user) return;

    const res = await fetch("/api/stripe/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id, email: session.user.email, plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      setToast(data.error ?? "Could not open checkout");
      setCheckoutLoading(null);
    }
  }

  async function manageBilling() {
    setPortalLoading(true);
    const session = await getSession();
    if (!session?.user) return;
    const res = await fetch("/api/stripe/customer-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: session.user.id }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else {
      setToast(data.error ?? "Could not open Stripe billing portal");
      setPortalLoading(false);
    }
  }

  if (loading) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading billing...</div>;

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={eyebrow}>Billing</p>
          <h1 style={title}>Plan & Billing</h1>
          <p style={subtitle}>View the current plan, AI usage, invoices, and Stripe billing portal.</p>
        </div>
        <button onClick={manageBilling} disabled={portalLoading} style={secondaryButton}>{portalLoading ? "Opening..." : "Manage in Stripe"}</button>
      </div>

      <section style={section}>
        <h2 style={sectionTitle}>Current Plan</h2>
        <div className="billing-grid">
          <UsageBox label="Plan" value={status?.planName ?? "Starter"} accent />
          <UsageBox label="Subscription" value={status?.hasSubscription ? "Active" : "Not active"} />
          <UsageBox label="AI tools" value={status?.hasAiTools ? "Included" : "Pro only"} />
          <UsageBox label="AI tokens remaining" value={`${status?.aiTokensRemaining ?? 0}/${status?.aiTokensIncluded ?? 0}`} />
        </div>
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Plans</h2>
        <div className="plans-grid">
          <PlanCard plan="tier_1" current={status?.plan === "tier_1" || status?.plan === "tr1"} loading={checkoutLoading === "tier_1"} onSelect={startCheckout} />
          <PlanCard plan="pro" current={status?.plan === "pro"} loading={checkoutLoading === "pro"} onSelect={startCheckout} featured available={PRO_PLAN_PUBLICLY_AVAILABLE} />
          <PlanCard plan="enterprise" current={status?.plan === "enterprise"} loading={checkoutLoading === "enterprise"} onSelect={startCheckout} available={false} />
        </div>
      </section>

      <section style={section}>
        <h2 style={sectionTitle}>Invoices</h2>
        {invoices.length === 0 ? (
          <p style={subtitle}>No Stripe invoices found yet. Once a checkout subscription is created, invoices will appear here.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
                  <th style={th}>Invoice</th>
                  <th style={th}>Date</th>
                  <th style={th}>Status</th>
                  <th style={th}>Amount</th>
                  <th style={th}>Links</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={td}>{invoice.number ?? invoice.id}</td>
                    <td style={td}>{new Date(invoice.created * 1000).toLocaleDateString()}</td>
                    <td style={td}>{invoice.status ?? "-"}</td>
                    <td style={td}>{new Intl.NumberFormat("en-US", { style: "currency", currency: invoice.currency.toUpperCase() }).format((invoice.amountPaid || invoice.amountDue) / 100)}</td>
                    <td style={td}>
                      {invoice.hostedInvoiceUrl && <a href={invoice.hostedInvoiceUrl} target="_blank" style={linkStyle}>View</a>}
                      {invoice.invoicePdf && <a href={invoice.invoicePdf} target="_blank" style={{ ...linkStyle, marginLeft: 10 }}>PDF</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style jsx>{`
        .billing-grid,
        .plans-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .plans-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        @media (max-width: 900px) {
          .billing-grid,
          .plans-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 620px) {
          .billing-grid,
          .plans-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function UsageBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: accent ? "var(--orange-dim)" : "var(--surface-2)", padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 900, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: accent ? "var(--orange)" : "var(--text)" }}>{value}</div>
    </div>
  );
}

function PlanCard({ plan, current, featured, loading, onSelect, available = true }: { plan: "tier_1" | "pro" | "enterprise"; current?: boolean; featured?: boolean; loading: boolean; available?: boolean; onSelect: (plan: "tier_1" | "pro" | "enterprise") => void }) {
  const item = PLAN_DEFINITIONS[plan];
  const disabled = current || loading || !available;
  return (
    <div style={{ border: featured ? "1.5px solid var(--orange)" : "1px solid var(--border)", borderRadius: "var(--r-xl)", background: featured ? "var(--orange-dim)" : "var(--surface-2)", padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{item.displayName}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 900, color: "var(--text)", marginTop: 4 }}>{formatPlanPrice(item.monthlyAmount)}<span style={{ fontSize: 14, color: "var(--text-3)" }}>/mo</span></div>
        </div>
        {current && <span style={{ fontSize: 10, fontWeight: 900, color: "var(--orange)", border: "1px solid var(--orange-border)", borderRadius: 99, padding: "3px 7px", background: "var(--surface)" }}>CURRENT</span>}
        {!current && !available && <span style={{ fontSize: 10, fontWeight: 900, color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: 99, padding: "3px 7px", background: "var(--surface)" }}>COMING SOON</span>}
      </div>
      <p style={{ margin: "0 0 12px", color: "var(--text-3)", fontSize: 13, lineHeight: 1.5 }}>{item.description}</p>
      <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
        {item.features.map((feature) => <div key={feature} style={{ color: "var(--text-2)", fontSize: 13 }}>- {feature}</div>)}
      </div>
      <button onClick={() => onSelect(plan)} disabled={disabled} style={{ width: "100%", border: "none", borderRadius: "var(--r-md)", padding: "11px 14px", background: disabled ? "var(--border)" : featured ? "var(--orange)" : "var(--text)", color: "#fff", fontSize: 13, fontWeight: 900, cursor: disabled ? "not-allowed" : "pointer" }}>
        {current ? "Current plan" : !available ? "Coming soon" : loading ? "Opening..." : `Choose ${item.displayName}`}
      </button>
    </div>
  );
}

const eyebrow: React.CSSProperties = { color: "var(--orange)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" };
const title: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 28, margin: 0, color: "var(--text)" };
const subtitle: React.CSSProperties = { color: "var(--text-3)", fontSize: 13, lineHeight: 1.55, margin: "6px 0 0" };
const section: React.CSSProperties = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 22, boxShadow: "var(--shadow-sm)", marginBottom: 16 };
const sectionTitle: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", margin: "0 0 16px" };
const secondaryButton: React.CSSProperties = { border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", color: "var(--text-2)", padding: "10px 14px", fontSize: 13, fontWeight: 900, cursor: "pointer" };
const toastStyle: React.CSSProperties = { position: "fixed", top: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "var(--text)", boxShadow: "var(--shadow-xl)", zIndex: 999 };
const th: React.CSSProperties = { padding: "10px 8px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em" };
const td: React.CSSProperties = { padding: "12px 8px", color: "var(--text-2)" };
const linkStyle: React.CSSProperties = { color: "var(--orange)", fontWeight: 800, textDecoration: "none" };
