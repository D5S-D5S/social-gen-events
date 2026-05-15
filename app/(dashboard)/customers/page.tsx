"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getCustomers, saveCustomer, updateCustomer, deleteCustomer } from "@/lib/db";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
  total_spent: number;
  quotes_count: number;
  created_at: string;
}

const fmt = (n: number) => `£${Number(n).toFixed(2)}`;

function CustomersPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", notes: "" });

  useEffect(() => {
    getCustomers().then((data) => {
      setCustomers(data as Customer[]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setSearch(q);
  }, [searchParams]);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", city: "", notes: "" });
    setShowModal(true);
  };

  const openEdit = (e: React.MouseEvent, c: Customer) => {
    e.stopPropagation();
    setEditing(c);
    setForm({ name: c.name, email: c.email, phone: c.phone, city: c.city, notes: c.notes });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    if (editing) {
      const updated = await updateCustomer(editing.id, form);
      setCustomers((prev) => prev.map((c) => c.id === editing.id ? { ...c, ...(updated as Customer) } : c));
    } else {
      const created = await saveCustomer({ ...form, total_spent: 0, quotes_count: 0, created_at: new Date().toISOString().slice(0, 10) });
      if (created) setCustomers((prev) => [...prev, created as Customer]);
    }
    setShowModal(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this customer?")) {
      await deleteCustomer(id);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "Nunito, sans-serif", fontSize: 24, fontWeight: 800, color: "#1A1208", marginBottom: 4 }}>Customers</h1>
          <p style={{ color: "#9A8070", fontSize: 13 }}>{customers.length} clients · £{customers.reduce((s, c) => s + Number(c.total_spent), 0).toLocaleString()} total revenue</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff", width: 220 }} />
          <button onClick={openAdd} style={{ padding: "8px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 8px rgba(240,90,0,0.3)" }}>
            + Add Customer
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#9A8070" }}>Loading customers...</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Customer", "Contact", "City", "Quotes", "Total Spent", "Actions"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9A8070", textTransform: "uppercase", letterSpacing: "0.06em", background: "#F7F4F1", borderBottom: "1px solid #EDE8E3" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => router.push(`/customers/${c.id}`)} style={{ borderBottom: "1px solid #EDE8E3", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={(e) => (e.currentTarget.style.background = "#FAFAF9")} onMouseLeave={(e) => (e.currentTarget.style.background = "")}>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, #F05A00, #FFD5B8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{c.name}</div>
                        {c.notes && <div style={{ fontSize: 11, color: "#9A8070", marginTop: 1 }}>{c.notes}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ fontSize: 12, color: "#1A1208" }}>{c.email}</div>
                    <div style={{ fontSize: 12, color: "#9A8070" }}>{c.phone}</div>
                  </td>
                  <td style={{ padding: "14px", fontSize: 13, color: "#9A8070" }}>{c.city}</td>
                  <td style={{ padding: "14px" }}><span style={{ fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{c.quotes_count}</span></td>
                  <td style={{ padding: "14px", fontSize: 14, fontWeight: 800, color: "#F05A00" }}>{fmt(c.total_spent)}</td>
                  <td style={{ padding: "14px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={(e) => openEdit(e, c)} style={{ padding: "5px 10px", borderRadius: 6, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#4A3728" }}>Edit</button>
                      <button onClick={(e) => handleDelete(e, c.id)} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: "#FEE2E2", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#DC2626" }}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: "center", color: "#9A8070", fontSize: 13 }}>No customers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 20 }}>{editing ? "Edit Customer" : "Add Customer"}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([
                { label: "Full Name *", key: "name", placeholder: "Sarah Mitchell" },
                { label: "Email", key: "email", placeholder: "sarah@email.com" },
                { label: "Phone", key: "phone", placeholder: "07700 900 123" },
                { label: "City", key: "city", placeholder: "London" },
              ] as { label: string; key: string; placeholder: string }[]).map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>{label}</label>
                  <input value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none" }} />
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#4A3728", marginBottom: 4 }}>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this customer..." rows={2} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#4A3728" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#F05A00", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                {editing ? "Save Changes" : "Add Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={null}>
      <CustomersPageInner />
    </Suspense>
  );
}
