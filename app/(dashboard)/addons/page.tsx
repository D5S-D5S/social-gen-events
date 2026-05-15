"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { getCurrencySymbol, fmtSymbol } from "@/lib/currency";

interface Addon {
  id: string;
  name: string;
  category: string;
  description: string;
  price_type: "fixed" | "percentage";
  price: number;
  cost: number;
  unit: string;
  is_active: boolean;
  notes: string;
}

const DEFAULTS: Omit<Addon, "id">[] = [
  { name: "Extra balloon colour",      category: "Styling",   description: "", price_type: "fixed",      price: 20, cost: 5,  unit: "",       is_active: true, notes: "" },
  { name: "Foil cluster",              category: "Styling",   description: "", price_type: "fixed",      price: 35, cost: 8,  unit: "",       is_active: true, notes: "" },
  { name: "Florals — light",           category: "Florals",   description: "", price_type: "fixed",      price: 35, cost: 15, unit: "",       is_active: true, notes: "" },
  { name: "Florals — medium",          category: "Florals",   description: "", price_type: "fixed",      price: 65, cost: 25, unit: "",       is_active: true, notes: "" },
  { name: "Florals — heavy",           category: "Florals",   description: "", price_type: "fixed",      price: 95, cost: 40, unit: "",       is_active: true, notes: "" },
  { name: "Outdoor setup fee",         category: "Service",   description: "", price_type: "fixed",      price: 30, cost: 0,  unit: "",       is_active: true, notes: "" },
  { name: "Early/late setup fee",      category: "Service",   description: "", price_type: "fixed",      price: 50, cost: 0,  unit: "",       is_active: true, notes: "" },
  { name: "Rush fee — under 7 days",   category: "Fees",      description: "", price_type: "percentage", price: 10, cost: 0,  unit: "% rush", is_active: true, notes: "" },
  { name: "Rush fee — under 72 hours", category: "Fees",      description: "", price_type: "percentage", price: 20, cost: 0,  unit: "% rush", is_active: true, notes: "" },
];

const CSV_TEMPLATE = `name,category,description,price_type,price_value,cost,active,notes
Extra balloon colour,Styling,,fixed,20,5,true,
Rush fee under 7 days,Fees,,percentage,10,0,true,`;

const EMPTY: Omit<Addon, "id"> = { name: "", category: "", description: "", price_type: "fixed", price: 0, cost: 0, unit: "", is_active: true, notes: "" };
const INPUT: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 10px", fontSize: 13, background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

export default function AddonsPage() {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("GBP");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Addon, "id">>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("All");

  // CSV
  const [showCsvPreview, setShowCsvPreview] = useState(false);
  const [csvRows, setCsvRows] = useState<Omit<Addon, "id">[]>([]);
  const [csvMode, setCsvMode] = useState<"append" | "replace">("append");
  const [csvImporting, setCsvImporting] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const sym = getCurrencySymbol(currency);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setProfileId(session.user.id);
      const [addonsRes, settingsRes] = await Promise.all([
        supabase.from("addons").select("*").eq("profile_id", session.user.id).order("name"),
        fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).catch(() => ({})),
      ]);
      if (settingsRes?.currency) setCurrency(settingsRes.currency);
      if (!addonsRes.data || addonsRes.data.length === 0) {
        const toInsert = DEFAULTS.map((a) => ({ ...a, profile_id: session.user.id }));
        const { data: inserted } = await supabase.from("addons").insert(toInsert).select();
        setAddons(inserted ?? []);
      } else {
        setAddons(addonsRes.data);
      }
      setLoading(false);
    });
  }, []);

  const cats = ["All", ...Array.from(new Set(addons.map((a) => a.category).filter(Boolean))).sort()];
  const filtered = filterCat === "All" ? addons : addons.filter((a) => a.category === filterCat);

  const openNew = () => { setEditingId(null); setForm(EMPTY); setShowForm(true); };
  const openEdit = (a: Addon) => { setEditingId(a.id); setForm({ name: a.name, category: a.category, description: a.description, price_type: a.price_type, price: a.price, cost: a.cost, unit: a.unit, is_active: a.is_active, notes: a.notes }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, profile_id: profileId };
    if (editingId) {
      const { data } = await supabase.from("addons").update(payload).eq("id", editingId).select().single();
      if (data) setAddons((prev) => prev.map((a) => (a.id === editingId ? data : a)));
      showToast("Saved");
    } else {
      const { data } = await supabase.from("addons").insert(payload).select().single();
      if (data) setAddons((prev) => [...prev, data]);
      showToast("Add-on added");
    }
    setSaving(false);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    await supabase.from("addons").delete().eq("id", id);
    setAddons((prev) => prev.filter((a) => a.id !== id));
    showToast("Deleted");
  };

  const toggleActive = async (a: Addon) => {
    const { data } = await supabase.from("addons").update({ is_active: !a.is_active }).eq("id", a.id).select().single();
    if (data) setAddons((prev) => prev.map((x) => (x.id === a.id ? data : x)));
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "addons-template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = (ev.target?.result as string).split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) { showToast("Empty CSV"); return; }
      const rows: Omit<Addon, "id">[] = [];
      for (let i = 1; i < lines.length; i++) {
        const c = lines[i].split(",");
        if (!c[0]?.trim()) continue;
        rows.push({ name: c[0].trim(), category: c[1]?.trim() ?? "", description: c[2]?.trim() ?? "", price_type: c[3]?.trim() === "percentage" ? "percentage" : "fixed", price: parseFloat(c[4]) || 0, cost: parseFloat(c[5]) || 0, is_active: (c[6]?.toLowerCase() ?? "true") !== "false", notes: c[7]?.trim() ?? "", unit: "" });
      }
      if (!rows.length) { showToast("No valid rows"); return; }
      setCsvRows(rows); setShowCsvPreview(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = async () => {
    if (!profileId || !csvRows.length) return;
    setCsvImporting(true);
    if (csvMode === "replace") await supabase.from("addons").delete().eq("profile_id", profileId);
    const { data } = await supabase.from("addons").insert(csvRows.map((r) => ({ ...r, profile_id: profileId }))).select();
    if (csvMode === "replace") setAddons(data ?? []);
    else setAddons((prev) => [...prev, ...(data ?? [])]);
    showToast(`Imported ${csvRows.length} add-ons`);
    setShowCsvPreview(false); setCsvRows([]); setCsvImporting(false);
  };

  const priceLabel = (a: Addon) => a.price_type === "percentage" ? `${a.price}%` : fmtSymbol(a.price, sym);

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "var(--text)", boxShadow: "var(--shadow-xl)", zIndex: 999 }}>{toast}</div>}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>Add-ons</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Extras that appear in Detailed Quote and Package builder.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadTemplate} style={{ padding: "8px 12px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Template</button>
          <button onClick={() => csvRef.current?.click()} style={{ padding: "8px 12px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Import CSV</button>
          <button onClick={openNew} style={{ padding: "8px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Add-on</button>
        </div>
      </div>

      <input ref={csvRef} type="file" accept=".csv" onChange={handleCsvFile} style={{ display: "none" }} />

      {/* CSV Preview */}
      {showCsvPreview && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-xl)", padding: 20, marginBottom: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 12 }}>Import preview — {csvRows.length} rows</p>
          <div style={{ overflowX: "auto", maxHeight: 200, marginBottom: 14, border: "1px solid var(--border)", borderRadius: "var(--r-md)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: "var(--surface-2)" }}>{["Name","Category","Type","Price","Cost"].map((h) => <th key={h} style={{ padding: "6px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>)}</tr></thead>
              <tbody>{csvRows.map((r, i) => <tr key={i}><td style={{ padding: "6px 10px" }}>{r.name}</td><td style={{ padding: "6px 10px", color: "var(--text-3)" }}>{r.category}</td><td style={{ padding: "6px 10px", color: "var(--text-3)" }}>{r.price_type}</td><td style={{ padding: "6px 10px" }}>{r.price_type === "percentage" ? `${r.price}%` : fmtSymbol(r.price, sym)}</td><td style={{ padding: "6px 10px", color: "var(--text-3)" }}>{fmtSymbol(r.cost, sym)}</td></tr>)}</tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}><input type="radio" checked={csvMode === "append"} onChange={() => setCsvMode("append")} style={{ accentColor: "var(--orange)" }} /> Append</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}><input type="radio" checked={csvMode === "replace"} onChange={() => setCsvMode("replace")} style={{ accentColor: "var(--orange)" }} /> Replace all</label>
            <div style={{ flex: 1 }} />
            <button onClick={() => setShowCsvPreview(false)} style={{ padding: "8px 14px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={confirmImport} disabled={csvImporting} style={{ padding: "8px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{csvImporting ? "Importing…" : "Confirm"}</button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-xl)", padding: "20px 22px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 16 }}>{editingId ? "Edit Add-on" : "New Add-on"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={INPUT} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Category</label><input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={INPUT} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Price type</label>
              <select value={form.price_type} onChange={(e) => setForm((f) => ({ ...f, price_type: e.target.value as "fixed" | "percentage" }))} style={{ ...INPUT, cursor: "pointer" }}>
                <option value="fixed">Fixed ({sym})</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>{form.price_type === "percentage" ? "Percentage" : `Price (${sym})`}</label><input type="number" min={0} step={form.price_type === "percentage" ? 1 : 0.01} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))} style={INPUT} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Cost ({sym})</label><input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} style={INPUT} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Description</label><input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} style={INPUT} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Notes</label><input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={INPUT} /></div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ padding: "9px 18px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !form.name.trim() ? 0.5 : 1 }}>{saving ? "Saving…" : "Save"}</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "9px 14px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", marginLeft: 8 }}><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: "var(--orange)" }} /> Active</label>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        {cats.map((c) => <button key={c} onClick={() => setFilterCat(c)} style={{ padding: "5px 12px", borderRadius: 99, border: `1px solid ${filterCat === c ? "var(--orange)" : "var(--border)"}`, background: filterCat === c ? "var(--orange-dim)" : "var(--surface-2)", color: filterCat === c ? "var(--orange)" : "var(--text-3)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{c}</button>)}
      </div>

      {/* List */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        {loading ? <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Loading…</div>
        : filtered.length === 0 ? <div style={{ padding: 48, textAlign: "center" }}><p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>No add-ons yet.</p><button onClick={openNew} style={{ padding: "9px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add first</button></div>
        : filtered.map((a, i) => (
          <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 18px", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", opacity: a.is_active ? 1 : 0.5 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{[a.category, a.price_type === "percentage" ? "Percentage" : "Fixed"].filter(Boolean).join(" · ")}</div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700, color: "var(--orange)", flexShrink: 0 }}>{priceLabel(a)}</div>
            <button onClick={() => toggleActive(a)} style={{ padding: "3px 8px", fontSize: 11, fontWeight: 600, background: a.is_active ? "var(--orange-dim)" : "var(--surface-2)", color: a.is_active ? "var(--orange)" : "var(--text-3)", border: `1px solid ${a.is_active ? "var(--orange-border)" : "var(--border)"}`, borderRadius: 99, cursor: "pointer", flexShrink: 0 }}>{a.is_active ? "Active" : "Off"}</button>
            <button onClick={() => openEdit(a)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12, fontWeight: 600, padding: "4px 6px" }}>Edit</button>
            <button onClick={() => handleDelete(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red, #EF4444)", fontSize: 12, fontWeight: 600, padding: "4px 6px" }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
