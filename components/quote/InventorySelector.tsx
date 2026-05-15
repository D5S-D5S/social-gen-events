"use client";

import { useEffect, useState, useCallback } from "react";
import { getInventory } from "@/lib/db";
import { LineItem } from "@/lib/types";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  color: string;
  size: string;
  quantity_in_stock: number;
  unit_cost: number;
  sku: string;
}

interface InventorySelectorProps {
  lineItems: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: string;
}

const INVENTORY_PREFIX = "inv_";

// Filter lineItems that are from inventory
function inventoryLineItems(items: LineItem[]) {
  return items.filter((i) => i.id.startsWith(INVENTORY_PREFIX));
}
function nonInventoryLineItems(items: LineItem[]) {
  return items.filter((i) => !i.id.startsWith(INVENTORY_PREFIX));
}

export default function InventorySelector({ lineItems, onChange, currency = "£" }: InventorySelectorProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getInventory();
    setItems((data as InventoryItem[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Current selections: id → qty
  const selected: Record<string, number> = {};
  for (const li of inventoryLineItems(lineItems)) {
    const id = li.id.replace(INVENTORY_PREFIX, "");
    const item = items.find((i) => i.id === id);
    if (item && item.unit_cost > 0) {
      selected[id] = Math.round(li.amount / item.unit_cost);
    } else {
      selected[id] = 1;
    }
  }

  function setQty(item: InventoryItem, qty: number) {
    const others = nonInventoryLineItems(lineItems);
    const currentInv = inventoryLineItems(lineItems).filter(
      (li) => li.id !== `${INVENTORY_PREFIX}${item.id}`
    );

    if (qty <= 0) {
      onChange([...others, ...currentInv]);
      return;
    }

    const existing = lineItems.find((li) => li.id === `${INVENTORY_PREFIX}${item.id}`);
    const newItem: LineItem = {
      id: `${INVENTORY_PREFIX}${item.id}`,
      name: item.color ? `${item.name} (${item.color}${item.size ? ", " + item.size : ""}) ×${qty}` : `${item.name}${item.size ? " (" + item.size + ")" : ""} ×${qty}`,
      amount: item.unit_cost * qty,
      type: "fee",
    };

    if (existing) {
      onChange([...others, ...currentInv, newItem]);
    } else {
      onChange([...others, ...currentInv, newItem]);
    }
  }

  const cats = ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort()];
  const filtered = items.filter((item) => {
    const matchCat = filterCat === "All" || item.category === filterCat;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.color?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const fmt = (n: number) => `${currency}${n.toFixed(2)}`;

  if (loading) return <div style={{ color: "#9CA3AF", fontSize: 13 }}>Loading inventory…</div>;

  if (items.length === 0) {
    return (
      <div style={{ padding: "16px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 8 }}>No inventory items yet.</p>
        <a href="/catalog?tab=inventory" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "#F05000", fontWeight: 600 }}>
          Add inventory items →
        </a>
      </div>
    );
  }

  return (
    <div>
      {/* Search + filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Category pills */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {cats.map((cat) => (
          <button key={cat} onClick={() => setFilterCat(cat)} style={{ padding: "4px 10px", borderRadius: 99, border: `1px solid ${filterCat === cat ? "#F05000" : "#E5E7EB"}`, background: filterCat === cat ? "#FFF4EF" : "#fff", color: filterCat === cat ? "#F05000" : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            {cat}
          </button>
        ))}
      </div>

      {/* Items list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
        {filtered.map((item) => {
          const qty = selected[item.id] ?? 0;
          const isSelected = qty > 0;
          return (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", border: `1px solid ${isSelected ? "#F05000" : "#E5E7EB"}`, borderRadius: 10, background: isSelected ? "#FFF4EF" : "#fff", transition: "all 0.15s" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: isSelected ? "#F05000" : "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                  {item.color && <span style={{ fontWeight: 400, color: "#6B7280" }}> · {item.color}</span>}
                  {item.size && <span style={{ fontWeight: 400, color: "#6B7280" }}> · {item.size}</span>}
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                  {item.unit_cost > 0 ? fmt(item.unit_cost) + " each" : "No cost set"}
                  {item.quantity_in_stock !== undefined && (
                    <span style={{ marginLeft: 8, color: item.quantity_in_stock < 5 ? "#F59E0B" : "#9CA3AF" }}>
                      {item.quantity_in_stock} in stock
                    </span>
                  )}
                </div>
              </div>

              {/* Qty stepper */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 12, flexShrink: 0 }}>
                {isSelected ? (
                  <>
                    <button onClick={() => setQty(item, qty - 1)} style={stepBtn("#fff", "#E5E7EB")}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: "center", color: "#F05000" }}>{qty}</span>
                    <button onClick={() => setQty(item, qty + 1)} style={stepBtn("#F05000", "#F05000", true)}>+</button>
                  </>
                ) : (
                  <button onClick={() => setQty(item, 1)} style={{ padding: "5px 12px", border: "1px solid #E5E7EB", borderRadius: 7, background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    Add
                  </button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ color: "#9CA3AF", fontSize: 13, textAlign: "center", padding: 16 }}>No items found.</div>
        )}
      </div>

      {/* Summary */}
      {Object.keys(selected).length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 13, color: "#374151" }}>
          <strong style={{ color: "#0D0D0D" }}>{Object.keys(selected).length} item{Object.keys(selected).length !== 1 ? "s" : ""} selected</strong>
          {" · "}
          Total: <strong style={{ color: "#F05000" }}>
            {fmt(inventoryLineItems(lineItems).reduce((s, li) => s + li.amount, 0))}
          </strong>
          <button onClick={() => onChange(nonInventoryLineItems(lineItems))} style={{ marginLeft: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", fontSize: 12 }}>
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function stepBtn(bg: string, border: string, filled = false): React.CSSProperties {
  return {
    width: 26, height: 26,
    border: `1px solid ${border}`,
    borderRadius: 6,
    background: filled ? bg : bg,
    color: filled ? "#fff" : "#374151",
    fontSize: 15, fontWeight: 700,
    cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1,
    padding: 0,
  };
}
