"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { setError(error.message); return; }
      setSuccess(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F7F4F1" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "8px", textAlign: "center", color: "#1A1208", fontFamily: "Nunito, sans-serif" }}>Reset Password</h1>
        <p style={{ textAlign: "center", color: "#9A8070", fontSize: "14px", marginBottom: "28px" }}>Enter your email and we&apos;ll send a reset link</p>

        {success ? (
          <div style={{ background: "#DCFCE7", color: "#16A34A", padding: "16px", borderRadius: "8px", fontSize: "14px", textAlign: "center", lineHeight: 1.6 }}>
            Check your email for a password reset link.
            <div style={{ marginTop: "12px" }}>
              <Link href="/login" style={{ color: "#F05A00", fontWeight: "700", textDecoration: "none" }}>Back to Sign In →</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4A3728" }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #EDE8E3", borderRadius: "8px", fontSize: "14px", outline: "none" }}
              />
            </div>

            {error && (
              <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 12px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", backgroundColor: loading ? "#ccc" : "#F05A00", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#9A8070" }}>
          <Link href="/login" style={{ color: "#F05A00", textDecoration: "none", fontWeight: "700" }}>← Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
