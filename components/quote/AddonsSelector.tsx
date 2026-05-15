"use client";

import { Addon } from "@/lib/types";
import { formatCurrency } from "@/lib/pricing/engine";

interface AddonsSelectorProps {
  addons: Addon[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function AddonsSelector({
  addons,
  selected,
  onChange,
}: AddonsSelectorProps) {
  const activeAddons = [...addons]
    .filter((a) => a.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Group by category
  const grouped: Record<string, Addon[]> = {};
  for (const addon of activeAddons) {
    const cat = addon.category ?? "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(addon);
  }

  const categories = Object.keys(grouped).sort();

  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {categories.map((cat) => (
        <div key={cat}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#9A8070",
              marginBottom: 8,
            }}
          >
            {cat}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {grouped[cat].map((addon) => {
              const isChecked = selected.includes(addon.id);
              return (
                <label
                  key={addon.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    border: isChecked ? "1px solid #F05A00" : "1px solid #EDE8E3",
                    borderRadius: 12,
                    background: isChecked ? "#FFF5EF" : "#fff",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggle(addon.id)}
                      style={{ accentColor: "#F05A00", width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isChecked ? "#F05A00" : "#1A1208",
                      }}
                    >
                      {addon.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: isChecked ? "#F05A00" : "#9A8070",
                    }}
                  >
                    {formatCurrency(addon.price)}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      {categories.length === 0 && (
        <div style={{ color: "#9A8070", fontSize: 13 }}>
          No add-ons available.
        </div>
      )}
    </div>
  );
}
