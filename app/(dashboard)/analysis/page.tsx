"use client";

import { useState, useEffect } from "react";
import { getQuotes, getCustomers, getPayments } from "@/lib/db";

type Payment = { created_at: string; amount: number; method: string; method_other?: string };
type Quote = { status: string; total: number; client_name: string };

function getMonthlyRevenue(payments: Payment[]) {
  const months: Record<string, number> = {};
  payments.forEach((p) => {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months[key] = (months[key] ?? 0) + Number(p.amount);
  });
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("default", { month: "short" });
    result.push({ key, label, amount: months[key] ?? 0 });
  }
  return result;
}

const fmt = (n: number) =>
  `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const STATUS_COLORS: Record<string, string> = {
  draft: "#9A8070",
  sent: "#F59E0B",
  won: "#16A34A",
  paid: "#16A34A",
  cancelled: "#DC2626",
  lost: "#EF4444",
};

const METHOD_COLORS = ["#F05A00", "#635BFF", "#16A34A", "#F59E0B", "#9A8070"];

export default function AnalysisPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<unknown[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getQuotes(), getCustomers(), getPayments()]).then(([q, c, p]) => {
      setQuotes(q as Quote[]);
      setCustomers(c);
      setPayments(p as Payment[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#9A8070", fontSize: 14, fontWeight: 600 }}>
        Loading analysis...
      </div>
    );
  }

  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount), 0);
  const avgQuoteValue = quotes.length ? quotes.reduce((s, q) => s + Number(q.total), 0) / quotes.length : 0;
  const sentQuotes = quotes.filter((q) => q.status === "sent").length;
  const wonQuotes = quotes.filter((q) => q.status === "won" || q.status === "paid").length;
  const conversionRate = (sentQuotes + wonQuotes) > 0 ? Math.round((wonQuotes / (sentQuotes + wonQuotes)) * 100) : 0;

  const monthly = getMonthlyRevenue(payments);
  const maxMonthly = Math.max(...monthly.map((m) => m.amount), 1);

  const statusCounts: Record<string, number> = {};
  quotes.forEach((q) => { statusCounts[q.status] = (statusCounts[q.status] ?? 0) + 1; });

  const methodTotals: Record<string, number> = {};
  payments.forEach((p) => {
    const m = p.method === "other" ? (p.method_other || "Other") : p.method;
    methodTotals[m] = (methodTotals[m] ?? 0) + Number(p.amount);
  });

  const customerMap: Record<string, { name: string; count: number; revenue: number }> = {};
  quotes.forEach((q) => {
    if (!customerMap[q.client_name]) customerMap[q.client_name] = { name: q.client_name, count: 0, revenue: 0 };
    customerMap[q.client_name].count++;
    customerMap[q.client_name].revenue += Number(q.total);
  });
  const topCustomers = Object.values(customerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const methodEntries = Object.entries(methodTotals).sort((a, b) => b[1] - a[1]);
  const methodTotal = methodEntries.reduce((s, [, a]) => s + a, 0);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "Nunito, sans-serif", fontSize: 24, fontWeight: 800, color: "#1A1208", marginBottom: 4 }}>Analysis</h1>
        <p style={{ color: "#9A8070", fontSize: 13 }}>Business performance overview</p>
      </div>

      {/* Stats cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { label: "Total Revenue", value: fmt(totalRevenue), sub: `${payments.length} payment${payments.length !== 1 ? "s" : ""}`, color: "#16A34A" },
          { label: "Total Quotes", value: quotes.length.toString(), sub: `${sentQuotes} active`, color: "#F05A00" },
          { label: "Customers", value: customers.length.toString(), sub: "all time", color: "#1A1208" },
          { label: "Avg Quote Value", value: fmt(avgQuoteValue), sub: `${conversionRate}% conversion`, color: "#635BFF" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontSize: 12, color: "#9A8070", fontWeight: 600, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "Nunito, sans-serif", color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "#9A8070" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Monthly revenue bar chart */}
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1A1208", marginBottom: 20 }}>Monthly Revenue</h2>
          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9A8070", fontSize: 13 }}>No payment data yet</div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 160 }}>
              {monthly.map((m) => (
                <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 10, color: "#9A8070", fontWeight: 700, minHeight: 14 }}>
                    {m.amount > 0 ? fmt(m.amount) : ""}
                  </div>
                  <div style={{ width: "100%", background: "#F7F4F1", borderRadius: "6px 6px 0 0", position: "relative", height: 110 }}>
                    <div style={{
                      position: "absolute", bottom: 0, left: 0, right: 0,
                      background: m.amount > 0 ? "#F05A00" : "transparent",
                      borderRadius: "6px 6px 0 0",
                      height: `${(m.amount / maxMonthly) * 100}%`,
                      minHeight: m.amount > 0 ? 6 : 0,
                      transition: "height 0.3s",
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9A8070", fontWeight: 600 }}>{m.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quote status */}
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>Quote Status</h2>
          {quotes.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9A8070", fontSize: 13 }}>No quotes yet</div>
          ) : (
            <div>
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 700, color: "#1A1208", textTransform: "capitalize" }}>{status}</span>
                    <span style={{ color: "#9A8070" }}>{count} ({Math.round((count / quotes.length) * 100)}%)</span>
                  </div>
                  <div style={{ height: 8, background: "#F7F4F1", borderRadius: 99, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(count / quotes.length) * 100}%`, background: STATUS_COLORS[status] ?? "#9A8070", borderRadius: 99 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

        {/* Top customers */}
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>Top Customers by Revenue</h2>
          {topCustomers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9A8070", fontSize: 13 }}>No data yet</div>
          ) : (
            topCustomers.map((c, i) => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < topCustomers.length - 1 ? "1px solid #F7F4F1" : "none" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FFF3EB", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#F05A00", flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1208", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#9A8070" }}>{c.count} quote{c.count !== 1 ? "s" : ""}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#16A34A", flexShrink: 0 }}>{fmt(c.revenue)}</div>
              </div>
            ))
          )}
        </div>

        {/* Payment methods */}
        <div style={{ background: "#fff", border: "1px solid #EDE8E3", borderRadius: 18, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1A1208", marginBottom: 18 }}>Payment Methods</h2>
          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9A8070", fontSize: 13 }}>No payments yet</div>
          ) : (
            methodEntries.map(([method, amount], i) => (
              <div key={method} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ fontWeight: 700, color: "#1A1208", textTransform: "capitalize" }}>{method}</span>
                  <span style={{ color: "#9A8070" }}>{fmt(amount)} · {Math.round((amount / methodTotal) * 100)}%</span>
                </div>
                <div style={{ height: 8, background: "#F7F4F1", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(amount / methodTotal) * 100}%`, background: METHOD_COLORS[i % METHOD_COLORS.length], borderRadius: 99 }} />
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
