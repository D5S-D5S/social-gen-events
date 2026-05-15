"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Quote } from "@/lib/types";
import Link from "next/link";

const fmt = (n: number) =>
  `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function DashboardHome() {
  const router = useRouter();
  const [stats, setStats] = useState({ quotes: 0, quoteValue: 0, inventory: 0, packages: 0, addons: 0 });
  const [loading, setLoading] = useState(true);
  const [setup, setSetup] = useState({ hasInventory: false, hasPackages: false, hasAddons: false, hasQuotes: false });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const [quotesRes, inventoryRes, packagesRes, addonsRes] = await Promise.all([
        fetch("/api/quotes", { headers: { Authorization: `Bearer ${session.access_token}` } }).then((r) => r.json() as Promise<Quote[]>).catch(() => [] as Quote[]),
        supabase.from("inventory_items").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
        supabase.from("addons").select("id", { count: "exact", head: true }).eq("user_id", session.user.id),
      ]);

      const quotes = Array.isArray(quotesRes) ? quotesRes : [];
      const quoteValue = quotes.reduce((s, q) => s + Number(q.breakdown?.subtotal ?? q.breakdown?.total ?? 0), 0);

      setStats({
        quotes: quotes.length,
        quoteValue,
        inventory: inventoryRes.count ?? 0,
        packages: packagesRes.count ?? 0,
        addons: addonsRes.count ?? 0,
      });
      setSetup({
        hasInventory: (inventoryRes.count ?? 0) > 0,
        hasPackages: (packagesRes.count ?? 0) > 0,
        hasAddons: (addonsRes.count ?? 0) > 0,
        hasQuotes: quotes.length > 0,
      });
      setLoading(false);
    }
    load();
  }, [router]);

  const STATS = [
    { label: "Total Quotes",    value: loading ? "—" : String(stats.quotes),      accent: "var(--text)",   bg: "var(--surface-2)",  border: "var(--border)" },
    { label: "Quote Value",     value: loading ? "—" : fmt(stats.quoteValue),      accent: "var(--orange)", bg: "var(--orange-dim)", border: "var(--orange-border)" },
    { label: "Inventory Items", value: loading ? "—" : String(stats.inventory),    accent: "var(--text-2)", bg: "var(--surface-2)",  border: "var(--border)" },
    { label: "Packages",        value: loading ? "—" : String(stats.packages),     accent: "var(--text-2)", bg: "var(--surface-2)",  border: "var(--border)" },
    { label: "Add-ons",         value: loading ? "—" : String(stats.addons),       accent: "var(--text-2)", bg: "var(--surface-2)",  border: "var(--border)" },
  ];

  const ACTIONS = [
    { href: "/app/quick-quote",    label: "Create Quick Quote",    primary: true },
    { href: "/app/detailed-quote", label: "Create Detailed Quote", primary: false },
    { href: "/app/quotes",         label: "View Quotes",           primary: false },
    { href: "/app/inventory",      label: "Add Inventory Item",    primary: false },
    { href: "/app/packages",       label: "Create Package",        primary: false },
    { href: "/app/add-ons",        label: "Add Add-on",            primary: false },
  ];

  const CHECKLIST = [
    { done: setup.hasInventory, label: "Add inventory items",  href: "/app/inventory" },
    { done: setup.hasPackages,  label: "Create packages",      href: "/app/packages"  },
    { done: setup.hasAddons,    label: "Create add-ons",       href: "/app/add-ons"   },
    { done: setup.hasQuotes,    label: "Create first quote",   href: "/app/detailed-quote" },
  ];
  const allDone = CHECKLIST.every((c) => c.done);

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-3)", marginBottom: 6, letterSpacing: "0.02em" }}>{today}</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.03em", marginBottom: 4 }}>
          {greeting}
        </h1>
        <p style={{ color: "var(--text-3)", fontSize: 14 }}>Here&apos;s an overview of your business today.</p>
      </div>

      {/* Setup checklist */}
      {!loading && !allDone && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--orange-border)", borderRadius: "var(--r-xl)", padding: "20px 22px", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--orange)", marginBottom: 14, letterSpacing: "-0.01em" }}>
            Get started
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {CHECKLIST.map((item) => (
              <Link key={item.href} href={item.done ? "#" : item.href} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", opacity: item.done ? 0.5 : 1 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${item.done ? "var(--orange)" : "var(--border)"}`, background: item.done ? "var(--orange)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {item.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 13, fontWeight: 500, color: item.done ? "var(--text-3)" : "var(--text-2)", textDecoration: item.done ? "line-through" : "none" }}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        {STATS.map((stat) => (
          <div key={stat.label} style={{ background: "var(--surface)", border: `1px solid ${stat.border}`, borderRadius: "var(--r-xl)", padding: "18px 20px", boxShadow: "var(--shadow-sm)", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 48, height: 48, background: stat.bg, borderRadius: "0 var(--r-xl) 0 48px" }} />
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>{stat.label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 700, color: stat.accent, letterSpacing: "-0.03em" }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "20px 22px", boxShadow: "var(--shadow-sm)", width: "100%" }}>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 14, letterSpacing: "-0.01em" }}>Quick Actions</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: a.primary ? "var(--orange)" : "var(--surface-2)", border: `1px solid ${a.primary ? "transparent" : "var(--border)"}`, borderRadius: "var(--r-md)", color: a.primary ? "#fff" : "var(--text)", fontSize: 13, fontWeight: 600, textDecoration: "none", boxShadow: a.primary ? "0 1px 4px rgba(240,80,0,0.25)" : "var(--shadow-xs)" }}>
              <span>{a.label}</span>
              <span style={{ fontSize: 11, opacity: 0.5 }}>→</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
