"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type IntegrationSettings = {
  ghlAccountName: string;
  ghlLocationId: string;
  ghlWhitelabelUrl: string;
  ghlConnectedEmail: string;
  ghlConnectionStatus: "not_connected" | "pending" | "connected";
  customDomain: string;
  storefrontDomain: string;
  fromName: string;
  replyToEmail: string;
  newsletterEnabled: boolean;
  welcomeEmailEnabled: boolean;
};

const defaults: IntegrationSettings = {
  ghlAccountName: "",
  ghlLocationId: "",
  ghlWhitelabelUrl: "",
  ghlConnectedEmail: "",
  ghlConnectionStatus: "not_connected",
  customDomain: "",
  storefrontDomain: "",
  fromName: "BalloonBase",
  replyToEmail: "",
  newsletterEnabled: false,
  welcomeEmailEnabled: true,
};

export default function IntegrationsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<IntegrationSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, []);

  async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.replace("/login");
    return session;
  }

  async function load() {
    const session = await getSession();
    if (!session) return;
    const res = await fetch("/api/account", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const data = await res.json();
    setSettings({ ...defaults, ...(data.settings ?? {}) });
    setLoading(false);
  }

  function update<K extends keyof IntegrationSettings>(key: K, value: IntegrationSettings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    const session = await getSession();
    if (!session) return;
    const next = {
      ...settings,
      ghlConnectionStatus: settings.ghlLocationId || settings.ghlWhitelabelUrl ? settings.ghlConnectionStatus : "not_connected",
    };
    const res = await fetch("/api/account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(next),
    });
    setSaving(false);
    setToast(res.ok ? "Integrations saved" : "Could not save integrations");
  }

  if (loading) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading integrations...</div>;

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && <div style={toastStyle}>{toast}</div>}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={eyebrow}>Connections</p>
          <h1 style={title}>Integrations</h1>
          <p style={subtitle}>Connect the SaaS account to domains, email sending, newsletters, and the white-label GHL account you create for customers.</p>
        </div>
        <button onClick={save} disabled={saving} style={primaryButton}>{saving ? "Saving..." : "Save Integrations"}</button>
      </div>

      <Section title="White-label GHL Connection">
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }} className="two-col">
          <Field title="GHL account / business name">
            <input value={settings.ghlAccountName} onChange={(e) => update("ghlAccountName", e.target.value)} placeholder="Client's white-label account name" style={inputCss} />
          </Field>
          <Field title="Connection status">
            <select value={settings.ghlConnectionStatus} onChange={(e) => update("ghlConnectionStatus", e.target.value as IntegrationSettings["ghlConnectionStatus"])} style={inputCss}>
              <option value="not_connected">Not connected</option>
              <option value="pending">Pending setup</option>
              <option value="connected">Connected</option>
            </select>
          </Field>
        </div>
        <div className="settings-grid" style={{ marginTop: 14 }}>
          <Field title="GHL location ID">
            <input value={settings.ghlLocationId} onChange={(e) => update("ghlLocationId", e.target.value)} placeholder="Location/sub-account ID" style={inputCss} />
          </Field>
          <Field title="White-label login URL">
            <input value={settings.ghlWhitelabelUrl} onChange={(e) => update("ghlWhitelabelUrl", e.target.value)} placeholder="https://login.yourdomain.com" style={inputCss} />
          </Field>
          <Field title="Connected email">
            <input value={settings.ghlConnectedEmail} onChange={(e) => update("ghlConnectedEmail", e.target.value)} placeholder="client@email.com" style={inputCss} />
          </Field>
        </div>
        <p style={hint}>This saves the customer’s white-label GHL details against their BalloonBase account. Full OAuth/API automation can be enabled once GHL client credentials and scopes are available.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <button type="button" onClick={() => update("ghlConnectionStatus", "connected")} style={secondaryButton}>Mark GHL connected</button>
          {settings.ghlWhitelabelUrl && <a href={settings.ghlWhitelabelUrl} target="_blank" style={linkButton}>Open GHL login</a>}
        </div>
      </Section>

      <Section title="Domains">
        <div className="settings-grid">
          <Field title="Custom app domain">
            <input value={settings.customDomain} onChange={(e) => update("customDomain", e.target.value)} placeholder="app.customerbrand.com" style={inputCss} />
          </Field>
          <Field title="Storefront domain">
            <input value={settings.storefrontDomain} onChange={(e) => update("storefrontDomain", e.target.value)} placeholder="book.customerbrand.com" style={inputCss} />
          </Field>
        </div>
        <p style={hint}>Vercel still needs the domain added and DNS pointed correctly. This page keeps the account-level domain settings saved in the app.</p>
      </Section>

      <Section title="Email & Newsletters">
        <div className="settings-grid">
          <Field title="Sender name">
            <input value={settings.fromName} onChange={(e) => update("fromName", e.target.value)} style={inputCss} />
          </Field>
          <Field title="Reply-to email">
            <input value={settings.replyToEmail} onChange={(e) => update("replyToEmail", e.target.value)} style={inputCss} />
          </Field>
          <Toggle title="Welcome emails" checked={settings.welcomeEmailEnabled} onChange={(v) => update("welcomeEmailEnabled", v)} />
          <Toggle title="Newsletter enabled" checked={settings.newsletterEnabled} onChange={(v) => update("newsletterEnabled", v)} />
        </div>
        <p style={hint}>Transactional emails use Resend through the server. Configure RESEND_API_KEY and RESEND_FROM_EMAIL in production before going live.</p>
      </Section>

      <style jsx>{`
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        @media (max-width: 900px) {
          .settings-grid,
          .two-col {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 620px) {
          .settings-grid,
          .two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
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

const eyebrow: React.CSSProperties = { color: "var(--orange)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" };
const title: React.CSSProperties = { fontFamily: "var(--font-display)", fontSize: 28, margin: 0, color: "var(--text)" };
const subtitle: React.CSSProperties = { color: "var(--text-3)", fontSize: 13, lineHeight: 1.55, margin: "6px 0 0" };
const hint: React.CSSProperties = { margin: "14px 0 0", color: "var(--text-3)", fontSize: 12, lineHeight: 1.6 };
const labelCss: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 900, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 };
const inputCss: React.CSSProperties = { width: "100%", border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", color: "var(--text)", padding: "10px 12px", fontSize: 13, outline: "none", fontFamily: "var(--font-ui)", boxSizing: "border-box" };
const primaryButton: React.CSSProperties = { border: "none", borderRadius: "var(--r-md)", background: "var(--orange)", color: "#fff", padding: "11px 16px", fontSize: 13, fontWeight: 900, cursor: "pointer" };
const secondaryButton: React.CSSProperties = { border: "1.5px solid var(--border)", borderRadius: "var(--r-md)", background: "var(--surface)", color: "var(--text-2)", padding: "10px 14px", fontSize: 13, fontWeight: 900, cursor: "pointer" };
const linkButton: React.CSSProperties = { ...secondaryButton, display: "inline-flex", alignItems: "center", textDecoration: "none" };
const toastStyle: React.CSSProperties = { position: "fixed", top: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, fontWeight: 800, color: "var(--text)", boxShadow: "var(--shadow-xl)", zIndex: 999 };
