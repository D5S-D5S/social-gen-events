"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { GlobalSettings, Tier } from "@/lib/types";
import { isAdminEmail } from "@/lib/admin";

type Usage = {
  planName: string;
  aiTokensIncluded: number;
  aiTokensUsed: number;
  aiTokensRemaining: number;
  mockupTokensIncluded?: number;
};

const CURRENCIES = ["GBP", "USD", "EUR", "AUD", "CAD"];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [user, setUser] = useState<{ email: string; id: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: GlobalSettings) => setSettings(data))
      .catch(() => {});

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUser({ id: user.id, email: user.email ?? "" });
      setIsAdmin(isAdminEmail(user.email));

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      fetch("/api/billing/status", { headers: { Authorization: `Bearer ${session.access_token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (!data) return;
          setUsage({
            planName: data.planName ?? "TR1",
            aiTokensIncluded: Number(data.aiTokensIncluded ?? 0),
            aiTokensUsed: Number(data.aiTokensUsed ?? 0),
            aiTokensRemaining: Number(data.aiTokensRemaining ?? 0),
            mockupTokensIncluded: Number(data.mockupTokensIncluded ?? data.aiTokensIncluded ?? 0),
          });
        })
        .catch(() => {});
    });
  }, []);

  function update(updates: Partial<GlobalSettings>) {
    setSettings((prev) => prev ? { ...prev, ...updates } : prev);
  }

  function updateDelivery(updates: Partial<GlobalSettings["delivery"]>) {
    setSettings((prev) => prev ? { ...prev, delivery: { ...prev.delivery, ...updates } } : prev);
  }

  function updateTier(index: number, updates: Partial<Tier>) {
    setSettings((prev) => {
      if (!prev) return prev;
      const tiers = [...prev.tiers];
      tiers[index] = { ...tiers[index], ...updates };
      return { ...prev, tiers };
    });
  }

  function addTier() {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tiers: [
          ...prev.tiers,
          {
            id: `tier-${Date.now()}`,
            name: `Tier ${prev.tiers.length + 1}`,
            pricePerFt: 0,
            pricePerM: 0,
            description: "",
            active: true,
            sortOrder: prev.tiers.length + 1,
          },
        ],
      };
    });
  }

  function removeTier(index: number) {
    setSettings((prev) => prev ? { ...prev, tiers: prev.tiers.filter((_, i) => i !== index) } : prev);
  }

  async function save() {
    if (!settings) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    if (res.ok) {
      showToast("Settings saved");
    } else {
      const data = await res.json().catch(() => null);
      showToast(data?.error ?? "Could not save settings");
    }
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  async function handleManageSubscription() {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else showToast("Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (!settings) return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading Settings...</div>;

  const mockupUsed = usage?.aiTokensUsed ?? settings.mockupTokensUsed ?? 0;
  const mockupIncluded = usage?.mockupTokensIncluded ?? settings.mockupTokensIncluded ?? 0;

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && <div style={{ position: "fixed", top: 20, right: 20, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, fontWeight: 700, color: "var(--text)", boxShadow: "var(--shadow-xl)", zIndex: 999 }}>{toast}</div>}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <p style={{ color: "var(--orange)", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Global Settings</p>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0, color: "var(--text)" }}>Settings</h1>
          <p style={{ color: "var(--text-3)", fontSize: 13, lineHeight: 1.55 }}>Defaults used by Quick Quote, Detailed Quote, AI Length Estimator, and future tools.</p>
        </div>
        <button onClick={save} disabled={saving} style={primaryButton}>{saving ? "Saving..." : "Save Settings"}</button>
      </div>

      <Section title="Quote Defaults">
        <div className="settings-grid">
          <Field title="Currency">
            <select value={settings.currency} onChange={(e) => update({ currency: e.target.value })} style={inputCss}>
              {CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
            </select>
          </Field>
          <Field title="Measurement unit">
            <select value={settings.defaultUnit} onChange={(e) => update({ defaultUnit: e.target.value as "ft" | "m" })} style={inputCss}>
              <option value="ft">Feet</option>
              <option value="m">Metres</option>
            </select>
          </Field>
          <Field title="Deposit percentage">
            <input type="number" min={0} max={100} value={settings.depositPercent} onChange={(e) => update({ depositPercent: Number(e.target.value) })} style={inputCss} />
          </Field>
        </div>
      </Section>

      <Section title="Tier Pricing">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <p style={{ margin: 0, color: "var(--text-3)", fontSize: 13 }}>Control tier names, prices, and active tiers.</p>
          <button onClick={addTier} style={secondaryButton}>Add tier</button>
        </div>
        <div style={{ display: "grid", gap: 12 }}>
          {settings.tiers.map((tier, index) => (
            <div key={tier.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 14, background: tier.active ? "var(--surface)" : "var(--surface-2)" }}>
              <div className="settings-grid four">
                <Field title="Tier name"><input value={tier.name} onChange={(e) => updateTier(index, { name: e.target.value })} style={inputCss} /></Field>
                <Field title="Price per foot"><input type="number" min={0} step={0.01} value={tier.pricePerFt} onChange={(e) => updateTier(index, { pricePerFt: Number(e.target.value) })} style={inputCss} /></Field>
                <Field title="Price per metre"><input type="number" min={0} step={0.01} value={tier.pricePerM} onChange={(e) => updateTier(index, { pricePerM: Number(e.target.value) })} style={inputCss} /></Field>
                <Field title="Description"><input value={tier.description ?? ""} onChange={(e) => updateTier(index, { description: e.target.value })} style={inputCss} /></Field>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <label style={checkLabel}><input type="checkbox" checked={tier.active} onChange={(e) => updateTier(index, { active: e.target.checked })} style={{ accentColor: "var(--orange)" }} /> Active</label>
                <button onClick={() => removeTier(index)} style={dangerButton}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Tax, Delivery, Setup, Takedown, Labour, Discounts">
        <div className="settings-grid">
          <Toggle title="Tax on/off" checked={Boolean(settings.taxEnabled)} onChange={(value) => update({ taxEnabled: value })} />
          <Field title="Tax percentage"><input type="number" min={0} value={settings.taxPercent ?? 0} onChange={(e) => update({ taxPercent: Number(e.target.value) })} style={inputCss} /></Field>
          <Toggle title="Delivery on/off" checked={Boolean(settings.deliveryEnabled)} onChange={(value) => update({ deliveryEnabled: value })} />
          <Field title="Default delivery mode">
            <select value={settings.defaultDeliveryMode ?? "none"} onChange={(e) => update({ defaultDeliveryMode: e.target.value as "none" | "manual" | "automatic" })} style={inputCss}>
              <option value="none">None</option>
              <option value="manual">Manual fee</option>
              <option value="automatic">Automatic distance fee</option>
            </select>
          </Field>
          <Field title="Price per mile"><input type="number" min={0} step={0.01} value={settings.delivery.costPerMile} onChange={(e) => updateDelivery({ costPerMile: Number(e.target.value) })} style={inputCss} /></Field>
          <Field title="Free miles included"><input type="number" min={0} value={settings.delivery.freeRadiusMiles} onChange={(e) => updateDelivery({ freeRadiusMiles: Number(e.target.value) })} style={inputCss} /></Field>
          <Toggle title="Round trip on/off" checked={Boolean(settings.defaultRoundTrip)} onChange={(value) => update({ defaultRoundTrip: value })} />
          <Field title="Minimum delivery fee"><input type="number" min={0} value={settings.delivery.minimumFee} onChange={(e) => updateDelivery({ minimumFee: Number(e.target.value) })} style={inputCss} /></Field>
          <Toggle title="Setup fee on/off" checked={Boolean(settings.setupFeeEnabled)} onChange={(value) => update({ setupFeeEnabled: value })} />
          <Field title="Default setup fee"><input type="number" min={0} value={settings.delivery.setupFee} onChange={(e) => updateDelivery({ setupFee: Number(e.target.value) })} style={inputCss} /></Field>
          <Toggle title="Takedown fee on/off" checked={Boolean(settings.takedownFeeEnabled)} onChange={(value) => update({ takedownFeeEnabled: value })} />
          <Field title="Default takedown fee"><input type="number" min={0} value={settings.delivery.takedownFee} onChange={(e) => updateDelivery({ takedownFee: Number(e.target.value) })} style={inputCss} /></Field>
          <Toggle title="Labour on/off" checked={Boolean(settings.labourEnabled)} onChange={(value) => update({ labourEnabled: value })} />
          <Field title="Default hourly rate"><input type="number" min={0} value={settings.defaultHourlyRate ?? 0} onChange={(e) => update({ defaultHourlyRate: Number(e.target.value) })} style={inputCss} /></Field>
          <Toggle title="Discounts on/off" checked={Boolean(settings.discountEnabled)} onChange={(value) => update({ discountEnabled: value })} />
        </div>
      </Section>

      <Section title="Tool Tokens">
        <div className="usage-grid">
          <UsageBox label="Current plan" value={usage?.planName ?? "TR1"} />
          <UsageBox label="AI tokens included" value={String(usage?.aiTokensIncluded ?? settings.aiTokensIncluded ?? 0)} />
          <UsageBox label="AI tokens used" value={String(usage?.aiTokensUsed ?? settings.aiTokensUsed ?? 0)} />
          <UsageBox label="AI tokens remaining" value={String(usage?.aiTokensRemaining ?? Math.max(0, (settings.aiTokensIncluded ?? 0) - (settings.aiTokensUsed ?? 0)))} accent />
          <UsageBox label="Mockup tokens included" value={String(mockupIncluded)} />
          <UsageBox label="Shared AI tokens used" value={String(mockupUsed)} />
        </div>
      </Section>

      {!isAdmin && (
        <Section title="Subscription">
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "var(--text-3)" }}>Plan choice, invoices, and payment methods now live in the Billing area.</p>
          <button onClick={() => router.push("/app/billing")} style={secondaryButton}>Open Billing</button>
        </Section>
      )}

      <Section title="Account">
        <p style={{ margin: "0 0 14px", color: "var(--text-3)", fontSize: 13 }}>{user?.email ?? "Signed in account"}</p>
        <button onClick={handleLogout} style={dangerButton}>Log out</button>
      </Section>

      <style jsx>{`
        .settings-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .settings-grid.four {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
        .usage-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        @media (max-width: 900px) {
          .settings-grid,
          .settings-grid.four,
          .usage-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 620px) {
          .settings-grid,
          .settings-grid.four,
          .usage-grid {
            grid-template-columns: 1fr;
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
        <span style={{ fontSize: 13, fontWeight: 700, color: checked ? "var(--orange)" : "var(--text-3)" }}>{checked ? "On" : "Off"}</span>
      </span>
    </label>
  );
}

function UsageBox({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", background: accent ? "var(--orange-dim)" : "var(--surface-2)", padding: "12px 14px" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: accent ? "var(--orange)" : "var(--text)" }}>{value}</div>
    </div>
  );
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
  fontWeight: 800,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
};

const checkLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontSize: 13,
  fontWeight: 700,
  color: "var(--text-2)",
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

const secondaryButton: React.CSSProperties = {
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text-2)",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const dangerButton: React.CSSProperties = {
  border: "1.5px solid var(--red-border, #FECACA)",
  borderRadius: "var(--r-md)",
  background: "var(--red-dim, #FEF2F2)",
  color: "var(--red, #EF4444)",
  padding: "9px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};
