"use client";

import { LineItem, LineItemType } from "@/lib/types";

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#9A8070",
};

export default function LineItemsEditor({ items, onChange }: LineItemsEditorProps) {
  function addItem() {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      name: "",
      amount: 0,
      type: "fee",
    };
    onChange([...items, newItem]);
  }

  function updateItem(id: string, updates: Partial<LineItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  function removeItem(id: string) {
    onChange(items.filter((item) => item.id !== id));
  }

  return (
    <div>
      {items.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {/* Header */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr 100px 36px",
              gap: 8,
              paddingBottom: 4,
            }}
          >
            <span style={labelStyle}>Type</span>
            <span style={labelStyle}>Name</span>
            <span style={labelStyle}>Amount</span>
            <span />
          </div>

          {items.map((item) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr 100px 36px",
                gap: 8,
                alignItems: "center",
              }}
            >
              {/* Type toggle */}
              <div
                style={{
                  display: "flex",
                  border: "1px solid #EDE8E3",
                  borderRadius: 10,
                  overflow: "hidden",
                }}
              >
                {(["fee", "discount"] as LineItemType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateItem(item.id, { type: t })}
                    style={{
                      flex: 1,
                      padding: "6px 4px",
                      border: "none",
                      background: item.type === t ? (t === "fee" ? "#F05A00" : "#1A1208") : "#fff",
                      color: item.type === t ? "#fff" : "#9A8070",
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {t === "fee" ? "Fee" : "Disc"}
                  </button>
                ))}
              </div>

              {/* Name input */}
              <input
                type="text"
                value={item.name}
                placeholder="Description"
                onChange={(e) => updateItem(item.id, { name: e.target.value })}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #EDE8E3",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#1A1208",
                  background: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* Amount input */}
              <input
                type="number"
                min={0}
                step={0.01}
                value={item.amount}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  updateItem(item.id, { amount: isNaN(val) ? 0 : val });
                }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #EDE8E3",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#1A1208",
                  background: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />

              {/* Remove button */}
              <button
                onClick={() => removeItem(item.id)}
                title="Remove"
                style={{
                  width: 36,
                  height: 36,
                  border: "1px solid #EDE8E3",
                  borderRadius: 10,
                  background: "#fff",
                  color: "#9A8070",
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#fdf2f2";
                  (e.currentTarget as HTMLButtonElement).style.color = "#c0392b";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#fcdede";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#fff";
                  (e.currentTarget as HTMLButtonElement).style.color = "#9A8070";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "#EDE8E3";
                }}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addItem}
        style={{
          padding: "9px 16px",
          border: "1px dashed #EDE8E3",
          borderRadius: 12,
          background: "transparent",
          color: "#9A8070",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          width: "100%",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#F05A00";
          (e.currentTarget as HTMLButtonElement).style.color = "#F05A00";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = "#EDE8E3";
          (e.currentTarget as HTMLButtonElement).style.color = "#9A8070";
        }}
      >
        + Add line item
      </button>
    </div>
  );
}
