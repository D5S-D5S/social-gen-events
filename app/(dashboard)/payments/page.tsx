"use client";

import { useState, useEffect } from "react";
import { getPayments, savePayment, deletePayment, getCustomers, getQuotes } from "@/lib/db";

interface Payment {
  id: string;
  client_name: string;
  amount: number;
  method: string;
  type: string;
  date: string;
  quote_id?: string;
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
}

interface Quote {
  id: string;
  number: string;
  client_name: string;
  total: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedQuote, setSelectedQuote] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [type, setType] = useState("full");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([getPayments(), getCustomers(), getQuotes()]).then(([p, c, q]) => {
      setPayments(p as Payment[]);
      setCustomers(c as Customer[]);
      setQuotes(q as Quote[]);
      setLoading(false);
    });
  }, []);

  const handleAddPayment = async () => {
    if (!selectedClient || !amount) return;
    const created = await savePayment({
      client_name: selectedClient,
      amount: parseFloat(amount),
      method,
      type,
      date: new Date().toISOString().split("T")[0],
      quote_id: selectedQuote || "",
      notes: notes || "",
    });
    if (created) setPayments((prev) => [created as Payment, ...prev]);
    setSelectedClient("");
    setSelectedQuote("");
    setAmount("");
    setMethod("card");
    setType("full");
    setNotes("");
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this payment?")) {
      await deletePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filteredQuotes = quotes.filter((q) => q.client_name === selectedClient);
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div style={{ padding: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#1A1208", fontFamily: "Nunito, sans-serif" }}>Payments</h1>
          <p style={{ color: "#9A8070", fontSize: 13, marginTop: 4 }}>Total collected: <strong style={{ color: "#F05A00" }}>£{totalRevenue.toFixed(2)}</strong></p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ padding: "10px 20px", backgroundColor: "#F05A00", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}
        >
          + Add Payment
        </button>
      </div>

      {loading ? (
        <p style={{ color: "#9A8070" }}>Loading payments...</p>
      ) : payments.length === 0 ? (
        <p style={{ color: "#666" }}>No payments recorded yet.</p>
      ) : (
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Client", "Amount", "Method", "Type", "Date", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#9A8070", textTransform: "uppercase", background: "#F7F4F1", borderBottom: "1px solid #EDE8E3" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: "1px solid #EDE8E3" }}>
                  <td style={{ padding: "12px 14px", color: "#1A1208", fontWeight: 600 }}>{payment.client_name}</td>
                  <td style={{ padding: "12px 14px", color: "#F05A00", fontWeight: 800 }}>£{Number(payment.amount).toFixed(2)}</td>
                  <td style={{ padding: "12px 14px", color: "#666", fontSize: "14px", textTransform: "capitalize" }}>{payment.method.replace("_", " ")}</td>
                  <td style={{ padding: "12px 14px", color: "#666", fontSize: "14px", textTransform: "capitalize" }}>{payment.type}</td>
                  <td style={{ padding: "12px 14px", color: "#666", fontSize: "14px" }}>{payment.date}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <button onClick={() => handleDelete(payment.id)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#FEE2E2", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "#DC2626" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", padding: "32px", maxWidth: "500px", width: "90%" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "24px", color: "#1A1208" }}>Add Payment</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1A1208" }}>Client</label>
              <select
                value={selectedClient}
                onChange={(e) => { setSelectedClient(e.target.value); setSelectedQuote(""); }}
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}
              >
                <option value="">Select client...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {selectedClient && filteredQuotes.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1A1208" }}>Quote (Optional)</label>
                <select value={selectedQuote} onChange={(e) => setSelectedQuote(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
                  <option value="">No quote</option>
                  {filteredQuotes.map((q) => (
                    <option key={q.id} value={q.id}>{q.number} - £{q.total}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1A1208" }}>Amount (£)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }} />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1A1208" }}>Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
                <option value="card">Card</option>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1A1208" }}>Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px" }}>
                <option value="deposit">Deposit</option>
                <option value="balance">Balance</option>
                <option value="full">Full</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "8px", color: "#1A1208" }}>Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes..." style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "8px", minHeight: "80px" }} />
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 20px", backgroundColor: "#eee", border: "none", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleAddPayment} style={{ padding: "10px 20px", backgroundColor: "#F05A00", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>Add Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
