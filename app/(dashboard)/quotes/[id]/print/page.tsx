"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Quote, GlobalSettings } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing/engine";

function fmt(v: number, currency: string) {
  return formatCurrency(v, currency);
}

function formatDate(d: string) {
  if (!d) return "";
  try { return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(d)); }
  catch { return d; }
}

export default function PrintQuotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const printedRef = useRef(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      const [qRes, sRes] = await Promise.all([
        fetch(`/api/quotes/${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
        fetch("/api/settings", { cache: "no-store" }),
      ]);
      if (!qRes.ok) { setError("Quote not found"); setLoading(false); return; }
      const [q, s] = await Promise.all([qRes.json() as Promise<Quote>, sRes.json() as Promise<GlobalSettings>]);
      setQuote(q);
      setSettings(s);
      setLoading(false);
    }
    load();
  }, [id, router]);

  useEffect(() => {
    if (!loading && quote && !printedRef.current) {
      printedRef.current = true;
      setTimeout(() => window.print(), 400);
    }
  }, [loading, quote]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#6B7280" }}>
      Preparing PDF…
    </div>
  );

  if (error || !quote || !settings) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", color: "#EF4444" }}>
      {error || "Could not load quote"}
    </div>
  );

  const { breakdown, input } = quote;
  const currency = settings.currency;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #fff; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .page { max-width: 680px; margin: 0 auto; padding: 48px 40px; }

        /* ── Screen only ── */
        .screen-bar { display: flex; align-items: center; justify-content: space-between; gap: 12; padding: 14px 40px; background: #F9FAFB; border-bottom: 1px solid #E5E7EB; position: sticky; top: 0; z-index: 10; }
        .print-btn { display: inline-flex; align-items: center; gap: 8px; padding: 9px 20px; background: #F05000; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; font-family: 'DM Sans', sans-serif; }
        .back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 16px; background: #fff; color: #374151; border: 1px solid #E5E7EB; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; text-decoration: none; }

        @media print {
          .screen-bar { display: none !important; }
          .page { padding: 32px; max-width: 100%; }
          body { font-size: 13px; }
        }

        /* ── Quote styles ── */
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 2px solid #F05000; }
        .logo { font-family: 'Bricolage Grotesque', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; color: #0D0D0D; }
        .logo span { color: #F05000; }
        .quote-num { font-size: 13px; color: #6B7280; margin-top: 4px; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }

        .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 36px; }
        .meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; margin-bottom: 4px; }
        .meta-value { font-size: 14px; font-weight: 600; color: #111; line-height: 1.4; }
        .meta-sub { font-size: 12px; color: #6B7280; margin-top: 2px; }

        .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .items-table th { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; padding: 0 0 10px; text-align: left; border-bottom: 1px solid #E5E7EB; }
        .items-table th:last-child { text-align: right; }
        .items-table td { padding: 10px 0; font-size: 13.5px; color: #374151; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
        .items-table td:last-child { text-align: right; font-weight: 600; color: #111; white-space: nowrap; }
        .item-sub { font-size: 11px; color: #9CA3AF; margin-top: 2px; }
        .discount-row td { color: #16A34A !important; }

        .totals { margin-top: 16px; display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
        .total-row { display: flex; gap: 40px; font-size: 13px; color: #6B7280; }
        .total-row.grand { font-size: 18px; font-weight: 800; color: #111; padding-top: 10px; border-top: 2px solid #111; margin-top: 4px; }
        .total-row.grand .total-val { color: #F05000; }
        .total-row.deposit { font-weight: 700; color: #111; }
        .total-label { min-width: 160px; text-align: right; }
        .total-val { text-align: right; min-width: 80px; }

        .notes-box { margin-top: 36px; padding: 16px 18px; background: #F9FAFB; border-radius: 10px; border: 1px solid #E5E7EB; }
        .notes-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; margin-bottom: 6px; }
        .notes-text { font-size: 13px; color: #374151; line-height: 1.65; }

        .footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; }
        .footer-left { font-size: 11px; color: #9CA3AF; line-height: 1.6; }
        .footer-right { font-size: 11px; color: #9CA3AF; text-align: right; }

        .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9CA3AF; padding: 14px 0 6px; }
      `}</style>

      {/* Screen bar */}
      <div className="screen-bar">
        <a href={`/app/quotes/${id}`} className="back-btn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
        </a>
        <button className="print-btn" onClick={() => window.print()}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          Save as PDF
        </button>
      </div>

      <div className="page">
        {/* Header */}
        <div className="header">
          <div>
            <div className="logo">Balloon<span>Base</span></div>
            <div className="quote-num">Quote {quote.number}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 4 }}>Issued</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
              {formatDate(quote.createdAt?.split("T")[0] ?? "")}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge" style={{
                background: quote.status === "paid" ? "#DCFCE7" : quote.status === "won" ? "#ECFDF5" : quote.status === "sent" ? "#DBEAFE" : "#F3F4F6",
                color: quote.status === "paid" ? "#15803D" : quote.status === "won" ? "#065F46" : quote.status === "sent" ? "#1D4ED8" : "#6B7280",
              }}>
                {quote.status}
              </span>
            </div>
          </div>
        </div>

        {/* Client + Event info */}
        <div className="meta-grid">
          <div>
            <div className="meta-label">Client</div>
            <div className="meta-value">{input.clientName || "—"}</div>
            {input.clientEmail && <div className="meta-sub">{input.clientEmail}</div>}
          </div>
          {input.eventDate && (
            <div>
              <div className="meta-label">Event date</div>
              <div className="meta-value">{formatDate(input.eventDate)}</div>
              {input.eventLocation && <div className="meta-sub">{input.eventLocation}</div>}
            </div>
          )}
        </div>

        {/* Line items */}
        <table className="items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {/* Base */}
            <tr>
              <td>
                <div>{breakdown.tierName}</div>
                <div className="item-sub">{breakdown.length}{breakdown.unit} @ {fmt(breakdown.basePrice / breakdown.length, currency)}/{breakdown.unit}</div>
              </td>
              <td>{fmt(breakdown.basePrice, currency)}</td>
            </tr>

            {/* Add-ons */}
            {breakdown.addons.length > 0 && (
              <tr><td colSpan={2}><div className="section-label">Add-ons</div></td></tr>
            )}
            {breakdown.addons.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{fmt(a.price, currency)}</td>
              </tr>
            ))}

            {/* Fees */}
            {breakdown.fees.length > 0 && (
              <tr><td colSpan={2}><div className="section-label">Additional fees</div></td></tr>
            )}
            {breakdown.fees.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{fmt(f.amount, currency)}</td>
              </tr>
            ))}

            {/* Discounts */}
            {breakdown.discounts.length > 0 && (
              <tr><td colSpan={2}><div className="section-label">Discounts</div></td></tr>
            )}
            {breakdown.discounts.map((d) => (
              <tr key={d.id} className="discount-row">
                <td>{d.name}</td>
                <td>−{fmt(d.amount, currency)}</td>
              </tr>
            ))}

            {/* Delivery */}
            {breakdown.deliveryFee !== null && breakdown.deliveryFee > 0 && (
              <tr>
                <td>Delivery</td>
                <td>{fmt(breakdown.deliveryFee, currency)}</td>
              </tr>
            )}

            {/* Platform fee */}
            {breakdown.platformFeeVisible && breakdown.platformFeeAmount > 0 && (
              <tr>
                <td style={{ color: "#9CA3AF", fontSize: 12 }}>{breakdown.platformFeeLabel}</td>
                <td style={{ color: "#9CA3AF" }}>{fmt(breakdown.platformFeeAmount, currency)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div className="totals">
          <div className="total-row grand">
            <span className="total-label">Subtotal</span>
            <span className="total-val">{fmt(breakdown.subtotal, currency)}</span>
          </div>
        </div>

        {/* Notes */}
        {input.notes && (
          <div className="notes-box">
            <div className="notes-label">Notes</div>
            <div className="notes-text">{input.notes}</div>
          </div>
        )}

        {/* Footer */}
        <div className="footer">
          <div className="footer-left">
            Generated by BalloonBase<br />
            Valid for 30 days from issue date
          </div>
          <div className="footer-right">
            {quote.number}<br />
            {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </>
  );
}
