"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BrandLogo from "@/components/BrandLogo";
import { PRO_PLAN_PUBLICLY_AVAILABLE } from "@/lib/plans";

export default function SignupPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"tier_1" | "pro">("tier_1");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [notice, setNotice] = useState("");
  const [newsletter, setNewsletter] = useState(true);

  useEffect(() => {
    const plan = new URLSearchParams(window.location.search).get("plan");
    if (plan === "pro" && PRO_PLAN_PUBLICLY_AVAILABLE) setSelectedPlan("pro");
    if (plan === "pro" && !PRO_PLAN_PUBLICLY_AVAILABLE) {
      setSelectedPlan("tier_1");
      setNotice("Pro is coming soon. You can create a Tier 1 account now and upgrade when the AI tools are ready.");
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            business_name: businessName,
            marketing_opt_in: newsletter,
            selected_plan: selectedPlan,
          },
        },
      });
      if (signUpError) { setError(signUpError.message); return; }

      if (data.session) {
        await fetch("/api/account", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            fullName,
            businessName,
            marketingOptIn: newsletter,
            newsletterEnabled: newsletter,
            welcomeEmailEnabled: true,
          }),
        }).catch(() => {});

        await fetch("/api/email/welcome", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ fullName, businessName }),
        }).catch(() => {});
      }

      router.push("/app/dashboard");
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
    });
    if (error) { setError(error.message); setGoogleLoading(false); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F7F4F1" }}>
      <div style={{ backgroundColor: "white", padding: "40px", borderRadius: "16px", width: "100%", maxWidth: "400px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><BrandLogo /></div>
        <p style={{ textAlign: "center", color: "#9A8070", fontSize: "14px", marginBottom: "28px" }}>Create your account</p>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          style={{ width: "100%", padding: "11px", border: "1.5px solid #EDE8E3", borderRadius: "8px", background: "#fff", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", marginBottom: "20px", color: "#1A1208" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/></svg>
          {googleLoading ? "Redirecting..." : "Sign up with Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ flex: 1, height: "1px", background: "#EDE8E3" }} />
          <span style={{ fontSize: "12px", color: "#9A8070" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#EDE8E3" }} />
        </div>

        {success ? (
          <div style={{ background: "#DCFCE7", color: "#16A34A", padding: "14px", borderRadius: "8px", fontSize: "14px", textAlign: "center", lineHeight: 1.5 }}>
            {success}
            <div style={{ marginTop: "12px" }}>
              <Link href="/login" style={{ color: "#F05A00", fontWeight: "700", textDecoration: "none" }}>Go to Sign In →</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSignup}>
            {notice && (
              <div style={{ background: "#FFF4ED", color: "#8A3A00", padding: "10px 12px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px", lineHeight: 1.45, fontWeight: 700 }}>
                {notice}
              </div>
            )}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4A3728" }}>Full name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #EDE8E3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4A3728" }}>Business name</label>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Balloon business name" required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #EDE8E3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4A3728" }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #EDE8E3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4A3728" }}>Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #EDE8E3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px", color: "#4A3728" }}>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" required
                style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #EDE8E3", borderRadius: "8px", fontSize: "14px", outline: "none" }} />
            </div>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12, lineHeight: 1.45, color: "#9A8070", marginBottom: 16 }}>
              <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} style={{ marginTop: 2, accentColor: "#F05A00" }} />
              Send me useful BalloonBase setup tips and product updates.
            </label>

            {error && (
              <div style={{ background: "#FEE2E2", color: "#DC2626", padding: "10px 12px", borderRadius: "8px", marginBottom: "14px", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: "100%", padding: "12px", backgroundColor: loading ? "#ccc" : "#F05A00", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer" }}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "16px", textAlign: "center", fontSize: "13px", color: "#9A8070" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#F05A00", textDecoration: "none", fontWeight: "700" }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
