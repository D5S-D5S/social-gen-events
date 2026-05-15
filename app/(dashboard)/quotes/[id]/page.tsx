"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Quote, QuoteStatus, GlobalSettings } from "@/lib/types";
import QuoteBreakdown from "@/components/quote/QuoteBreakdown";
import { formatCurrency } from "@/lib/pricing/engine";

const STATUS_OPTIONS: QuoteStatus[] = [
  "draft",
  "sent",
  "won",
  "paid",
  "lost",
  "cancelled",
];

const statusColors: Record<QuoteStatus, string> = {
  draft: "#9A8070",
  sent: "#2980b9",
  won: "#27ae60",
  paid: "#1abc9c",
  lost: "#c0392b",
  cancelled: "#7f8c8d",
};

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function buildTextSummary(quote: Quote, currency: string): string {
  const { breakdown, input } = quote;
  const fmt = (v: number) => formatCurrency(v, currency);
  const lines: string[] = [
    `QUOTE ${quote.number}`,
    `Client: ${input.clientName}`,
    input.clientEmail ? `Email: ${input.clientEmail}` : "",
    input.eventDate ? `Event date: ${formatDate(input.eventDate)}` : "",
    input.eventLocation ? `Location: ${input.eventLocation}` : "",
    "",
    `${breakdown.tierName} — ${breakdown.length}${breakdown.unit}: ${fmt(breakdown.basePrice)}`,
  ];

  if (breakdown.addons.length > 0) {
    lines.push("");
    lines.push("Add-ons:");
    for (const addon of breakdown.addons) {
      lines.push(`  ${addon.name}: ${fmt(addon.price)}`);
    }
  }

  if (breakdown.fees.length > 0) {
    lines.push("");
    lines.push("Fees:");
    for (const fee of breakdown.fees) {
      lines.push(`  ${fee.name}: ${fmt(fee.amount)}`);
    }
  }

  if (breakdown.discounts.length > 0) {
    lines.push("");
    lines.push("Discounts:");
    for (const disc of breakdown.discounts) {
      lines.push(`  ${disc.name}: -${fmt(disc.amount)}`);
    }
  }

  lines.push("");
  if (breakdown.deliveryFee !== null) {
    lines.push(
      breakdown.deliveryFee === 0
        ? "Delivery: Included"
        : `Delivery: ${fmt(breakdown.deliveryFee)}`
    );
  } else {
    lines.push("Delivery: TBC");
  }

  if (breakdown.platformFeeVisible && breakdown.platformFeeAmount > 0) {
    lines.push(
      `${breakdown.platformFeeLabel}: ${fmt(breakdown.platformFeeAmount)}`
    );
  }

  lines.push(`TOTAL: ${fmt(breakdown.total)}`);
  lines.push(
    `Deposit (${breakdown.depositPercent}%): ${fmt(breakdown.depositAmount)}`
  );

  return lines.filter(Boolean).join("\n");
}

function buildMvpTextSummary(quote: Quote, currency: string): string {
  const { breakdown, input } = quote;
  const fmt = (value: number) => formatCurrency(value, currency);
  return [
    `QUOTE ${quote.number}`,
    `Client: ${input.clientName}`,
    input.clientPhone ? `Phone: ${input.clientPhone}` : "",
    input.clientEmail ? `Email: ${input.clientEmail}` : "",
    input.eventType ? `Event type: ${input.eventType}` : "",
    input.eventDate ? `Event date: ${formatDate(input.eventDate)}` : "",
    input.eventLocation ? `Location: ${input.eventLocation}` : "",
    "",
    breakdown.packageName ? `Package: ${breakdown.packageName}` : "",
    `Tier: ${breakdown.tierName}`,
    `Garland length: ${breakdown.length}${breakdown.unit}`,
    "",
    `Package price: ${fmt(breakdown.packagePrice ?? 0)}`,
    `Extra garland: ${fmt(breakdown.extraGarlandPrice ?? breakdown.basePrice)}`,
    `Add-ons: ${fmt(breakdown.addonsTotal)}`,
    `Inventory/catalog items: ${fmt(breakdown.inventoryTotal ?? 0)}`,
    `Manual items: ${fmt(breakdown.manualItemsTotal ?? 0)}`,
    `Delivery fee: ${fmt(breakdown.deliveryFee ?? 0)}`,
    `Setup fee: ${fmt(breakdown.setupFee ?? 0)}`,
    `Labour fee: ${fmt(breakdown.labourFee ?? 0)}`,
    `Takedown fee: ${fmt(breakdown.takedownFee ?? 0)}`,
    `Discount: -${fmt(breakdown.discountAmount ?? 0)}`,
    `Tax: ${fmt(breakdown.taxAmount ?? 0)}`,
    "",
    `SUBTOTAL: ${fmt(breakdown.subtotal)}`,
  ].filter(Boolean).join("\n");
}

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currency, setCurrency] = useState("GBP");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return;
      }

      const response = await fetch(`/api/quotes/${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        setError("Quote not found.");
        setLoading(false);
        return;
      }

      const data = (await response.json()) as Quote;
      setQuote(data);

      // Load settings
      fetch("/api/settings", { cache: "no-store" })
        .then((r) => r.json())
        .then((s: GlobalSettings) => { setCurrency(s.currency); setSettings(s); })
        .catch(() => {});

      setLoading(false);
    }
    load();
  }, [id, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleStatusChange(newStatus: QuoteStatus) {
    if (!quote) return;
    setStatusUpdating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/quotes/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updated = (await response.json()) as Quote;
        setQuote(updated);
      }
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleCopyText() {
    if (!quote) return;
    const text = buildMvpTextSummary(quote, currency);
    try {
      await navigator.clipboard.writeText(text);
      showToast("Quote summary copied to clipboard");
    } catch {
      showToast("Could not copy to clipboard");
    }
  }

  async function handleSendEmail() {
    if (!quote || !settings) return;
    if (!quote.input.clientEmail) {
      showToast("No client email — edit the quote first");
      return;
    }
    setSendingEmail(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch("/api/email/send-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ quote, settings }),
      });
      if (res.ok) {
        showToast(`Quote emailed to ${quote.input.clientEmail}`);
        handleStatusChange("sent");
      } else {
        const err = await res.json();
        showToast(`Failed: ${err.error ?? "Unknown error"}`);
      }
    } finally {
      setSendingEmail(false);
    }
  }

  async function handleShareLink() {
    if (!quote) return;
    const url = `${window.location.origin}/q/${quote.publicId}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Share link copied to clipboard");
    } catch {
      showToast("Could not copy link");
    }
  }

  function handlePrint() {
    window.open(`/app/quotes/${id}/print`, "_blank");
  }

  async function handleDuplicate() {
    if (!quote) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...quote.input,
          clientName: quote.input.clientName ? `${quote.input.clientName} copy` : "",
        }),
      });
      if (!response.ok) throw new Error("Could not duplicate quote");
      const duplicate = (await response.json()) as Quote;
      router.push(`/app/quotes/${duplicate.id}/edit`);
    } catch {
      showToast("Could not duplicate quote");
    }
  }

  async function handleDelete() {
    if (!quote) return;
    setDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/quotes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        router.push("/app/quotes");
      }
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <div style={{ color: "#9A8070", fontSize: 14, fontWeight: 600 }}>
          Loading...
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div style={{ padding: 32 }}>
        <div style={{ color: "#c0392b", fontSize: 14 }}>
          {error ?? "Quote not found."}
        </div>
      </div>
    );
  }

  return (
    <>
      <style media="print">{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#1A1208",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 1000,
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}
        >
          {toast}
        </div>
      )}

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 18,
              padding: "28px 32px",
              maxWidth: 380,
              width: "100%",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: "#1A1208",
                marginBottom: 10,
              }}
            >
              Delete Quote
            </div>
            <div
              style={{ fontSize: 14, color: "#9A8070", marginBottom: 20 }}
            >
              Are you sure you want to delete quote {quote.number}? This action
              cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "9px 18px",
                  border: "1px solid #EDE8E3",
                  borderRadius: 10,
                  background: "#fff",
                  color: "#1A1208",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "9px 18px",
                  border: "none",
                  borderRadius: 10,
                  background: deleting ? "#EDE8E3" : "#c0392b",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        {/* Header */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#9A8070",
                marginBottom: 4,
              }}
            >
              Quote
            </div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#1A1208",
                margin: 0,
                marginBottom: 6,
              }}
            >
              {quote.number}
            </h1>
            <div
              style={{ fontSize: 14, color: "#9A8070" }}
            >
              {quote.input.clientName}
              {quote.input.eventDate
                ? ` · ${formatDate(quote.input.eventDate)}`
                : ""}
            </div>
          </div>

          {/* Status dropdown */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: "#9A8070",
                marginBottom: 6,
              }}
            >
              Status
            </div>
            <select
              value={quote.status}
              onChange={(e) =>
                handleStatusChange(e.target.value as QuoteStatus)
              }
              disabled={statusUpdating}
              style={{
                padding: "8px 12px",
                border: `2px solid ${statusColors[quote.status]}`,
                borderRadius: 10,
                color: statusColors[quote.status],
                fontWeight: 700,
                fontSize: 13,
                background: `${statusColors[quote.status]}18`,
                cursor: "pointer",
                outline: "none",
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} style={{ textTransform: "capitalize" }}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quote details */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #EDE8E3",
            borderRadius: 18,
            padding: "20px 24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#9A8070",
                  marginBottom: 4,
                }}
              >
                Client
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1208" }}>
                {quote.input.clientName}
              </div>
              {quote.input.clientEmail && (
                <div style={{ fontSize: 13, color: "#9A8070" }}>
                  {quote.input.clientEmail}
                </div>
              )}
            </div>

            {quote.input.eventDate && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#9A8070",
                    marginBottom: 4,
                  }}
                >
                  Event Date
                </div>
                <div
                  style={{ fontSize: 14, fontWeight: 700, color: "#1A1208" }}
                >
                  {formatDate(quote.input.eventDate)}
                </div>
              </div>
            )}

            {quote.input.eventLocation && (
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "#9A8070",
                    marginBottom: 4,
                  }}
                >
                  Location
                </div>
                <div style={{ fontSize: 14, color: "#1A1208" }}>
                  {quote.input.eventLocation}
                </div>
              </div>
            )}
          </div>

          {quote.input.notes && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 14,
                borderTop: "1px solid #EDE8E3",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#9A8070",
                  marginBottom: 4,
                }}
              >
                Notes
              </div>
              <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.5 }}>
                {quote.input.notes}
              </div>
            </div>
          )}
        </div>

        {/* Breakdown */}
        <div style={{ marginBottom: 24 }}>
          <QuoteBreakdown
            breakdown={quote.breakdown}
            currency={currency}
            mode="full"
          />
        </div>

        {/* Action bar */}
        <div
          className="no-print"
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            paddingTop: 8,
            borderTop: "1px solid #EDE8E3",
          }}
        >
          <button
            onClick={handleSendEmail}
            disabled={sendingEmail || !quote.input.clientEmail}
            title={!quote.input.clientEmail ? "Add client email to quote first" : "Send quote to client via email"}
            style={{
              padding: "10px 18px",
              border: "none",
              borderRadius: 12,
              background: sendingEmail ? "#EDE8E3" : "#F05A00",
              color: sendingEmail ? "#9A8070" : "#fff",
              fontWeight: 700,
              fontSize: 13,
              cursor: sendingEmail || !quote.input.clientEmail ? "not-allowed" : "pointer",
              boxShadow: sendingEmail || !quote.input.clientEmail ? "none" : "0 2px 8px rgba(240,90,0,0.3)",
              opacity: !quote.input.clientEmail ? 0.5 : 1,
            }}
          >
            {sendingEmail ? "Sending…" : "Send to Client"}
          </button>

          <button
            onClick={handleCopyText}
            style={{
              padding: "10px 18px",
              border: "1px solid #EDE8E3",
              borderRadius: 12,
              background: "#fff",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            Copy to clipboard
          </button>

          <button
            onClick={handleShareLink}
            style={{
              padding: "10px 18px",
              border: "1px solid #EDE8E3",
              borderRadius: 12,
              background: "#fff",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            Share link
          </button>

          <button
            onClick={handlePrint}
            style={{
              padding: "10px 18px",
              border: "1px solid #EDE8E3",
              borderRadius: 12,
              background: "#fff",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            Download PDF
          </button>

          <button
            onClick={handleDuplicate}
            style={{
              padding: "10px 18px",
              border: "1px solid #EDE8E3",
              borderRadius: 12,
              background: "#fff",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            Duplicate quote
          </button>

          <button
            onClick={() => router.push(`/app/quotes/${id}/edit`)}
            style={{
              padding: "10px 18px",
              border: "1px solid #EDE8E3",
              borderRadius: 12,
              background: "#fff",
              color: "#1A1208",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            Edit quote
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => setShowDeleteConfirm(true)}
            style={{
              padding: "10px 18px",
              border: "1px solid #fcdede",
              borderRadius: 12,
              background: "#fdf2f2",
              color: "#c0392b",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
