"use client";

import { useState } from "react";
import { QuoteBreakdown } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing/engine";

interface PublicQuoteActionsProps {
  quoteNumber: string;
  breakdown: QuoteBreakdown;
  currency: string;
  clientName: string;
  eventDate: string;
}

function buildTextSummary(
  quoteNumber: string,
  breakdown: QuoteBreakdown,
  currency: string,
  clientName: string,
  eventDate: string
): string {
  const fmt = (v: number) => formatCurrency(v, currency);
  const lines: string[] = [
    `QUOTE ${quoteNumber}`,
    `Prepared for: ${clientName}`,
    eventDate ? `Event date: ${eventDate}` : "",
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
    const deliveryLine =
      breakdown.deliveryFee === 0
        ? "Delivery: Included"
        : `Delivery: ${fmt(breakdown.deliveryFee)}`;
    lines.push(deliveryLine);
  } else {
    lines.push("Delivery: TBC");
  }

  if (breakdown.platformFeeVisible && breakdown.platformFeeAmount > 0) {
    lines.push(`${breakdown.platformFeeLabel}: ${fmt(breakdown.platformFeeAmount)}`);
  }

  lines.push(`TOTAL: ${fmt(breakdown.total)}`);
  lines.push(`Deposit (${breakdown.depositPercent}%): ${fmt(breakdown.depositAmount)}`);

  return lines.filter((l) => l !== undefined).join("\n");
}

export default function PublicQuoteActions({
  quoteNumber,
  breakdown,
  currency,
  clientName,
  eventDate,
}: PublicQuoteActionsProps) {
  const [copyLabel, setCopyLabel] = useState("Copy quote summary");

  async function handleCopy() {
    const text = buildTextSummary(quoteNumber, breakdown, currency, clientName, eventDate);
    try {
      await navigator.clipboard.writeText(text);
      setCopyLabel("Copied!");
      setTimeout(() => setCopyLabel("Copy quote summary"), 2000);
    } catch {
      setCopyLabel("Copy failed");
      setTimeout(() => setCopyLabel("Copy quote summary"), 2000);
    }
  }

  function handlePrint() {
    window.print();
  }

  const btnStyle: React.CSSProperties = {
    padding: "11px 20px",
    border: "1px solid #EDE8E3",
    borderRadius: 12,
    background: "#fff",
    color: "#1A1208",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    transition: "all 0.15s ease",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <button onClick={handleCopy} style={btnStyle}>
        {copyLabel}
      </button>
      <button onClick={handlePrint} style={btnStyle}>
        Download PDF
      </button>
    </div>
  );
}
