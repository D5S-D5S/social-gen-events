"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GlobalSettings } from "@/lib/types";
import { getCurrencySymbol, fmtSymbol } from "@/lib/currency";

interface InvItem { id: string; name: string; category: string; price: number; is_active: boolean; }
interface AddonItem { id: string; name: string; category: string; price_type: "fixed" | "percentage"; price: number; is_active: boolean; }
interface PkgComponent { type: "inventory" | "addon"; itemId: string; quantity: number; name: string; price: number; }

interface Package {
  id: string;
  name: string;
  description: string;
  category: string;
  fixed_price: number;
  cost: number;
  notes: string;
  is_active: boolean;
  include_garland: boolean;
  garland_tier_id: string;
  garland_length: number;
  garland_unit: string;
  components: PkgComponent[];
}

const EMPTY_PKG: Omit<Package, "id"> = {
  name: "", description: "", category: "", fixed_price: 0, cost: 0, notes: "",
  is_active: true, include_garland: false, garland_tier_id: "", garland_length: 8, garland_unit: "ft",
  components: [],
};

const INPUT: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "8px 10px", fontSize: 13, background: "var(--surface)", color: "var(--text)", width: "100%", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

export default function PackagesPage() {
  const [pkgs, setPkgs] = useState<Package[]>([]);
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [inventory, setInventory] = useState<InvItem[]>([]);
  const [addons, setAddons] = useState<AddonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [currency, setCurrency] = useState("GBP");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Package, "id">>(EMPTY_PKG);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const sym = getCurrencySymbol(currency);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      setProfileId(session.user.id);
      const [pkgsRes, invRes, addonsRes, settingsRes] = await Promise.all([
        supabase.from("packages").select("*").eq("profile_id", session.user.id).order("name"),
        supabase.from("inventory").select("id,name,category,price,is_active").eq("profile_id", session.user.id).eq("is_active", true),
        supabase.from("addons").select("id,name,category,price_type,price,is_active").eq("profile_id", session.user.id).eq("is_active", true),
        fetch("/api/settings", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
      ]);
      setPkgs((pkgsRes.data ?? []).map(normalizePkg));
      setInventory(invRes.data ?? []);
      setAddons(addonsRes.data ?? []);
      if (settingsRes) { setSettings(settingsRes); setCurrency(settingsRes.currency ?? "GBP"); }
      setLoading(false);

      // Seed defaults if empty
      if (!pkgsRes.data?.length && settingsRes) {
        const classicId = settingsRes.tiers?.find((t: { active: boolean }) => t.active)?.id ?? "";
        const defaults = [
          { name: "Single Sailboard Display",     description: "Board + balloons",        category: "Sailboard", fixed_price: 195, cost: 80, notes: "", is_active: true, include_garland: true, garland_tier_id: classicId, garland_length: 8, garland_unit: "ft", components: [] },
          { name: "Sailboard + Cake Stand",        description: "Board, balloons, stand",  category: "Sailboard", fixed_price: 220, cost: 95, notes: "", is_active: true, include_garland: true, garland_tier_id: classicId, garland_length: 8, garland_unit: "ft", components: [] },
          { name: "Sailboard + LED Number",        description: "Board, balloons, number", category: "Sailboard", fixed_price: 245, cost: 100, notes: "", is_active: true, include_garland: true, garland_tier_id: classicId, garland_length: 8, garland_unit: "ft", components: [] },
          { name: "Sailboard + Character Cutout",  description: "Board, balloons, cutout", category: "Sailboard", fixed_price: 275, cost: 110, notes: "", is_active: true, include_garland: true, garland_tier_id: classicId, garland_length: 8, garland_unit: "ft", components: [] },
        ];
        const { data: inserted } = await supabase.from("packages").insert(defaults.map((d) => ({ ...d, profile_id: session.user.id }))).select();
        setPkgs((inserted ?? []).map(normalizePkg));
      }
    });
  }, []);

  function normalizePkg(p: Record<string, unknown>): Package {
    return {
      id: p.id as string,
      name: (p.name as string) ?? "",
      description: (p.description as string) ?? "",
      category: (p.category as string) ?? "",
      fixed_price: Number(p.fixed_price) || 0,
      cost: Number(p.cost) || 0,
      notes: (p.notes as string) ?? "",
      is_active: (p.is_active as boolean) ?? true,
      include_garland: (p.include_garland as boolean) ?? false,
      garland_tier_id: (p.garland_tier_id as string) ?? "",
      garland_length: Number(p.garland_length) || 0,
      garland_unit: (p.garland_unit as string) ?? "ft",
      components: Array.isArray(p.components) ? (p.components as PkgComponent[]) : [],
    };
  }

  const openNew = () => {
    setEditingId(null);
    const firstTier = settings?.tiers.find((t) => t.active);
    setForm({ ...EMPTY_PKG, garland_tier_id: firstTier?.id ?? "" });
    setShowForm(true);
  };

  const openEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setForm({ name: pkg.name, description: pkg.description, category: pkg.category, fixed_price: pkg.fixed_price, cost: pkg.cost, notes: pkg.notes, is_active: pkg.is_active, include_garland: pkg.include_garland, garland_tier_id: pkg.garland_tier_id, garland_length: pkg.garland_length, garland_unit: pkg.garland_unit, components: pkg.components });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, profile_id: profileId };
    if (editingId) {
      const { data } = await supabase.from("packages").update(payload).eq("id", editingId).select().single();
      if (data) setPkgs((prev) => prev.map((p) => (p.id === editingId ? normalizePkg(data) : p)));
      showToast("Saved");
    } else {
      const { data } = await supabase.from("packages").insert(payload).select().single();
      if (data) setPkgs((prev) => [...prev, normalizePkg(data)].sort((a, b) => a.name.localeCompare(b.name)));
      showToast("Package added");
    }
    setSaving(false);
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete package?")) return;
    await supabase.from("packages").delete().eq("id", id);
    setPkgs((prev) => prev.filter((p) => p.id !== id));
    showToast("Deleted");
  };

  const toggleActive = async (pkg: Package) => {
    const { data } = await supabase.from("packages").update({ is_active: !pkg.is_active }).eq("id", pkg.id).select().single();
    if (data) setPkgs((prev) => prev.map((p) => (p.id === pkg.id ? normalizePkg(data) : p)));
  };

  const addComponent = (type: "inventory" | "addon", itemId: string) => {
    const item = type === "inventory" ? inventory.find((i) => i.id === itemId) : addons.find((a) => a.id === itemId);
    if (!item) return;
    const existing = form.components.find((c) => c.itemId === itemId && c.type === type);
    if (existing) {
      setForm((f) => ({ ...f, components: f.components.map((c) => c.itemId === itemId && c.type === type ? { ...c, quantity: c.quantity + 1 } : c) }));
    } else {
      setForm((f) => ({ ...f, components: [...f.components, { type, itemId, quantity: 1, name: item.name, price: item.price }] }));
    }
  };

  const removeComponent = (idx: number) => {
    setForm((f) => ({ ...f, components: f.components.filter((_, i) => i !== idx) }));
  };

  const updateComponentQty = (idx: number, qty: number) => {
    if (qty <= 0) { removeComponent(idx); return; }
    setForm((f) => ({ ...f, components: f.components.map((c, i) => i === idx ? { ...c, quantity: qty } : c) }));
  };

  const activeTiers = settings?.tiers.filter((t) => t.active) ?? [];

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, fontWeight: 600, color: "var(--text)", boxShadow: "var(--shadow-xl)", zIndex: 999 }}>{toast}</div>}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>Packages</h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>Bundled offerings with garland, inventory items, and add-ons. Appear in Detailed Quote.</p>
        </div>
        <button onClick={openNew} style={{ padding: "8px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Package</button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-xl)", padding: "22px 24px", marginBottom: 20, boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 18 }}>{editingId ? "Edit Package" : "New Package"}</p>

          {/* Basic info */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Package Name *</label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} style={INPUT} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Category</label><input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Sailboard" style={INPUT} /></div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Description</label>
            <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short description shown in quotes" style={INPUT} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Fixed price ({sym})</label><input type="number" min={0} step={0.01} value={form.fixed_price} onChange={(e) => setForm((f) => ({ ...f, fixed_price: parseFloat(e.target.value) || 0 }))} style={INPUT} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Internal cost ({sym})</label><input type="number" min={0} step={0.01} value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: parseFloat(e.target.value) || 0 }))} style={INPUT} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Notes</label><input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} style={INPUT} /></div>
          </div>

          {/* Garland */}
          <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "14px 16px", marginBottom: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: "var(--text)", cursor: "pointer", marginBottom: form.include_garland ? 12 : 0 }}>
              <input type="checkbox" checked={form.include_garland} onChange={(e) => setForm((f) => ({ ...f, include_garland: e.target.checked }))} style={{ accentColor: "var(--orange)", width: 15, height: 15 }} />
              Include garland
            </label>
            {form.include_garland && activeTiers.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 80px", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Garland tier</label>
                  <select value={form.garland_tier_id} onChange={(e) => setForm((f) => ({ ...f, garland_tier_id: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                    {activeTiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Length</label>
                  <input type="number" min={1} value={form.garland_length} onChange={(e) => setForm((f) => ({ ...f, garland_length: Number(e.target.value) || 0 }))} style={INPUT} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 4 }}>Unit</label>
                  <select value={form.garland_unit} onChange={(e) => setForm((f) => ({ ...f, garland_unit: e.target.value }))} style={{ ...INPUT, cursor: "pointer" }}>
                    <option value="ft">ft</option>
                    <option value="m">m</option>
                  </select>
                </div>
              </div>
            )}
            {form.include_garland && activeTiers.length === 0 && (
              <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 8 }}>No active garland tiers. <a href="/settings" style={{ color: "var(--orange)" }}>Add in Settings →</a></p>
            )}
          </div>

          {/* Inventory items */}
          {inventory.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 8 }}>Add Inventory Items</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select defaultValue="" onChange={(e) => { if (e.target.value) { addComponent("inventory", e.target.value); e.target.value = ""; } }} style={{ ...INPUT, cursor: "pointer" }}>
                  <option value="">Select inventory item…</option>
                  {inventory.map((i) => <option key={i.id} value={i.id}>{i.name} — {fmtSymbol(i.price, sym)}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Add-ons */}
          {addons.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", display: "block", marginBottom: 8 }}>Add Add-ons</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select defaultValue="" onChange={(e) => { if (e.target.value) { addComponent("addon", e.target.value); e.target.value = ""; } }} style={{ ...INPUT, cursor: "pointer" }}>
                  <option value="">Select add-on…</option>
                  {addons.map((a) => <option key={a.id} value={a.id}>{a.name} — {a.price_type === "percentage" ? `${a.price}%` : fmtSymbol(a.price, sym)}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Component list */}
          {form.components.length > 0 && (
            <div style={{ marginBottom: 14, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", overflow: "hidden" }}>
              {form.components.map((c, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: idx < form.components.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", width: 70, flexShrink: 0 }}>{c.type}</span>
                  <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--text)" }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)" }}>{fmtSymbol(c.price, sym)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => updateComponentQty(idx, c.quantity - 1)} style={{ width: 24, height: 24, border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface-2)", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>−</button>
                    <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{c.quantity}</span>
                    <button onClick={() => updateComponentQty(idx, c.quantity + 1)} style={{ width: 24, height: 24, border: "1px solid var(--border)", borderRadius: 4, background: "var(--surface-2)", cursor: "pointer", fontSize: 14, fontWeight: 700 }}>+</button>
                  </div>
                  <button onClick={() => removeComponent(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red, #EF4444)", fontSize: 13, fontWeight: 700 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button onClick={handleSave} disabled={saving || !form.name.trim()} style={{ padding: "9px 18px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: !form.name.trim() ? 0.5 : 1 }}>{saving ? "Saving…" : "Save Package"}</button>
            <button onClick={() => setShowForm(false)} style={{ padding: "9px 14px", background: "var(--surface-2)", color: "var(--text-2)", border: "1px solid var(--border)", borderRadius: "var(--r-md)", fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer", marginLeft: 8 }}><input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} style={{ accentColor: "var(--orange)" }} /> Active</label>
          </div>
        </div>
      )}

      {/* Package list */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        {loading ? <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>Loading…</div>
        : pkgs.length === 0 ? <div style={{ padding: 48, textAlign: "center" }}><p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 12 }}>No packages yet.</p><button onClick={openNew} style={{ padding: "9px 16px", background: "var(--orange)", color: "#fff", border: "none", borderRadius: "var(--r-md)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>+ Add Package</button></div>
        : pkgs.map((pkg, i) => (
          <div key={pkg.id} style={{ padding: "16px 20px", borderBottom: i < pkgs.length - 1 ? "1px solid var(--border)" : "none", opacity: pkg.is_active ? 1 : 0.5 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginBottom: 2 }}>{pkg.name}</div>
                {pkg.description && <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 6 }}>{pkg.description}</div>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {pkg.include_garland && (
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: "var(--orange-dim)", color: "var(--orange)", border: "1px solid var(--orange-border)", borderRadius: 99 }}>
                      {settings?.tiers.find((t) => t.id === pkg.garland_tier_id)?.name ?? "Garland"} {pkg.garland_length}{pkg.garland_unit}
                    </span>
                  )}
                  {pkg.components.map((c, ci) => (
                    <span key={ci} style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", background: "var(--surface-2)", color: "var(--text-3)", border: "1px solid var(--border)", borderRadius: 99 }}>
                      {c.name} ×{c.quantity}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 800, color: "var(--orange)" }}>{fmtSymbol(pkg.fixed_price, sym)}</div>
                <button onClick={() => toggleActive(pkg)} style={{ padding: "3px 8px", fontSize: 11, fontWeight: 600, background: pkg.is_active ? "var(--orange-dim)" : "var(--surface-2)", color: pkg.is_active ? "var(--orange)" : "var(--text-3)", border: `1px solid ${pkg.is_active ? "var(--orange-border)" : "var(--border)"}`, borderRadius: 99, cursor: "pointer" }}>{pkg.is_active ? "Active" : "Off"}</button>
                <button onClick={() => openEdit(pkg)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", fontSize: 12, fontWeight: 600 }}>Edit</button>
                <button onClick={() => handleDelete(pkg.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red, #EF4444)", fontSize: 12, fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 10 }}>Active packages appear in Detailed Quote package selector</p>
    </div>
  );
}
