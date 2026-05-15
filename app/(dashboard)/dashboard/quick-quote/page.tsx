"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlobalSettings, Tier } from "@/lib/types";
import { getCurrencySymbol, fmtSymbol } from "@/lib/currency";

export default function QuickQuotePage() {
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [tierId, setTierId] = useState("");
  const [length, setLength] = useState(20);
  const [unit, setUnit] = useState<"ft" | "m">("ft");
  const [addOnsTotal, setAddOnsTotal] = useState(0);
  const [deliveryEnabled, setDeliveryEnabled] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<"fixed" | "percentage">("fixed");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxPercent, setTaxPercent] = useState(0);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: GlobalSettings) => {
        const unitParam = searchParams.get("unit");
        const lengthParam = Number(searchParams.get("length"));

        setSettings(data);
        setUnit(unitParam === "m" ? "m" : unitParam === "ft" ? "ft" : data.defaultUnit);
        if (Number.isFinite(lengthParam) && lengthParam > 0) setLength(lengthParam);
        setDeliveryEnabled(Boolean(data.deliveryEnabled));
        setDeliveryFee(data.delivery?.minimumFee ?? 0);
        setDiscountEnabled(Boolean(data.discountEnabled));
        setTaxEnabled(Boolean(data.taxEnabled));
        setTaxPercent(Number(data.taxPercent ?? 0));

        const first = data.tiers.find((t) => t.active);
        if (first) setTierId(first.id);
      })
      .catch(() => {});
  }, [searchParams]);

  const tiers = settings?.tiers.filter((t) => t.active) ?? [];
  const tier: Tier | undefined = tiers.find((t) => t.id === tierId);
  const symbol = getCurrencySymbol(settings?.currency ?? "GBP");

  const pricePerUnit = tier ? (unit === "ft" ? tier.pricePerFt : tier.pricePerM) : 0;
  const garlandRaw = length * pricePerUnit;
  const minSpend = tier?.minimumSpend ?? 0;
  const garlandPrice = Math.max(garlandRaw, minSpend);
  const atMin = minSpend > 0 && garlandRaw < minSpend;
  const deliveryTotal = deliveryEnabled ? deliveryFee : 0;
  const beforeDiscount = garlandPrice + addOnsTotal + deliveryTotal;
  const discount = discountEnabled
    ? discountType === "percentage"
      ? beforeDiscount * (discountAmount / 100)
      : discountAmount
    : 0;
  const taxableAmount = Math.max(0, beforeDiscount - discount);
  const tax = taxEnabled ? taxableAmount * (taxPercent / 100) : 0;
  const subtotal = Math.max(0, taxableAmount + tax);

  const summaryText = tier
    ? [
        "BalloonBase Quick Quote",
        `${tier.name} Garland - ${length}${unit}`,
        `Garland price: ${fmtSymbol(garlandPrice, symbol)}`,
        `Add-ons total: ${fmtSymbol(addOnsTotal, symbol)}`,
        `Delivery fee: ${fmtSymbol(deliveryTotal, symbol)}`,
        `Discount: -${fmtSymbol(discount, symbol)}`,
        `Tax: ${fmtSymbol(tax, symbol)}`,
        `Subtotal: ${fmtSymbol(subtotal, symbol)}`,
      ].join("\n")
    : "";

  const handleCopy = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!settings) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "40vh" }}>
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading...</div>
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div style={{ width: "100%" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Quick Quote</h1>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 24 }}>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>No active garland tiers found. <a href="/app/settings" style={{ color: "var(--orange)", fontWeight: 600 }}>Add tiers in Settings</a></p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", background: "var(--orange-dim)", border: "1px solid var(--orange-border)", borderRadius: 99, fontSize: 11, fontWeight: 600, color: "var(--orange)", marginBottom: 10 }}>
          Fast Pricing
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>Quick Quote</h1>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Simple garland pricing with optional Add-ons, delivery, discount, and tax.</p>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 24, boxShadow: "var(--shadow-sm)", marginBottom: 16 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={smallLabel}>Selected tier</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tiers.map((t) => (
              <button
                key={t.id}
                onClick={() => setTierId(t.id)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: `1.5px solid ${tierId === t.id ? "var(--orange)" : "var(--border)"}`, borderRadius: "var(--r-lg)", background: tierId === t.id ? "var(--orange-dim)" : "var(--surface-2)", cursor: "pointer", transition: "all 0.12s" }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tierId === t.id ? "var(--orange)" : "var(--text)" }}>{t.name}</div>
                  {t.description && <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{t.description}</div>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: tierId === t.id ? "var(--orange)" : "var(--text-2)", fontFamily: "var(--font-display)" }}>
                  {fmtSymbol(unit === "ft" ? t.pricePerFt : t.pricePerM, symbol)}/{unit}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          <div>
            <label style={smallLabel}>Measurement unit</label>
            <div style={{ display: "inline-flex", borderRadius: "var(--r-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
              {(["ft", "m"] as const).map((u) => (
                <button key={u} onClick={() => setUnit(u)} style={{ padding: "8px 20px", fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: unit === u ? "var(--orange)" : "var(--surface-2)", color: unit === u ? "#fff" : "var(--text-3)" }}>
                  {u === "ft" ? "Feet" : "Metres"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={smallLabel}>Garland length ({unit})</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setLength((l) => Math.max(1, l - 5))} style={stepButton}>-</button>
              <input
                type="number"
                min={1}
                value={length}
                onChange={(e) => setLength(Math.max(1, Number(e.target.value)))}
                style={numberInput}
              />
              <button onClick={() => setLength((l) => l + 5)} style={stepButton}>+</button>
            </div>
          </div>
          <div>
            <label style={smallLabel}>Price per foot/metre</label>
            <div style={readonlyBox}>{fmtSymbol(pricePerUnit, symbol)}/{unit}</div>
          </div>
          <div>
            <label style={smallLabel}>Add-ons optional</label>
            <input type="number" min={0} step={0.01} value={addOnsTotal} onChange={(e) => setAddOnsTotal(Math.max(0, Number(e.target.value)))} style={numberInput} />
          </div>
          <ToggleAmount title="Delivery optional" enabled={deliveryEnabled} setEnabled={setDeliveryEnabled} value={deliveryFee} setValue={setDeliveryFee} />
          <div>
            <label style={smallLabel}>Discount optional</label>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={inlineCheck}><input type="checkbox" checked={discountEnabled} onChange={(e) => setDiscountEnabled(e.target.checked)} style={{ accentColor: "var(--orange)" }} /> On</label>
              <select value={discountType} onChange={(e) => setDiscountType(e.target.value as "fixed" | "percentage")} disabled={!discountEnabled} style={miniSelect}>
                <option value="fixed">Fixed</option>
                <option value="percentage">%</option>
              </select>
              <input type="number" min={0} step={0.01} value={discountAmount} onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))} disabled={!discountEnabled} style={{ ...numberInput, background: discountEnabled ? "var(--surface)" : "var(--surface-2)" }} />
            </div>
          </div>
          <div>
            <label style={smallLabel}>Tax optional</label>
            <div style={{ display: "flex", gap: 8 }}>
              <label style={inlineCheck}><input type="checkbox" checked={taxEnabled} onChange={(e) => setTaxEnabled(e.target.checked)} style={{ accentColor: "var(--orange)" }} /> On</label>
              <input type="number" min={0} step={0.01} value={taxPercent} onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value)))} disabled={!taxEnabled} style={{ ...numberInput, background: taxEnabled ? "var(--surface)" : "var(--surface-2)" }} />
            </div>
          </div>
        </div>

        {tier && (
          <div style={{ background: "var(--orange-dim)", border: "1.5px solid var(--orange-border)", borderRadius: "var(--r-lg)", padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ display: "grid", gap: 8 }}>
              <SummaryRow label={atMin ? "Garland price (minimum applies)" : `Garland price (${length}${unit} x ${fmtSymbol(pricePerUnit, symbol)})`} value={fmtSymbol(garlandPrice, symbol)} />
              <SummaryRow label="Add-ons total" value={fmtSymbol(addOnsTotal, symbol)} />
              <SummaryRow label="Delivery fee" value={fmtSymbol(deliveryTotal, symbol)} />
              <SummaryRow label="Discount" value={`-${fmtSymbol(discount, symbol)}`} />
              <SummaryRow label="Tax" value={fmtSymbol(tax, symbol)} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--orange-border)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>Subtotal</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color: "var(--orange)", letterSpacing: "-0.04em" }}>
                  {fmtSymbol(subtotal, symbol)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleCopy} disabled={!tier} style={{ flex: 1, padding: 11, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 600, color: "var(--text-2)", cursor: tier ? "pointer" : "not-allowed" }}>
            {copied ? "Copied!" : "Copy Quote"}
          </button>
          <button onClick={handleSave} disabled={!tier} style={{ flex: 1, padding: 11, background: "var(--orange)", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, color: "#fff", cursor: tier ? "pointer" : "not-allowed", boxShadow: "0 1px 4px rgba(240,80,0,0.25)" }}>
            {saved ? "Saved!" : "Save Quote"}
          </button>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center" }}>
        Need a full breakdown? <a href="/app/detailed-quote" style={{ color: "var(--orange)", textDecoration: "none", fontWeight: 600 }}>Create a Detailed Quote</a>
      </p>
    </div>
  );
}

const smallLabel: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  display: "block",
  marginBottom: 8,
};

const numberInput: React.CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  padding: "8px 12px",
  fontSize: 13,
  background: "var(--surface)",
  color: "var(--text)",
  boxSizing: "border-box",
};

const stepButton: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "var(--r-md)",
  border: "1px solid var(--border)",
  background: "var(--surface-2)",
  fontSize: 18,
  fontWeight: 600,
  color: "var(--text-2)",
  cursor: "pointer",
};

const readonlyBox: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  padding: "8px 12px",
  fontSize: 13,
  background: "var(--surface-2)",
  color: "var(--text)",
  fontWeight: 700,
};

const inlineCheck: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  color: "var(--text-2)",
  whiteSpace: "nowrap",
};

const miniSelect: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "var(--r-md)",
  padding: "8px",
  fontSize: 13,
  background: "var(--surface)",
  color: "var(--text)",
};

function ToggleAmount({ title, enabled, setEnabled, value, setValue }: { title: string; enabled: boolean; setEnabled: (value: boolean) => void; value: number; setValue: (value: number) => void }) {
  return (
    <div>
      <label style={smallLabel}>{title}</label>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={inlineCheck}><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ accentColor: "var(--orange)" }} /> On</label>
        <input type="number" min={0} step={0.01} value={value} onChange={(e) => setValue(Math.max(0, Number(e.target.value)))} disabled={!enabled} style={{ ...numberInput, background: enabled ? "var(--surface)" : "var(--surface-2)" }} />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 12 }}>
      <span style={{ color: "var(--text-3)" }}>{label}</span>
      <strong style={{ color: "var(--text)" }}>{value}</strong>
    </div>
  );
}
