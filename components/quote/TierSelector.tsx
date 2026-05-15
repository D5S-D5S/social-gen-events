"use client";

import { Tier, Unit } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing/engine";

interface TierSelectorProps {
  tiers: Tier[];
  selectedId: string;
  unit: Unit;
  onChange: (id: string) => void;
}

export default function TierSelector({
  tiers,
  selectedId,
  unit,
  onChange,
}: TierSelectorProps) {
  const activeTiers = [...tiers]
    .filter((t) => t.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12,
        }}
      >
        {activeTiers.map((tier) => {
          const isSelected = tier.id === selectedId;
          return (
            <button
              key={tier.id}
              onClick={() => onChange(tier.id)}
              style={{
                border: isSelected
                  ? "2px solid #F05A00"
                  : "1px solid #EDE8E3",
                borderRadius: 18,
                padding: "16px 18px",
                background: isSelected ? "#FFF5EF" : "#fff",
                cursor: "pointer",
                textAlign: "left",
                boxShadow: isSelected
                  ? "0 0 0 3px rgba(240,90,0,0.12)"
                  : "0 1px 3px rgba(0,0,0,0.06)",
                transition: "all 0.15s ease",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: isSelected ? "#F05A00" : "#1A1208",
                  marginBottom: 4,
                }}
              >
                {tier.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isSelected ? "#F05A00" : "#1A1208",
                  marginBottom: 6,
                }}
              >
                {unit === "ft"
                  ? `${formatCurrency(tier.pricePerFt)}/ft`
                  : `${formatCurrency(tier.pricePerM)}/m`}
              </div>
              {tier.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#9A8070",
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {tier.description}
                </div>
              )}
              {tier.minimumSpend !== undefined && (
                <div
                  style={{
                    fontSize: 11,
                    color: isSelected ? "#F05A00" : "#9A8070",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginTop: 4,
                  }}
                >
                  Min spend {formatCurrency(tier.minimumSpend)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
