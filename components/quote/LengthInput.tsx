"use client";

import { Tier, Unit } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing/engine";

interface LengthInputProps {
  length: number;
  unit: Unit;
  tierId: string;
  tiers: Tier[];
  onLengthChange: (length: number) => void;
  onUnitChange: (unit: Unit) => void;
}

export default function LengthInput({
  length,
  unit,
  tierId,
  tiers,
  onLengthChange,
  onUnitChange,
}: LengthInputProps) {
  const tier = tiers.find((t) => t.id === tierId);

  const basePrice = (() => {
    if (!tier) return null;
    const rate = unit === "ft" ? tier.pricePerFt : tier.pricePerM;
    const raw = length * rate;
    const withMin =
      tier.minimumSpend !== undefined ? Math.max(raw, tier.minimumSpend) : raw;
    return Math.round(withMin * 100) / 100;
  })();

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    color: "#9A8070",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Length</label>
          <input
            type="number"
            min={1}
            step={1}
            value={length}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val > 0) onLengthChange(val);
            }}
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid #EDE8E3",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              color: "#1A1208",
              background: "#fff",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div>
          <label style={labelStyle}>Unit</label>
          <div
            style={{
              display: "flex",
              border: "1px solid #EDE8E3",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            {(["ft", "m"] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => onUnitChange(u)}
                style={{
                  padding: "10px 18px",
                  border: "none",
                  background: unit === u ? "#F05A00" : "#fff",
                  color: unit === u ? "#fff" : "#1A1208",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      {basePrice !== null && tier && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            background: "#F7F4F1",
            borderRadius: 10,
            fontSize: 13,
            color: "#1A1208",
          }}
        >
          <span style={{ color: "#9A8070" }}>Base price: </span>
          <span style={{ fontWeight: 700, color: "#F05A00" }}>
            {formatCurrency(basePrice)}
          </span>
          {tier.minimumSpend !== undefined &&
            length * (unit === "ft" ? tier.pricePerFt : tier.pricePerM) <
              tier.minimumSpend && (
              <span style={{ color: "#9A8070", fontSize: 11, marginLeft: 8 }}>
                (minimum spend applied)
              </span>
            )}
        </div>
      )}
    </div>
  );
}
