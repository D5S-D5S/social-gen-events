"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCustomer, updateCustomer, getCustomerNotes, saveCustomerNote, deleteCustomerNote, getQuotes, getPayments } from "@/lib/db";

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

interface Note {
  id: string;
  text: string;
  created_at: string;
}

interface Quote {
  id: string;
  number: string;
  client_name: string;
  total: number;
  status: string;
  date: string;
}

interface Payment {
  id: string;
  quote_id: string;
  client_name: string;
  amount: number;
  method: string;
  type: string;
  date: string;
  notes: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: "#F7F4F1", color: "#9A8070" },
  sent: { bg: "#DBEAFE", color: "#1D4ED8" },
  accepted: { bg: "#DCFCE7", color: "#16A34A" },
  declined: { bg: "#FEE2E2", color: "#DC2626" },
};

const fmt = (n: number) => `£${Number(n).toFixed(2)}`;

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [newNote, setNewNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", notes: "" });
  const [activeTab, setActiveTab] = useState<"quotes" | "payments" | "notes">("quotes");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCustomer(params.id),
      getCustomerNotes(params.id),
      getQuotes(),
      getPayments(),
    ]).then(([cust, noteData, quoteData, paymentData]) => {
      if (cust) {
        const c = cust as Customer;
        setCustomer(c);
        setForm({ name: c.name, email: c.email, phone: c.phone, city: c.city, notes: c.notes });
      }
      setNotes(noteData as Note[]);
      const allQuotes = quoteData as Quote[];
      const allPayments = paymentData as Payment[];
      if (cust) {
        const c = cust as Customer;
        setQuotes(allQuotes.filter((q) => q.client_name === c.name));
        setPayments(allPayments.filter((p) => p.client_name === c.name));
      }
      setLoading(false);
    });
  }, [params.id]);

  const handleSave = async () => {
    if (!customer) return;
    await updateCustomer(customer.id, form);
    setCustomer((prev) => prev ? { ...prev, ...form } : null);
    setEditing(false);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const note = await saveCustomerNote(params.id, newNote.trim());
    if (note) {
      setNotes((prev) => [note as Note, ...prev]);
      setNewNote("");
    }
  };

  const handleDeleteNote = async (id: string) => {
    await deleteCustomerNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  if (loading) {
    return <div style={{ padding: 40, color: "#9A8070" }}>Loading...</div>;
  }

  if (!customer) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#9A8070" }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Customer not found</div>
        <button onClick={() => router.push("/customers")} style={{ marginTop: 16, padding: "8px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Back to Customers
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => router.push("/customers")} style={{ padding: "7px 12px", background: "#F7F4F1", color: "#4A3728", border: "1.5px solid #EDE8E3", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Back</button>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, #F05A00, #FFD5B8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: "#fff" }}>
            {customer.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontFamily: "Nunito, sans-serif", fontSize: 22, fontWeight: 800, color: "#1A1208" }}>{customer.name}</div>
            <div style={{ fontSize: 12, color: "#9A8070" }}>{customer.city} · Customer since {customer.created_at}</div>
          </div>
        </div>
        <button onClick={() => setEditing(true)} style={{ padding: "8px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
          Edit Profile
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Spent", value: fmt(customer.total_spent), color: "#F05A00" },
          { label: "Quotes", value: quotes.length, color: "#1A1208" },
          { label: "Payments", value: payments.length, color: "#1A1208" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 14, padding: 18, textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "Nunito, sans-serif", color: s.color, marginBottom: 2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#9A8070", fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1208", marginBottom: 14 }}>Contact Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          {[
            { label: "Email", value: customer.email },
            { label: "Phone", value: customer.phone },
            { label: "City", value: customer.city },
          ].map((d) => (
            <div key={d.label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9A8070", marginBottom: 2 }}>{d.label}</div>
              <div style={{ fontSize: 14, color: "#1A1208", fontWeight: 600 }}>{d.value || ""}</div>
            </div>
          ))}
        </div>
        {customer.notes && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #EDE8E3" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9A8070", marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 13, color: "#4A3728" }}>{customer.notes}</div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#F7F4F1", borderRadius: 10, padding: 4, width: "fit-content" }}>
        {([
          { key: "quotes", label: `Quotes (${quotes.length})` },
          { key: "payments", label: `Payments (${payments.length})` },
          { key: "notes", label: `Notes (${notes.length})` },
        ] as { key: "quotes" | "payments" | "notes"; label: string }[]).map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: activeTab === tab.key ? "#fff" : "transparent", color: activeTab === tab.key ? "#1A1208" : "#9A8070", fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "quotes" && (
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden" }}>
          {quotes.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9A8070" }}><div style={{ fontSize: 13, fontWeight: 600 }}>No quotes yet</div></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Quote #", "Date", "Total", "Status"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9A8070", textTransform: "uppercase", background: "#F7F4F1", borderBottom: "1px solid #EDE8E3" }}>{h}</th>)}</tr></thead>
              <tbody>
                {quotes.map((q) => {
                  const sc = STATUS_COLORS[q.status] || STATUS_COLORS.draft;
                  return (
                    <tr key={q.id} style={{ borderBottom: "1px solid #EDE8E3" }}>
                      <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 700, color: "#1A1208" }}>{q.number}</td>
                      <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{q.date}</td>
                      <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 800, color: "#F05A00" }}>{fmt(q.total)}</td>
                      <td style={{ padding: "12px 14px" }}><span style={{ fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color, padding: "3px 8px", borderRadius: 99 }}>{q.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 16, overflow: "hidden" }}>
          {payments.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#9A8070" }}><div style={{ fontSize: 13, fontWeight: 600 }}>No payments recorded</div></div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>{["Date", "Amount", "Method", "Type", "Notes"].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9A8070", textTransform: "uppercase", background: "#F7F4F1", borderBottom: "1px solid #EDE8E3" }}>{h}</th>)}</tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #EDE8E3" }}>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{p.date}</td>
                    <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 800, color: "#F05A00" }}>{fmt(p.amount)}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#4A3728", textTransform: "capitalize" }}>{p.method.replace("_", " ")}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#4A3728", textTransform: "capitalize" }}>{p.type}</td>
                    <td style={{ padding: "12px 14px", fontSize: 12, color: "#9A8070" }}>{p.notes || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "notes" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <input value={newNote} onChange={(e) => setNewNote(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addNote()} placeholder="Add a note..." style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 13, outline: "none", background: "#fff" }} />
            <button onClick={addNote} style={{ padding: "9px 16px", background: "#F05A00", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Add</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {notes.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "#9A8070", background: "#F7F4F1", borderRadius: 14 }}><div style={{ fontSize: 13, fontWeight: 600 }}>No notes yet</div></div>
            ) : (
              notes.map((note) => (
                <div key={note.id} style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#1A1208", lineHeight: 1.5 }}>{note.text}</div>
                    <div style={{ fontSize: 11, color: "#9A8070", marginTop: 4 }}>{new Date(note.created_at).toLocaleString("en-GB")}</div>
                  </div>
                  <button onClick={() => handleDeleteNote(note.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9A8070", fontSize: 16, padding: 0, flexShrink: 0 }}>×</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 20, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>Edit Customer</h2>
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
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #EDE8E3", fontSize: 14, outline: "none", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button onClick={() => setEditing(false)} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #EDE8E3", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#4A3728" }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "#F05A00", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
