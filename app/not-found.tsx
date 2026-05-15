"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 96, fontWeight: 900, letterSpacing: "-0.05em", color: "#F3F4F6", lineHeight: 1, marginBottom: 24 }}>
          404
        </div>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: "#0D0D0D", marginBottom: 10 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.65, marginBottom: 36 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/app/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#F05000", color: "#fff", borderRadius: 9, fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
            Go to dashboard
          </Link>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#fff", color: "#374151", border: "1px solid #E5E7EB", borderRadius: 9, fontSize: 14, fontWeight: 600, textDecoration: "none" }}>
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
