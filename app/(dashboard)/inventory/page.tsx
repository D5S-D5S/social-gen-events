"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrencySymbol, fmtSymbol } from "@/lib/currency";

interface InvItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  unit_cost: number;
  quantity_in_stock: number;
  is_active: boolean;
  notes: string;
  color?: string;
  size?: string;
}

const EMPTY_FORM: Omit<InvItem, "id"> = {
  name: "", category: "", description: "", price: 0, unit_cost: 0,
  quantity_in_stock: 0, is_active: true, notes: "", color: "", size: "",
};

const CSV_TEMPLATE = `name,category,description,price,cost,stock_quantity,active,notes
Gold Sailboard,Backdrops,Gold foil sailboard for displays,100,40,5,true,Popular birthday backdrop
LED Number Set,Lighting,LED number hire,60,20,3,true,Available in silver and gold
Cake Stand,Accessories,Acrylic cake stand,45,15,4,true,`;

const INPUT: React.CSSProperties = {
  border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 10px",
  fontSize: 13, background: "var(--surface)", color: "var(--text)",
  width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit",
};

export default function InventoryPage() {
  const [items, setItems] = useState<InvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("GBP");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<InvItem, "id">>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");

  // CSV
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [csvRows, setCsvRows] = useState<Omit<InvItem, "id">[]>([]);
  const [csvMode, setCsvMode] = useState<"append" | "replace">("append");
  const [csvImporting, setCsvImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const sym = getCurrencySymbol(currency);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setProfileId(session.user.id);
      const [invRes, settingsRes] = await Promise.all([
        supabase.from("inventory").select("*").eq("profile_id", session.user.id).order("name"),
        fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      ]);
      setItems(invRes.data ?? []);
      if (settingsRes?.currency) setCurrency(settingsRes.currency);
      setLoading(false);
    });
  }, []);

  const cats = ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort()];
  const filtered = items.filter((item) => {
    const matchCat = filterCat === "All" || item.category === filterCat;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: InvItem) => {
    setEditingId(item.id);
    setForm({ name: item.name, category: item.category, description: item.description, price: item.price, unit_cost: item.unit_cost, quantity_in_stock: item.quantity_in_stock, is_active: item.is_active, notes: item.notes, color: item.color ?? "", size: item.size ?? "" });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, profile_id: profileId };
    if (editingId) {
      const { data } = await supabase.from("inventory").update(payload).eq("id", editingId).select().single();
      if (data) setItems((prev) => prev.map((i) => (i.id === editingId ? data : i)));
      showToast("Saved");
    } else {
      const { data } = await supabase.from("inventory").insert(payload).select().single();
      if (data) setItems((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      showToast("Item added");
    }
    setSaving(false);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await supabase.from("inventory").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
    showToast("Deleted");
  };

  const toggleActive = async (item: InvItem) => {
    const { data } = await supabase.from("inventory").update({ is_active: !item.is_active }).eq("id", item.id).select().single();
    if (data) setItems((prev) => prev.map((i) => (i.id === item.id ? data : i)));
  };

  // CSV
  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const header = "name,category,description,price,cost,stock_quantity,active,notes";
    const rows = items.map((i) =>
      [i.name, i.category, i.description, i.price, i.unit_cost, i.quantity_in_stock, i.is_active, i.notes]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "inventory-export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { showToast("CSV is empty"); return; }
      const rows: Omit<InvItem, "id">[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 4 || !cols[0].trim()) continue;
        rows.push({
          name: cols[0].trim(),
          category: cols[1]?.trim() ?? "",
          description: cols[2]?.trim() ?? "",
          price: parseFloat(cols[3]) || 0,
          unit_cost: parseFloat(cols[4]) || 0,
          quantity_in_stock: parseInt(cols[5]) || 0,
          is_active: (cols[6]?.toLowerCase() ?? "true") !== "false",
          notes: cols[7]?.trim() ?? "",
          color: "",
          size: "",
        });
      }
      if (rows.length === 0) { showToast("No valid rows found"); return; }
      setCsvRows(rows);
      setShowCsvPreview(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmCsvImport = async () => {
    if (!profileId || csvRows.length === 0) return;
    setCsvImporting(true);
    try {
      if (csvMode === "replace") {
        await supabase.from("inventory").delete().eq("profile_id", profileId);
      }
      const toInsert = csvRows.map((r) => ({ ...r, profile_id: profileId }));
      const { data } = await supabase.from("inventory").insert(toInsert).select();
      if (csvMode === "replace") {
        setItems(data ?? []);
      } else {
        setItems((prev) => [...prev, ...(data ?? [])].sort((a, b) => a.name.localeCompare(b.name)));
      }
      showToast(`Imported ${csvRows.length} items`);
      setShowCsvPreview(false);
      setCsvRows([]);
    } catch {
      showToast("Import failed");
    }
    setCsvImporting(false);
  };

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "var(--text)", boxShadow: "var(--shadow-xl)", zIndex: 999 }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>Inventory</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Inventory and hire items that appear in Detailed Quote and Package builder.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button onClick={downloadTemplate} style={{ padding: "8px 12px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Template</button>
          <button onClick={() => csvInputRef.current?.click()} style={{ padding: "8px 12px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Import CSV</button>
          <button onClick={exportCsv} style={{ padding: "8px 12px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Export CSV</button>
          <button onClick={openNew} style={{ padding: "8px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Item</button>
        </div>
      </div>

      <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvFile} style={{ display: "none" }} />

      {/* CSV Preview */}
      {showCsvPreview && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-xl)", padding: 20, marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Import preview — {csvRows.length} rows</p>
          <div style={{ overflowX: "auto", maxHeight: 240, marginBottom: 14, border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "var(--surface-2)" }}>{["Name","Category","Price","Cost","Stock","Active"].map((h) => <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>
                {csvRows.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "6px 10px", color: "var(--text)" }}>{r.name}</td>
                    <td style={{ padding: "6px 10px", color: "var(--text-3)" }}>{r.category}</td>
                    <td style={{ padding: "6px 10px", color: "var(--text)" }}>{fmtSymbol(r.price, sym)}</td>
                    <td style={{ padding: "6px 10px", color: "var(--text-3)" }}>{fmtSymbol(r.unit_cost, sym)}</td>
                    <td style={{ padding: "6px 10px", color: "var(--text-3)" }}>{r.quantity_in_stock}</td>
                    <td style={{ padding: "6px 10px" }}><span style={{ color: r.is_active ? "var(--orange)" : "var(--text-3)" }}>{r.is_active ? "Yes" : "No"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
              <input type="radio" checked={csvMode === "append"} onChange={() => setCsvMode("append")} style={{ accentColor: "var(--orange)" }} /> Append to existing
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
              <input type="radio" checked={csvMode === "replace"} onChange={() => setCsvMode("replace")} style={{ accentColor: "var(--orange)" }} /> Replace all inventory
            </label>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowCsvPreview(false)} style={{ padding: "8px 14px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={confirmCsvImport} disabled={csvImporting} style={{ padding: "8px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              {csvImporting ? "Importing…" : "Confirm Import"}
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-xl)", padding: "20px 22px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>{editingId ? "Edit Item" : "New Inventory Item"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Item name" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Category</label>
              <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Backdrops" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Price ({sym})</label>
              <input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} style={INPUT} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Cost ({sym})</label>
              <input type="number" min={0} step={0.01} value={form.unit_cost} onChange={(e) => setForm((f) => ({ ...f, unit_cost: parseFloat(e.target.value) || 0 }))} style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Stock qty</label>
              <input type="number" min={0} value={form.quantity_in_stock} onChange={(e) => setForm((f) => ({ ...f, quantity_in_stock: parseInt(e.target.value) || 0 }))} style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Colour</label>
              <input value={form.color ?? ""} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="optional" style={INPUT} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Size</label>
              <input value={form.size ?? ""} onChange={(e) => setForm((f) => ({ ...f, size: e.target.value }))} placeholder="optional" style={INPUT} />
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Description</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description" style={INPUT} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Notes</label>
            <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Internal notes" style={INPUT} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ padding: "9px 18px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !form.name.trim() ? 0.5 : 1 }}>{saving ? "Saving…" : "Save"}</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "9px 14px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-2)", cursor: "pointer", marginLeft: 8 }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: "var(--orange)" }} /> Active
            </label>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" style={{ ...INPUT, width: 220 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} style={{ padding: "6px 12px", borderRadius: 99, border: `1px solid ${filterCat === c ? "var(--orange)" : "var(--border)"}`, background: filterCat === c ? "var(--orange-dim)" : "var(--surface-2)", color: filterCat === c ? "var(--orange)" : "var(--text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>{items.length === 0 ? "No inventory items yet." : "No items match your search."}</p>
            {items.length === 0 && <button onClick={openNew} style={{ padding: "9px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add first item</button>}
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 60px 80px 80px", gap: 0, padding: "10px 16px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
              {["Name", "Category", "Price", "Cost", "Stock", "Status", ""].map((h) => (
                <div key={h} style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{h}</div>
              ))}
            </div>
            {filtered.map((item, i) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px 60px 80px 80px", gap: 0, padding: "12px 16px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", opacity: item.is_active ? 1 : 0.5 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: 11, color: "var(--text-3)" }}>{item.description}</div>}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{item.category}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--orange)" }}>{fmtSymbol(item.price, sym)}</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>{fmtSymbol(item.unit_cost, sym)}</div>
                <div style={{ fontSize: 12, color: item.quantity_in_stock < 3 ? "var(--red, #EF4444)" : "var(--text-3)" }}>{item.quantity_in_stock}</div>
                <div>
                  <button onClick={() => toggleActive(item)} style={{ padding: "3px 8px", fontSize: 11, fontWeight: 600, background: item.is_active ? "var(--orange-dim)" : "var(--surface-2)", color: item.is_active ? "var(--orange)" : "var(--text-3)", border: `1px solid ${item.is_active ? "var(--orange-border)" : "var(--border)"}`, borderRadius: 99, cursor: "pointer" }}>
                    {item.is_active ? "Active" : "Off"}
                  </button>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(item)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12, fontWeight: 600, padding: "4px 6px" }}>Edit</button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red, #EF4444)", fontSize: 12, fontWeight: 600, padding: "4px 6px" }}>Del</button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 10 }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""} · Active items appear in Detailed Quote and Package builder</p>
    </div>
  );
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuote = !inQuote; }
    } else if (ch === "," && !inQuote) {
      result.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
