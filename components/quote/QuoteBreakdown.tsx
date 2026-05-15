"use client";

import { QuoteBreakdown as QuoteBreakdownType } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing/engine";

interface QuoteBreakdownProps {
  breakdown: QuoteBreakdownType;
  currency: string;
  mode: "compact" | "full";
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: strong ? 14 : 13, lineHeight: 1.6 }}>
      <span style={{ color: strong ? "var(--text)" : "var(--text-3)", fontWeight: strong ? 800 : 500 }}>{label}</span>
      <span style={{ color: strong ? "var(--text)" : "var(--text-2)", fontWeight: strong ? 800 : 700, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Money({ label, value, currency, strong }: { label: string; value: number; currency: string; strong?: boolean }) {
  return <Row label={label} value={formatCurrency(value, currency)} strong={strong} />;
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "10px 0" }} />;
}

export default function QuoteBreakdown({ breakdown, currency, mode }: QuoteBreakdownProps) {
  const compact = mode === "compact";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: compact ? 16 : 22, boxShadow: "var(--shadow-sm)" }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: compact ? 14 : 16, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>
        Quote Summary
      </div>

      <Row label="Selected package" value={breakdown.packageName || "-"} />
      <Row label="Selected tier" value={breakdown.tierName} />
      <Row label="Garland length" value={`${breakdown.length}${breakdown.unit}`} />
      {breakdown.includedLength ? <Row label="Included length" value={`${breakdown.includedLength}${breakdown.unit}`} /> : null}
      {breakdown.extraLength ? <Row label="Extra length" value={`${breakdown.extraLength}${breakdown.unit}`} /> : null}

      <Divider />

      <Money label="Package price" value={breakdown.packagePrice ?? 0} currency={currency} />
      <Money label="Extra garland price" value={breakdown.extraGarlandPrice ?? breakdown.basePrice} currency={currency} />
      <Money label="Add-ons total" value={breakdown.addonsTotal} currency={currency} />
      <Money label="Inventory/catalog items" value={breakdown.inventoryTotal ?? 0} currency={currency} />
      <Money label="Manual items" value={breakdown.manualItemsTotal ?? 0} currency={currency} />
      <Money label="Delivery fee" value={breakdown.deliveryFee ?? 0} currency={currency} />
      <Money label="Setup fee" value={breakdown.setupFee ?? 0} currency={currency} />
      <Money label="Labour fee" value={breakdown.labourFee ?? 0} currency={currency} />
      <Money label="Takedown fee" value={breakdown.takedownFee ?? 0} currency={currency} />
      <Money label="Discount" value={-(breakdown.discountAmount ?? 0)} currency={currency} />
      <Money label="Tax" value={breakdown.taxAmount ?? 0} currency={currency} />

      <Divider />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <span style={{ fontSize: compact ? 14 : 16, fontWeight: 900, color: "var(--text)" }}>Subtotal</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: compact ? 20 : 26, fontWeight: 900, color: "var(--orange)" }}>
          {formatCurrency(breakdown.subtotal, currency)}
        </span>
      </div>
    </div>
  );
}
