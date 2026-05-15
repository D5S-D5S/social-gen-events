"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AccountSettings = {
  fullName: string;
  businessName: string;
  phone: string;
  website: string;
  marketingOptIn: boolean;
  newsletterEnabled: boolean;
  welcomeEmailEnabled: boolean;
};

const emptySettings: AccountSettings = {
  fullName: "",
  businessName: "",
  phone: "",
  website: "",
  marketingOptIn: false,
  newsletterEnabled: false,
  welcomeEmailEnabled: true,
};

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [settings, setSettings] = useState<AccountSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadAccount().catch(() => setLoading(false));
  }, []);

  async function loadAccount() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const res = await fetch("/api/account", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    const data = await res.json();
    setEmail(data.email ?? session.user.email ?? "");
    setOriginalEmail(data.email ?? session.user.email ?? "");
    setSettings({ ...emptySettings, ...(data.settings ?? {}) });
    setLoading(false);
  }

  function update<K extends keyof AccountSettings>(key: K, value: AccountSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    if (email && email !== originalEmail) {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) {
        setToast(error.message);
        setSaving(false);
        return;
      }
      setOriginalEmail(email);
      setToast("Email update requested. Check your inbox if confirmation is required.");
    }

    const res = await fetch("/api/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    setToast(res.ok ? "Account saved" : "Could not save account settings");
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading account...</div>;

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && <Toast message={toast} />}

      <Header
        eyebrow="Account"
        title="Account Settings"
        subtitle="Manage the account and business details used across BalloonBase."
        action={<button onClick={save} disabled={saving} style={primaryButton}>{saving ? "Saving..." : "Save Account"}</button>}
      />

      <Section title="Profile">
        <div className="settings-grid">
          <Field title="Full name">
            <input value={settings.fullName} onChange={(e) => update("fullName", e.target.value)} style={inputCss} />
          </Field>
          <Field title="Business name">
            <input value={settings.businessName} onChange={(e) => update("businessName", e.target.value)} style={inputCss} />
          </Field>
          <Field title="Email">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputCss} />
          </Field>
          <Field title="Phone">
            <input value={settings.phone} onChange={(e) => update("phone", e.target.value)} style={inputCss} />
          </Field>
          <Field title="Website">
            <input value={settings.website} onChange={(e) => update("website", e.target.value)} placeholder="https://yourbusiness.com" style={inputCss} />
          </Field>
        </div>
      </Section>

      <Section title="Email Preferences">
        <div className="settings-grid">
          <Toggle title="Welcome email on signup" checked={settings.welcomeEmailEnabled} onChange={(v) => update("welcomeEmailEnabled", v)} />
          <Toggle title="Newsletter opt-in" checked={settings.newsletterEnabled} onChange={(v) => { update("newsletterEnabled", v); update("marketingOptIn", v); }} />
          <Toggle title="Marketing updates" checked={settings.marketingOptIn} onChange={(v) => update("marketingOptIn", v)} />
        </div>
      </Section>

      <Section title="Security">
        <p style={mutedText}>Password resets are handled from the login page. Email changes may require confirmation depending on your Supabase auth settings.</p>
        <button onClick={logout} style={dangerButton}>Log out</button>
      </Section>

      <style jsx>{`
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 900px) {
          .settings-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 620px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function Header({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
      <div>
        <p style={{ color: "var(--orange)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>{eyebrow}</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0, color: "var(--text)" }}>{title}</h1>
        <p style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.55, margin: "6px 0 0" }}>{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-xl)", padding: 22, boxShadow: "var(--shadow-sm)", marginBottom: 16 }}>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 17, color: "var(--text)", margin: "0 0 16px" }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <label><span style={labelCss}>{title}</span>{children}</label>;
}

function Toggle({ title, checked, onChange }: { title: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label>
      <span style={labelCss}>{title}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8, border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", padding: "10px 12px", background: "var(--surface)" }}>
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: "var(--orange)" }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: checked ? "var(--orange)" : "var(--text-3)" }}>{checked ? "On" : "Off"}</span>
      </span>
    </label>
  );
}

function Toast({ message }: { message: string }) {
  return <div style={{ position: "fixed", top: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "var(--text)", boxShadow: "var(--shadow-xl)", zIndex: 999 }}>{message}</div>;
}

const inputCss: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text)",
  padding: "10px 12px",
  fontSize: 13,
  outline: "none",
  fontFamily: "var(--font-ui)",
  boxSizing: "border-box",
};

const labelCss: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 900,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
};

const mutedText: React.CSSProperties = {
  margin: "0 0 14px",
  color: "var(--text-3)",
  fontSize: 13,
  lineHeight: 1.55,
};

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: "var(--r-md)",
  background: "var(--orange)",
  color: "#fff",
  padding: "11px 16px",
  fontSize: 13,
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButton: React.CSSProperties = {
  border: "1.5px solid var(--red-border, #FECACA)",
  borderRadius: "var(--r-md)",
  background: "var(--red-dim, #FEF2F2)",
  color: "var(--red, #EF4444)",
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 900,
  cursor: "pointer",
};
