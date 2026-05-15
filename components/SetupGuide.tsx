"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Step {
  id: string;
  title: string;
  desc: string;
  href: string;
  done: boolean;
}

interface SetupGuideProps {
  hasQuotes: boolean;
  hasCustomers: boolean;
  hasTiers: boolean;
  hasInventory: boolean;
  hasBookingForm: boolean;
  hasCalendar: boolean;
  hasStorefront: boolean;
}

export default function SetupGuide({ hasQuotes, hasCustomers, hasTiers, hasInventory, hasBookingForm, hasCalendar, hasStorefront }: SetupGuideProps) {
  const [dismissed, setDismissed] = useState(false);
  const [profileDone, setProfileDone] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const key = "bb_guide_dismissed";
    if (typeof window !== "undefined" && localStorage.getItem(key)) {
      setDismissed(true);
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.business_name) setProfileDone(true);
    });
  }, []);

  if (dismissed) return null;

  const steps: Step[] = [
    { id: "profile",   title: "Complete your profile",   desc: "Add your business name and contact details.",       href: "/settings",            done: profileDone },
    { id: "tiers",     title: "Set up pricing tiers",    desc: "Create your balloon garland pricing tiers.",        href: "/admin",               done: hasTiers },
    { id: "inventory", title: "Add inventory items",     desc: "Track your balloons, supplies, and equipment.",     href: "/catalog?tab=inventory", done: hasInventory },
    { id: "quote",     title: "Create your first quote", desc: "Generate a professional quote for a client.",       href: "/quotes/new",          done: hasQuotes },
    { id: "form",      title: "Set up a booking form",   desc: "Let clients book and enquire directly.",            href: "/booking-forms",                  done: hasBookingForm },
    { id: "calendar",   title: "Connect Google Calendar",  desc: "Sync your bookings and events automatically.",      href: "/settings?tab=integrations", done: hasCalendar },
    { id: "storefront", title: "Launch your Storefront",   desc: "Publish your public page so clients can find you.", href: "/storefront",                 done: hasStorefront },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const allDone = doneCount === steps.length;

  function dismiss() {
    localStorage.setItem("bb_guide_dismissed", "1");
    setDismissed(true);
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: "18px 20px", boxShadow: "var(--shadow-sm)", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: open ? 16 : 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, cursor: "pointer" }} onClick={() => setOpen(!open)}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: allDone ? "#ECFDF3" : "#FFF4EF", border: `1.5px solid ${allDone ? "#A9EFC5" : "#FBBF9A"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {allDone ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F05000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
              {allDone ? "Setup complete" : "Get started"} · {doneCount}/{steps.length} done
            </div>
            {/* Progress bar */}
            <div style={{ height: 4, background: "#E5E7EB", borderRadius: 99, marginTop: 6, overflow: "hidden", maxWidth: 200 }}>
              <div style={{ height: "100%", width: `${pct}%`, background: allDone ? "#12B76A" : "#F05000", borderRadius: 99, transition: "width 0.4s ease" }} />
            </div>
          </div>
          <svg style={{ color: "var(--text-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
        <button onClick={dismiss} title="Dismiss" style={{ marginLeft: 12, background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 4, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Steps list */}
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {steps.map((step) => (
            <Link key={step.id} href={step.done ? "#" : step.href} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, background: step.done ? "#F9FAFB" : "#fff", border: `1px solid ${step.done ? "#E5E7EB" : "#E5E7EB"}`, textDecoration: "none", transition: "background 0.15s", cursor: step.done ? "default" : "pointer" }}
              onClick={(e) => { if (step.done) e.preventDefault(); }}
            >
              <div style={{ width: 20, height: 20, borderRadius: "50%", background: step.done ? "#ECFDF3" : "#fff", border: `1.5px solid ${step.done ? "#A9EFC5" : "#D1D5DB"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {step.done && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#12B76A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: step.done ? "var(--text-3)" : "var(--text)", textDecoration: step.done ? "line-through" : "none" }}>
                  {step.title}
                </div>
                {!step.done && <div style={{ fontSize: 12, color: "var(--text-3)" }}>{step.desc}</div>}
              </div>
              {!step.done && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
