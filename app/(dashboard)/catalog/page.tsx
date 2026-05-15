"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  getPackages, savePackage, updatePackage, deletePackage,
  getInventory, saveInventory, updateInventory,
} from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CatalogProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_active: boolean;
  type: "product";
}

interface CatalogPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  type: "package";
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  color: string;
  size: string;
  quantity_in_stock: number;
  low_stock_threshold: number;
  unit_cost: number;
  supplier: string;
  sku: string;
}

const fmt = (n: number) => `£${(n ?? 0).toFixed(2)}`;
type Tab = "products" | "packages" | "inventory";

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", description: "", price: "", category: "Garlands" });

  const CATEGORIES = ["Garlands", "Arches", "Backdrops", "Balloons", "Display Items", "Other"];

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPackages("product");
    setProducts((data as CatalogProduct[]).map((p) => ({ ...p, category: p.category || "Other" })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const filtered = filterCategory === "All" ? products : products.filter((p) => p.category === filterCategory);

  const handleAdd = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    await savePackage({ name: form.name, description: form.description, price: parseFloat(form.price) || 0, category: form.category, type: "product", is_active: true });
    setForm({ name: "", description: "", price: "", category: "Garlands" });
    setShowAddProduct(false);
    await load();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deletePackage(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleToggleActive = async (p: CatalogProduct) => {
    await updatePackage(p.id, { is_active: !p.is_active });
    setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  if (loading) return <div style={{ color: "#9A8070", fontSize: 13, padding: 20 }}>Loading products…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <p style={{ color: "#9A8070", fontSize: 13 }}>Sellable services & items ({products.length})</p>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", background: "#F7F4F1", border: "1.5px solid #EDE8E3", borderRadius: 8, overflow: "hidden" }}>
            {(["grid", "list"] as const).map((v) => (
              <button key={v} onClick={() => setViewMode(v)} style={{ padding: "6px 12px", border: "none", background: viewMode === v ? "#fff" : "transparent", color: viewMode === v ? "#1A1208" : "#9A8070", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                {v === "grid" ? "Grid" : "List"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAddProduct(true)} style={{ padding: "8px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(240,90,0,0.3)" }}>+ Add Product</button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilterCategory(cat)} style={{ padding: "5px 12px", borderRadius: 99, border: `1.5px solid ${filterCategory === cat ? "#F05A00" : "#EDE8E3"}`, background: filterCategory === cat ? "#FFF3EB" : "#fff", color: filterCategory === cat ? "#F05A00" : "#4A3728", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {cat}
          </button>
        ))}
      </div>

      {products.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9A8070" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📦</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>No products yet</div>
          <div style={{ fontSize: 13 }}>Add products to use them in quotes</div>
        </div>
      ) : viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
          {filtered.map((product) => (
            <div key={product.id} style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: product.is_active ? 1 : 0.55 }}>
              <div style={{ height: 80, background: "#F7F4F1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 28, opacity: 0.4 }}>🎈</span>
              </div>
              <div style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1208" }}>{product.name}</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#F05A00", flexShrink: 0, marginLeft: 8 }}>{fmt(product.price)}</div>
                </div>
                <div style={{ fontSize: 11, color: "#9A8070", marginBottom: 8 }}>{product.description}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#F7F4F1", color: "#4A3728", padding: "2px 7px", borderRadius: 99 }}>{product.category}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleToggleActive(product)} style={{ fontSize: 10, color: product.is_active ? "#16A34A" : "#9A8070", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}>{product.is_active ? "Active" : "Inactive"}</button>
                    <button onClick={() => handleDelete(product.id)} style={{ fontSize: 11, color: "#DC2626", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Category", "Price", "Description", "Status", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9A8070", textTransform: "uppercase", letterSpacing: "0.06em", background: "#F7F4F1", borderBottom: "1px solid #EDE8E3" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #EDE8E3", opacity: p.is_active ? 1 : 0.55 }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{p.name}</td>
                  <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, background: "#F7F4F1", color: "#4A3728", padding: "2px 8px", borderRadius: 99 }}>{p.category}</span></td>
                  <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: "#F05A00" }}>{fmt(p.price)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: "#9A8070", maxWidth: 260 }}>{p.description}</td>
                  <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, background: p.is_active ? "#DCFCE7" : "#F7F4F1", color: p.is_active ? "#16A34A" : "#9A8070", padding: "3px 8px", borderRadius: 99 }}>{p.is_active ? "Active" : "Inactive"}</span></td>
                  <td style={{ padding: "10px 14px" }}><button onClick={() => handleDelete(p.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#FEE2E2", color: "#DC2626", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Remove</button></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9A8070" }}>No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} />

      {showAddProduct && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 460, maxWidth: "95vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>Add Product</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Product Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Classic Balloon Arch" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Description</label>
                <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Price £ *</label>
                <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="40" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none", background: "#fff" }}>
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowAddProduct(false)} style={{ flex: 1, padding: "10px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={{ flex: 2, padding: "10px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : "Add Product"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Packages Tab ─────────────────────────────────────────────────────────────

function PackagesTab() {
  const [packages, setPackages] = useState<CatalogPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CatalogPackage | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getPackages("package");
    setPackages(data as CatalogPackage[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditing(null); setForm({ name: "", description: "", price: "" }); setShowModal(true); };
  const openEdit = (p: CatalogPackage) => { setEditing(p); setForm({ name: p.name, description: p.description || "", price: String(p.price) }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    if (editing) {
      await updatePackage(editing.id, { name: form.name, description: form.description, price: parseFloat(form.price) || 0 });
    } else {
      await savePackage({ name: form.name, description: form.description, price: parseFloat(form.price) || 0, type: "package", is_active: true });
    }
    setShowModal(false);
    await load();
    setSaving(false);
  };

  const handleToggleActive = async (p: CatalogPackage) => {
    await updatePackage(p.id, { is_active: !p.is_active });
    setPackages((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this package?")) return;
    await deletePackage(id);
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  if (loading) return <div style={{ color: "#9A8070", fontSize: 13, padding: 20 }}>Loading packages…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ color: "#9A8070", fontSize: 13 }}>Pre-built bundles ({packages.length})</p>
        <button onClick={openAdd} style={{ padding: "8px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(240,90,0,0.3)" }}>+ New Package</button>
      </div>

      {packages.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9A8070" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>🎁</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>No packages yet</div>
          <div style={{ fontSize: 13 }}>Create bundles to sell as fixed-price packages</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {packages.map((p) => (
            <div key={p.id} style={{ background: "#fff", border: "1.5px solid #EDE8E3", borderRadius: 16, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", opacity: p.is_active ? 1 : 0.6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1208" }}>{p.name}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#F05A00" }}>{fmt(p.price)}</div>
              </div>
              <p style={{ fontSize: 12, color: "#9A8070", marginBottom: 14, lineHeight: 1.5 }}>{p.description || "No description"}</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(p)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#4A3728" }}>Edit</button>
                <button onClick={() => handleToggleActive(p)} style={{ flex: 1, padding: "7px", borderRadius: 8, border: "none", background: p.is_active ? "#DCFCE7" : "#F7F4F1", fontSize: 12, fontWeight: 700, cursor: "pointer", color: p.is_active ? "#16A34A" : "#9A8070" }}>
                  {p.is_active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => handleDelete(p.id)} style={{ padding: "7px 10px", borderRadius: 8, border: "none", background: "#FEE2E2", fontSize: 12, fontWeight: 700, cursor: "pointer", color: "#DC2626" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>{editing ? "Edit Package" : "New Package"}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Package Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Birthday Starter" style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none", resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Price £ *</label>
                <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#4A3728" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#F05A00", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : editing ? "Save Changes" : "Create Package"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Inventory Tab ────────────────────────────────────────────────────────────

function InventoryTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [stockModal, setStockModal] = useState<InventoryItem | null>(null);
  const [stockMode, setStockMode] = useState<"set" | "adjust">("set");
  const [stockValue, setStockValue] = useState("0");

  const BLANK_FORM = { name: "", category: "Balloons", color: "", size: "", quantity_in_stock: 0, low_stock_threshold: 10, unit_cost: 0, supplier: "", sku: "" };
  const [form, setForm] = useState(BLANK_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getInventory();
    setItems(data as InventoryItem[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category).filter(Boolean)))];
  const filtered = items.filter((item) =>
    (category === "All" || item.category === category) &&
    (item.name?.toLowerCase().includes(search.toLowerCase()) || item.supplier?.toLowerCase().includes(search.toLowerCase()))
  );
  const lowStock = items.filter((i) => i.quantity_in_stock <= i.low_stock_threshold);

  const openAdd = () => { setEditing(null); setForm(BLANK_FORM); setShowModal(true); };
  const openEdit = (item: InventoryItem) => {
    setEditing(item);
    setForm({ name: item.name, category: item.category, color: item.color, size: item.size, quantity_in_stock: item.quantity_in_stock, low_stock_threshold: item.low_stock_threshold, unit_cost: item.unit_cost, supplier: item.supplier, sku: item.sku });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    if (editing) {
      await updateInventory(editing.id, form);
    } else {
      await saveInventory(form);
    }
    setShowModal(false);
    await load();
    setSaving(false);
  };

  const openStockModal = (item: InventoryItem) => {
    setStockModal(item);
    setStockMode("set");
    setStockValue(String(item.quantity_in_stock));
  };

  const applyStock = async () => {
    if (!stockModal) return;
    const val = parseInt(stockValue) || 0;
    const newStock = stockMode === "set" ? Math.max(0, val) : Math.max(0, stockModal.quantity_in_stock + val);
    await updateInventory(stockModal.id, { quantity_in_stock: newStock });
    setItems((prev) => prev.map((i) => i.id === stockModal.id ? { ...i, quantity_in_stock: newStock } : i));
    setStockModal(null);
  };

  if (loading) return <div style={{ color: "#9A8070", fontSize: 13, padding: 20 }}>Loading inventory…</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <p style={{ color: "#9A8070", fontSize: 13 }}>{items.length} items · {lowStock.length} low stock</p>
        <button onClick={openAdd} style={{ padding: "8px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(240,90,0,0.3)" }}>+ Add Item</button>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: "#FFF3EB", border: "1.5px solid #FFD5B8", borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>⚠</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#F05A00" }}>{lowStock.length} item{lowStock.length > 1 ? "s" : ""} running low: {lowStock.map((i) => i.name).join(", ")}</span>
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9A8070" }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>📋</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>No inventory yet</div>
          <div style={{ fontSize: 13 }}>Track your stock levels here</div>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input placeholder="Search inventory..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff", width: 200 }} />
            <div style={{ display: "flex", background: "#fff", border: "1.5px solid #EDE8E3", borderRadius: 8, overflow: "hidden" }}>
              {categories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} style={{ padding: "7px 11px", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: category === c ? "#F05A00" : "transparent", color: category === c ? "#fff" : "#9A8070" }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Item", "Category", "Color / Size", "Stock", "Status", "Cost/Unit", "Supplier", "Actions"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9A8070", textTransform: "uppercase", letterSpacing: "0.06em", background: "#F7F4F1", borderBottom: "1px solid #EDE8E3" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isLow = item.quantity_in_stock <= item.low_stock_threshold;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #EDE8E3" }}>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: "#9A8070" }}>{item.sku}</div>
                      </td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{item.category}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}><div>{item.color}</div><div>{item.size}</div></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 14, fontWeight: 800, color: "#1A1208" }}>{item.quantity_in_stock}</span></td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, background: isLow ? "#FEE2E2" : "#DCFCE7", color: isLow ? "#DC2626" : "#16A34A", padding: "3px 8px", borderRadius: 99 }}>{isLow ? "LOW STOCK" : "In Stock"}</span></td>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{fmt(item.unit_cost)}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{item.supplier}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => openEdit(item)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#4A3728" }}>Edit</button>
                          <button onClick={() => openStockModal(item)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #EDE8E3", background: "#FFF3EB", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#F05A00" }}>Stock</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {stockModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: 360, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 4 }}>Update Stock</h2>
            <p style={{ fontSize: 13, color: "#9A8070", marginBottom: 18 }}>{stockModal.name} — current: <strong style={{ color: "#1A1208" }}>{stockModal.quantity_in_stock}</strong></p>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {(["set", "adjust"] as const).map((m) => (
                <button key={m} onClick={() => { setStockMode(m); setStockValue(m === "set" ? String(stockModal.quantity_in_stock) : "0"); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1.5px solid ${stockMode === m ? "#F05A00" : "#EDE8E3"}`, background: stockMode === m ? "#FFF3EB" : "#fff", color: stockMode === m ? "#F05A00" : "#4A3728", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {m === "set" ? "Set to" : "Adjust by"}
                </button>
              ))}
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>{stockMode === "set" ? "New stock level" : "Amount (+/-)"}</label>
              <input type="number" value={stockValue} onChange={(e) => setStockValue(e.target.value)} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              {stockMode === "adjust" && <p style={{ fontSize: 11, color: "#9A8070", marginTop: 4 }}>Result: {Math.max(0, stockModal.quantity_in_stock + (parseInt(stockValue) || 0))} units</p>}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setStockModal(null)} style={{ flex: 1, padding: "10px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={applyStock} style={{ flex: 2, padding: "10px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Update Stock</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 520, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>{editing ? "Edit Item" : "Add Inventory Item"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Item Name *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder='11" Standard Balloons' style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
              </div>
              {([
                { label: "Category", key: "category", type: "select", options: ["Balloons", "Accessories", "Equipment", "Supplies"] },
                { label: "Color", key: "color", placeholder: "Assorted" },
                { label: "Size", key: "size", placeholder: '11"' },
                { label: "SKU", key: "sku", placeholder: "BW-11-ASS" },
                { label: "Stock qty", key: "quantity_in_stock", type: "number" },
                { label: "Low stock alert", key: "low_stock_threshold", type: "number" },
                { label: "Cost per unit £", key: "unit_cost", type: "number" },
                { label: "Supplier", key: "supplier", placeholder: "Balloon World" },
              ] as { label: string; key: string; type?: string; placeholder?: string; options?: string[] }[]).map(({ label, key, type, placeholder, options }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>{label}</label>
                  {type === "select" ? (
                    <select value={form[key as keyof typeof form] as string} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none", background: "#fff" }}>
                      {options?.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type || "text"} value={form[key as keyof typeof form] as string | number} onChange={(e) => setForm((f) => ({ ...f, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#4A3728" }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#F05A00", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Item"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────────────────

function CatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as Tab | null;
  const activeTab: Tab = tabParam && ["products", "packages", "inventory"].includes(tabParam) ? tabParam : "products";
  const setTab = (t: Tab) => router.replace(`/catalog?tab=${t}`);

  const TABS: { key: Tab; label: string }[] = [
    { key: "products", label: "Products" },
    { key: "packages", label: "Packages" },
    { key: "inventory", label: "Inventory" },
  ];

  // Verify auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.replace("/login");
    });
  }, [router]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "Nunito, sans-serif", fontSize: 24, fontWeight: 800, color: "#1A1208", marginBottom: 4 }}>Catalog</h1>
        <p style={{ color: "#9A8070", fontSize: 13 }}>Manage your products, packages, and inventory — all saved to your account</p>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F7F4F1", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setTab(tab.key)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#1A1208" : "#9A8070", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "products" && <ProductsTab />}
      {activeTab === "packages" && <PackagesTab />}
      {activeTab === "inventory" && <InventoryTab />}
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={null}>
      <CatalogContent />
    </Suspense>
  );
}
