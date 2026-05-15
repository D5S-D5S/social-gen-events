"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#FEF2F2", border: "1.5px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "#0D0D0D", marginBottom: 10 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.65, marginBottom: 32 }}>
          An unexpected error occurred. We&apos;ve been notified and will look into it.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", background: "#F05000", color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            Try again
          </button>
          <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", background: "#fff", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}
