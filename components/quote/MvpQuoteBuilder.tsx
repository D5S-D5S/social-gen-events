"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  EventEnvironment,
  GlobalSettings,
  Quote,
  QuoteBreakdown,
  QuoteInput,
  QuotePricedItem,
  QuoteSettingsOverride,
  Unit,
} from "@/lib/types";
import { calculateBreakdown, formatCurrency } from "@/lib/pricing/engine";

type SourceItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price?: number;
  fixed_price?: number;
  include_garland?: boolean;
  garland_length?: number;
  garland_unit?: Unit;
  garland_tier_id?: string;
  components?: { name: string; quantity: number; type: string; price?: number }[];
  is_active?: boolean;
  type?: string;
};

const EVENT_TYPES = [
  "Birthday",
  "Wedding",
  "Baby shower",
  "Gender reveal",
  "Christening",
  "Corporate",
  "Graduation",
  "Prom",
  "Private party",
  "Other",
];

const CURRENCIES = ["GBP", "USD", "EUR", "AUD", "CAD"];

const card: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--r-xl)",
  padding: 20,
  boxShadow: "var(--shadow-sm)",
  marginBottom: 14,
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 5,
};

const inputCss: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text)",
  padding: "8px 10px",
  fontSize: 13,
  outline: "none",
  fontFamily: "var(--font-ui)",
  boxSizing: "border-box",
};

const primaryButton: React.CSSProperties = {
  border: "none",
  borderRadius: "var(--r-md)",
  background: "var(--orange)",
  color: "#fff",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  background: "var(--surface)",
  color: "var(--text-2)",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

function makeId() {
  return crypto.randomUUID();
}

function num(value: string | number | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function settingsForQuote(settings: GlobalSettings): QuoteSettingsOverride {
  return {
    currency: settings.currency,
    depositPercent: settings.depositPercent,
    taxEnabled: settings.taxEnabled ?? false,
    taxPercent: settings.taxPercent ?? 0,
    deliveryEnabled: settings.deliveryEnabled ?? true,
    labourEnabled: settings.labourEnabled ?? true,
    discountEnabled: settings.discountEnabled ?? false,
    setupFeeEnabled: settings.setupFeeEnabled ?? true,
    takedownFeeEnabled: settings.takedownFeeEnabled ?? true,
    setupFeeAmount: settings.delivery.setupFee ?? 0,
    takedownFeeAmount: settings.delivery.takedownFee ?? 0,
    labourHourlyRate: settings.defaultHourlyRate ?? 0,
    labourStaffCount: 1,
  };
}

function defaultInput(settings: GlobalSettings): QuoteInput {
  const firstTier = settings.tiers.find((tier) => tier.active) ?? settings.tiers[0];
  const quoteSettings = settingsForQuote(settings);

  return {
    quoteType: "full",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    eventType: "Birthday",
    eventDate: "",
    eventLocation: "",
    venuePostcode: "",
    eventEnvironment: "",
    notes: "",
    quoteSettings,
    selectedPackage: null,
    tierId: firstTier?.id ?? "",
    length: 0,
    includedLength: 0,
    unit: settings.defaultUnit,
    addonItems: [],
    inventoryItems: [],
    manualItems: [],
    delivery: {
      enabled: settings.deliveryEnabled ?? true,
      mode: settings.defaultDeliveryMode ?? "none",
      businessPostcode: settings.delivery.homeAddress,
      venuePostcode: "",
      distance: 0,
      roundTrip: settings.defaultRoundTrip ?? true,
      freeMilesIncluded: settings.delivery.freeRadiusMiles,
      pricePerMile: settings.delivery.costPerMile,
      minimumDeliveryFee: settings.delivery.minimumFee,
      manualFee: 0,
    },
    labour: {
      enabled: settings.labourEnabled ?? true,
      manualOverride: false,
      setupHours: 0,
      staffCount: quoteSettings.labourStaffCount ?? 1,
      hourlyRate: quoteSettings.labourHourlyRate ?? settings.defaultHourlyRate ?? 0,
      takedownHours: 0,
    },
    discount: {
      enabled: settings.discountEnabled ?? false,
      type: "fixed",
      amount: 0,
      reason: "",
    },
    setupFee: quoteSettings.setupFeeAmount ?? 0,
    takedownFee: quoteSettings.takedownFeeAmount ?? 0,
    selectedAddonIds: [],
    lineItems: [],
    deliveryMode: settings.defaultDeliveryMode === "manual" ? "flat" : settings.defaultDeliveryMode === "automatic" ? "distance" : "none",
    flatDeliveryFee: 0,
  };
}

function normaliseExisting(input: QuoteInput, settings: GlobalSettings): QuoteInput {
  const base = defaultInput(settings);
  return {
    ...base,
    ...input,
    quoteType: "full",
    quoteSettings: { ...base.quoteSettings!, ...(input.quoteSettings ?? {}) },
    selectedPackage: input.selectedPackage ?? null,
    includedLength: input.includedLength ?? input.selectedPackage?.includedGarlandLength ?? 0,
    addonItems: input.addonItems ?? [],
    inventoryItems: input.inventoryItems ?? [],
    manualItems: input.manualItems ?? [],
    delivery: { ...base.delivery!, ...(input.delivery ?? {}) },
    labour: { ...base.labour!, ...(input.labour ?? {}) },
    discount: { ...base.discount!, ...(input.discount ?? {}) },
  };
}

function itemPrice(item: SourceItem) {
  return Number(item.price ?? item.fixed_price ?? 0);
}

export default function MvpQuoteBuilder({ mode, quote }: { mode: "create" | "edit"; quote?: Quote }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [input, setInput] = useState<QuoteInput | null>(null);
  const [packages, setPackages] = useState<SourceItem[]>([]);
  const [addons, setAddons] = useState<SourceItem[]>([]);
  const [inventory, setInventory] = useState<SourceItem[]>([]);
  const [catalog, setCatalog] = useState<SourceItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const settingsData = await fetch("/api/settings", { cache: "no-store" }).then((r) => r.json() as Promise<GlobalSettings>);
      setSettings(settingsData);
      if (quote) {
        setInput(normaliseExisting(quote.input, settingsData));
      } else {
        const base = defaultInput(settingsData);
        const lengthParam = Number(searchParams.get("length"));
        const unitParam = searchParams.get("unit");
        setInput({
          ...base,
          length: Number.isFinite(lengthParam) && lengthParam > 0 ? lengthParam : base.length,
          unit: unitParam === "m" ? "m" : unitParam === "ft" ? "ft" : base.unit,
        });
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [pkgRes, addonRes, invRes] = await Promise.all([
        supabase.from("packages").select("*").eq("profile_id", session.user.id).eq("is_active", true).order("name"),
        supabase.from("addons").select("*").eq("profile_id", session.user.id).eq("is_active", true).order("name"),
        supabase.from("inventory").select("*").eq("profile_id", session.user.id).eq("is_active", true).order("name"),
      ]);

      const packageRows = (pkgRes.data ?? []) as SourceItem[];
      setPackages(packageRows.filter((item) => item.type !== "product"));
      setAddons((addonRes.data ?? []) as SourceItem[]);
      setInventory((invRes.data ?? []) as SourceItem[]);
      setCatalog(packageRows.filter((item) => item.type === "product"));
    }

    load().catch(() => setError("Could not load Quote Builder data."));
  }, [quote, searchParams]);

  const breakdown = useMemo(() => {
    if (!settings || !input?.tierId) return null;
    try {
      return calculateBreakdown(input, settings);
    } catch {
      return null;
    }
  }, [input, settings]);

  const currency = input?.quoteSettings?.currency ?? settings?.currency ?? "GBP";
  const activeTiers = settings?.tiers.filter((tier) => tier.active) ?? [];
  const selectedTier = activeTiers.find((tier) => tier.id === input?.tierId);
  const unitRate = selectedTier && input ? input.unit === "ft" ? selectedTier.pricePerFt : selectedTier.pricePerM : 0;

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  function update(updates: Partial<QuoteInput>) {
    setInput((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  function updateQuoteSettings(updates: Partial<QuoteSettingsOverride>) {
    if (!input?.quoteSettings) return;
    update({ quoteSettings: { ...input.quoteSettings, ...updates } });
  }

  function updateDelivery(updates: Partial<NonNullable<QuoteInput["delivery"]>>) {
    if (!input?.delivery) return;
    const next = { ...input.delivery, ...updates };
    next.enabled = next.mode !== "none";
    update({
      delivery: next,
      quoteSettings: { ...input.quoteSettings!, deliveryEnabled: next.enabled },
    });
  }

  function updateLabour(updates: Partial<NonNullable<QuoteInput["labour"]>>) {
    if (!input?.labour) return;
    update({ labour: { ...input.labour, ...updates } });
  }

  function updateDiscount(updates: Partial<NonNullable<QuoteInput["discount"]>>) {
    if (!input?.discount) return;
    update({ discount: { ...input.discount, ...updates } });
  }

  function selectPackage(packageId: string) {
    if (!input) return;
    if (!packageId) {
      update({ selectedPackage: null, includedLength: 0 });
      return;
    }

    const pkg = packages.find((item) => item.id === packageId);
    if (!pkg) return;

    const tierId = pkg.garland_tier_id || input.tierId;
    const tier = settings?.tiers.find((item) => item.id === tierId);
    const includedLength = Number(pkg.garland_length ?? 0);

    update({
      selectedPackage: {
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: itemPrice(pkg),
        includedItems: (pkg.components ?? []).map((component) => `${component.name} x${component.quantity}`).join(", "),
        includedGarlandLength: includedLength,
        tierId,
        tierName: tier?.name,
        unit: pkg.garland_unit ?? input.unit,
      },
      tierId,
      includedLength,
      unit: pkg.garland_unit ?? input.unit,
      length: Math.max(input.length, includedLength),
    });
  }

  function setPackagePrice(price: number) {
    if (!input?.selectedPackage) return;
    update({ selectedPackage: { ...input.selectedPackage, price } });
  }

  function makePricedItem(item: SourceItem, source: QuotePricedItem["source"]): QuotePricedItem {
    return {
      id: makeId(),
      source,
      sourceId: item.id,
      name: item.name,
      description: item.description,
      quantity: 1,
      unitPrice: itemPrice(item),
      notes: "",
    };
  }

  function addSavedItem(source: "addon" | "inventory" | "catalog", id: string) {
    if (!input || !id) return;
    const list = source === "addon" ? addons : source === "inventory" ? inventory : catalog;
    const item = list.find((entry) => entry.id === id);
    if (!item) return;

    if (source === "addon") {
      update({ addonItems: [...(input.addonItems ?? []), makePricedItem(item, "addon")] });
    } else {
      update({ inventoryItems: [...(input.inventoryItems ?? []), makePricedItem(item, source)] });
    }
  }

  function addCustomAddon() {
    if (!input) return;
    update({
      addonItems: [
        ...(input.addonItems ?? []),
        { id: makeId(), source: "addon", name: "", quantity: 1, unitPrice: 0, notes: "" },
      ],
    });
  }

  function addManualLineItem() {
    if (!input) return;
    update({
      manualItems: [
        ...(input.manualItems ?? []),
        { id: makeId(), source: "manual", name: "", description: "", quantity: 1, unitPrice: 0, notes: "" },
      ],
    });
  }

  function updateItem(key: "addonItems" | "inventoryItems" | "manualItems", id: string, updates: Partial<QuotePricedItem>) {
    if (!input) return;
    update({ [key]: (input[key] ?? []).map((item) => (item.id === id ? { ...item, ...updates } : item)) } as Partial<QuoteInput>);
  }

  function removeItem(key: "addonItems" | "inventoryItems" | "manualItems", id: string) {
    if (!input) return;
    update({ [key]: (input[key] ?? []).filter((item) => item.id !== id) } as Partial<QuoteInput>);
  }

  async function saveQuote() {
    if (!input) return null;
    setSaving(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/login");
        return null;
      }

      const url = mode === "edit" && quote ? `/api/quotes/${quote.id}` : "/api/quotes";
      const response = await fetch(url, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(mode === "edit" ? { input } : input),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not save quote");
      }

      const saved = (await response.json()) as Quote;
      showToast("Quote saved");
      if (mode === "create") router.push(`/app/quotes/${saved.id}`);
      return saved;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save quote");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf() {
    const saved = quote ?? await saveQuote();
    if (saved) window.open(`/app/quotes/${saved.id}/print`, "_blank");
  }

  if (!settings || !input) {
    return <div style={{ color: "var(--text-3)", fontSize: 13 }}>Loading Quote Builder...</div>;
  }

  const extraLength = Math.max(0, input.length - (input.includedLength ?? 0));
  const garlandLabel = input.selectedPackage ? "Extra garland price" : "Garland price";

  return (
    <div style={{ width: "100%", animation: "fadeUp 0.3s ease forwards" }}>
      {toast && <div style={{ position: "fixed", bottom: 24, right: 24, background: "var(--text)", color: "#fff", borderRadius: "var(--r-lg)", padding: "10px 16px", fontSize: 13, zIndex: 50 }}>{toast}</div>}

      <div style={{ marginBottom: 22 }}>
        <p style={{ color: "var(--orange)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>Quote Builder</p>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: 0 }}>{mode === "edit" ? "Edit Detailed Quote" : "New Detailed Quote"}</h1>
        <p style={{ color: "var(--text-3)", fontSize: 13 }}>Build a full event quote from Packages, Add-ons, Inventory, Catalog, delivery, labour, discount, and tax.</p>
      </div>

      <div className="quote-builder-grid">
        <div>
          <Section number="1" title="Client Information">
            <div className="form-grid three">
              <Field title="Client name"><input value={input.clientName} onChange={(e) => update({ clientName: e.target.value })} style={inputCss} /></Field>
              <Field title="Client phone"><input value={input.clientPhone ?? ""} onChange={(e) => update({ clientPhone: e.target.value })} style={inputCss} /></Field>
              <Field title="Client email"><input type="email" value={input.clientEmail} onChange={(e) => update({ clientEmail: e.target.value })} style={inputCss} /></Field>
            </div>
          </Section>

          <Section number="2" title="Event Details">
            <div className="form-grid two">
              <Field title="Event type"><select value={input.eventType ?? ""} onChange={(e) => update({ eventType: e.target.value })} style={inputCss}>{EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field>
              <Field title="Event date"><input type="date" value={input.eventDate} onChange={(e) => update({ eventDate: e.target.value })} style={inputCss} /></Field>
              <Field title="Event location"><input value={input.eventLocation} onChange={(e) => update({ eventLocation: e.target.value })} style={inputCss} /></Field>
              <Field title="Venue postcode"><input value={input.venuePostcode ?? ""} onChange={(e) => { update({ venuePostcode: e.target.value }); updateDelivery({ venuePostcode: e.target.value }); }} style={inputCss} /></Field>
              <Field title="Indoor or outdoor"><select value={input.eventEnvironment ?? ""} onChange={(e) => update({ eventEnvironment: e.target.value as EventEnvironment })} style={inputCss}><option value="">Select...</option><option value="indoor">Indoor</option><option value="outdoor">Outdoor</option></select></Field>
              <Field title="Notes"><input value={input.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} style={inputCss} /></Field>
            </div>
          </Section>

          <Section number="3" title="Package Selection">
            <div className="form-grid two">
              <Field title="Package"><select value={input.selectedPackage?.id ?? ""} onChange={(e) => selectPackage(e.target.value)} style={inputCss}><option value="">No package selected</option>{packages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} - {formatCurrency(itemPrice(pkg), currency)}</option>)}</select></Field>
              <Field title="Editable package price"><input type="number" min={0} step={0.01} value={input.selectedPackage?.price ?? 0} disabled={!input.selectedPackage} onChange={(e) => setPackagePrice(num(e.target.value))} style={inputCss} /></Field>
            </div>
            {input.selectedPackage && (
              <div style={{ marginTop: 12, border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 12, background: "var(--surface-2)" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>{input.selectedPackage.name}</div>
                {input.selectedPackage.description && <p style={{ margin: "4px 0", fontSize: 12, color: "var(--text-3)" }}>{input.selectedPackage.description}</p>}
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-3)" }}>
                  Included items: {input.selectedPackage.includedItems || "None listed"} · Included garland: {input.selectedPackage.includedGarlandLength ?? 0}{input.selectedPackage.unit ?? input.unit} · Package tier: {input.selectedPackage.tierName ?? selectedTier?.name ?? "Not set"}
                </p>
              </div>
            )}
          </Section>

          <Section number="4" title="Garland / Balloon Pricing">
            <div className="form-grid five">
              <Field title="Garland length"><input type="number" min={0} value={input.length} onChange={(e) => update({ length: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Included length"><input type="number" min={0} value={input.includedLength ?? 0} onChange={(e) => update({ includedLength: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Extra length"><input value={`${extraLength}${input.unit}`} readOnly style={{ ...inputCss, background: "var(--surface-2)" }} /></Field>
              <Field title="Unit"><select value={input.unit} onChange={(e) => update({ unit: e.target.value as Unit })} style={inputCss}><option value="ft">ft</option><option value="m">m</option></select></Field>
              <Field title="Selected tier"><select value={input.tierId} onChange={(e) => update({ tierId: e.target.value })} style={inputCss}>{activeTiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.name}</option>)}</select></Field>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-3)" }}>
              Price per {input.unit}: <strong style={{ color: "var(--text)" }}>{formatCurrency(unitRate, currency)}</strong>. {garlandLabel}: <strong style={{ color: "var(--orange)" }}>{formatCurrency(input.selectedPackage ? extraLength * unitRate : input.length * unitRate, currency)}</strong>
            </div>
          </Section>

          <Section number="5" title="Add-ons">
            <div className="form-grid two">
              <Field title="Saved Add-ons"><select defaultValue="" onChange={(e) => { addSavedItem("addon", e.target.value); e.currentTarget.value = ""; }} style={inputCss}><option value="">Search/select saved Add-on...</option>{addons.map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(itemPrice(item), currency)}</option>)}</select></Field>
              <div style={{ display: "flex", alignItems: "end" }}><button type="button" onClick={addCustomAddon} style={secondaryButton}>Add custom add-on</button></div>
            </div>
            <ItemRows items={input.addonItems ?? []} itemKey="addonItems" empty="No Add-ons selected yet." updateItem={updateItem} removeItem={removeItem} currency={currency} showSource={false} notesLabel="Notes" />
          </Section>

          <Section number="6" title="Inventory / Catalog Items">
            <div className="form-grid two">
              <Field title="Inventory"><select defaultValue="" onChange={(e) => { addSavedItem("inventory", e.target.value); e.currentTarget.value = ""; }} style={inputCss}><option value="">Search/select Inventory item...</option>{inventory.map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(itemPrice(item), currency)}</option>)}</select></Field>
              <Field title="Catalog"><select defaultValue="" onChange={(e) => { addSavedItem("catalog", e.target.value); e.currentTarget.value = ""; }} style={inputCss}><option value="">Search/select Catalog item...</option>{catalog.map((item) => <option key={item.id} value={item.id}>{item.name} - {formatCurrency(itemPrice(item), currency)}</option>)}</select></Field>
            </div>
            <ItemRows items={input.inventoryItems ?? []} itemKey="inventoryItems" empty="No Inventory or Catalog items selected yet." updateItem={updateItem} removeItem={removeItem} currency={currency} showSource notesLabel="Notes" />
          </Section>

          <Section number="7" title="Manual Line Items">
            <button type="button" onClick={addManualLineItem} style={secondaryButton}>Add manual line item</button>
            <ItemRows items={input.manualItems ?? []} itemKey="manualItems" empty="No manual line items yet." updateItem={updateItem} removeItem={removeItem} currency={currency} showSource={false} notesLabel="Description" />
          </Section>

          <Section number="8" title="Delivery">
            <div className="form-grid three">
              <Field title="Delivery mode"><select value={input.delivery!.mode} onChange={(e) => updateDelivery({ mode: e.target.value as "none" | "manual" | "automatic" })} style={inputCss}><option value="none">None</option><option value="manual">Manual fee</option><option value="automatic">Automatic distance fee</option></select></Field>
              {input.delivery!.mode === "manual" && <Field title="Delivery fee"><input type="number" min={0} value={input.delivery!.manualFee} onChange={(e) => updateDelivery({ manualFee: num(e.target.value) })} style={inputCss} /></Field>}
              {input.delivery!.mode !== "none" && <Field title="Override delivery fee"><input type="number" min={0} value={input.delivery!.overrideFee ?? ""} onChange={(e) => updateDelivery({ overrideFee: e.target.value === "" ? undefined : num(e.target.value) })} style={inputCss} /></Field>}
            </div>
            {input.delivery!.mode === "automatic" && (
              <div className="form-grid four" style={{ marginTop: 10 }}>
                <Field title="Business postcode"><input value={input.delivery!.businessPostcode} onChange={(e) => updateDelivery({ businessPostcode: e.target.value })} style={inputCss} /></Field>
                <Field title="Venue postcode"><input value={input.delivery!.venuePostcode} onChange={(e) => updateDelivery({ venuePostcode: e.target.value })} style={inputCss} /></Field>
                <Field title="Distance"><input type="number" min={0} value={input.delivery!.distance} onChange={(e) => updateDelivery({ distance: num(e.target.value) })} style={inputCss} /></Field>
                <Toggle title="Round trip" checked={input.delivery!.roundTrip} onChange={(checked) => updateDelivery({ roundTrip: checked })} />
                <Field title="Free miles included"><input type="number" min={0} value={input.delivery!.freeMilesIncluded} onChange={(e) => updateDelivery({ freeMilesIncluded: num(e.target.value) })} style={inputCss} /></Field>
                <Field title="Price per mile"><input type="number" min={0} step={0.01} value={input.delivery!.pricePerMile} onChange={(e) => updateDelivery({ pricePerMile: num(e.target.value) })} style={inputCss} /></Field>
                <Field title="Minimum delivery fee"><input type="number" min={0} value={input.delivery!.minimumDeliveryFee} onChange={(e) => updateDelivery({ minimumDeliveryFee: num(e.target.value) })} style={inputCss} /></Field>
              </div>
            )}
          </Section>

          <Section number="9" title="Setup and Takedown Fees">
            <div className="form-grid four">
              <Toggle title="Setup fee" checked={input.quoteSettings!.setupFeeEnabled} onChange={(checked) => updateQuoteSettings({ setupFeeEnabled: checked })} />
              <Field title="Setup fee amount"><input type="number" min={0} value={input.setupFee ?? 0} onChange={(e) => update({ setupFee: num(e.target.value) })} style={inputCss} /></Field>
              <Toggle title="Takedown fee" checked={input.quoteSettings!.takedownFeeEnabled} onChange={(checked) => updateQuoteSettings({ takedownFeeEnabled: checked })} />
              <Field title="Takedown fee amount"><input type="number" min={0} value={input.takedownFee ?? 0} onChange={(e) => update({ takedownFee: num(e.target.value) })} style={inputCss} /></Field>
            </div>
          </Section>

          <Section number="10" title="Labour">
            <div className="form-grid four">
              <Toggle title="Labour" checked={input.labour!.enabled} onChange={(checked) => { updateLabour({ enabled: checked }); updateQuoteSettings({ labourEnabled: checked }); }} />
              <Toggle title="Manual override" checked={input.labour!.manualOverride} onChange={(checked) => updateLabour({ manualOverride: checked })} />
              <Field title="Setup hours"><input type="number" min={0} step={0.25} value={input.labour!.setupHours} onChange={(e) => updateLabour({ setupHours: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Number of staff"><input type="number" min={1} value={input.labour!.staffCount} onChange={(e) => updateLabour({ staffCount: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Hourly rate"><input type="number" min={0} value={input.labour!.hourlyRate} onChange={(e) => updateLabour({ hourlyRate: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Labour fee override"><input type="number" min={0} value={input.labour!.labourFeeOverride ?? ""} onChange={(e) => updateLabour({ labourFeeOverride: e.target.value === "" ? undefined : num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Takedown hours"><input type="number" min={0} step={0.25} value={input.labour!.takedownHours} onChange={(e) => updateLabour({ takedownHours: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Takedown labour override"><input type="number" min={0} value={input.labour!.takedownFeeOverride ?? ""} onChange={(e) => updateLabour({ takedownFeeOverride: e.target.value === "" ? undefined : num(e.target.value) })} style={inputCss} /></Field>
            </div>
          </Section>

          <Section number="11" title="Discount">
            <div className="form-grid four">
              <Toggle title="Discount" checked={input.discount!.enabled} onChange={(checked) => { updateDiscount({ enabled: checked }); updateQuoteSettings({ discountEnabled: checked }); }} />
              <Field title="Discount type"><select value={input.discount!.type} onChange={(e) => updateDiscount({ type: e.target.value as "fixed" | "percentage" })} style={inputCss}><option value="fixed">Fixed amount</option><option value="percentage">Percentage</option></select></Field>
              <Field title="Discount amount"><input type="number" min={0} value={input.discount!.amount} onChange={(e) => updateDiscount({ amount: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Discount reason"><input value={input.discount!.reason} onChange={(e) => updateDiscount({ reason: e.target.value })} style={inputCss} /></Field>
            </div>
          </Section>

          <Section number="12" title="Tax">
            <div className="form-grid three">
              <Toggle title="Tax" checked={input.quoteSettings!.taxEnabled} onChange={(checked) => updateQuoteSettings({ taxEnabled: checked })} />
              <Field title="Tax percentage"><input type="number" min={0} value={input.quoteSettings!.taxPercent} onChange={(e) => updateQuoteSettings({ taxPercent: num(e.target.value) })} style={inputCss} /></Field>
              <Field title="Currency"><select value={input.quoteSettings!.currency} onChange={(e) => updateQuoteSettings({ currency: e.target.value })} style={inputCss}>{CURRENCIES.map((code) => <option key={code} value={code}>{code}</option>)}</select></Field>
            </div>
          </Section>

          <Section number="14" title="Quote Actions">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={saveQuote} disabled={saving || !breakdown} style={{ ...primaryButton, opacity: saving || !breakdown ? 0.5 : 1 }}>{saving ? "Saving..." : "Save as Draft"}</button>
              <button type="button" onClick={saveQuote} disabled={saving || !breakdown} style={{ ...secondaryButton, opacity: saving || !breakdown ? 0.5 : 1 }}>Save Quote</button>
              <button type="button" onClick={() => { if (breakdown) { navigator.clipboard.writeText(buildQuoteText(input, breakdown, currency)); showToast("Quote text copied"); } }} disabled={!breakdown} style={{ ...secondaryButton, opacity: !breakdown ? 0.5 : 1 }}>Copy Quote Text</button>
              <button type="button" onClick={downloadPdf} disabled={!breakdown || saving} style={{ ...secondaryButton, opacity: !breakdown || saving ? 0.5 : 1 }}>Download PDF</button>
            </div>
          </Section>
        </div>

        <aside className="quote-summary">
          <QuoteBreakdownPanel input={input} breakdown={breakdown} currency={currency} />
          {error && <div style={{ ...card, borderColor: "var(--red-border)", color: "var(--red)", fontSize: 13 }}>{error}</div>}
        </aside>
      </div>

      <style jsx>{`
        .quote-builder-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 22px;
          align-items: start;
        }

        .quote-summary {
          position: sticky;
          top: 20px;
        }

        .form-grid {
          display: grid;
          gap: 10px;
        }

        .form-grid.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .form-grid.three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .form-grid.four {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .form-grid.five {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        @media (max-width: 980px) {
          .quote-builder-grid,
          .form-grid.two,
          .form-grid.three,
          .form-grid.four,
          .form-grid.five {
            grid-template-columns: 1fr;
          }

          .quote-summary {
            position: static;
          }
        }
      `}</style>
    </div>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ width: 24, height: 24, borderRadius: 8, background: "var(--orange-dim)", color: "var(--orange)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900 }}>{number}</span>
        <h2 style={{ fontSize: 15, margin: 0, fontFamily: "var(--font-display)", color: "var(--text)" }}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return <label><span style={label}>{title}</span>{children}</label>;
}

function Toggle({ title, checked, onChange }: { title: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, border: "1px solid var(--border)", borderRadius: "var(--r-md)", padding: "9px 10px", minHeight: 38, boxSizing: "border-box" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: "var(--orange)" }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}>{title}</span>
    </label>
  );
}

function ItemRows({
  items,
  itemKey,
  empty,
  updateItem,
  removeItem,
  currency,
  showSource,
  notesLabel,
}: {
  items: QuotePricedItem[];
  itemKey: "addonItems" | "inventoryItems" | "manualItems";
  empty: string;
  updateItem: (key: "addonItems" | "inventoryItems" | "manualItems", id: string, updates: Partial<QuotePricedItem>) => void;
  removeItem: (key: "addonItems" | "inventoryItems" | "manualItems", id: string) => void;
  currency: string;
  showSource: boolean;
  notesLabel: string;
}) {
  if (items.length === 0) {
    return <p style={{ fontSize: 12, color: "var(--text-3)", margin: "12px 0 0" }}>{empty}</p>;
  }

  return (
    <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: "var(--r-lg)", padding: 10, background: "var(--surface-2)" }}>
          <div style={{ display: "grid", gridTemplateColumns: showSource ? "1.3fr 92px 74px 104px 90px 34px" : "1.5fr 1fr 74px 104px 90px 34px", gap: 8, alignItems: "center" }}>
            <input value={item.name} onChange={(e) => updateItem(itemKey, item.id, { name: e.target.value })} placeholder="Item name" style={inputCss} />
            {showSource ? <div style={{ fontSize: 11, fontWeight: 800, color: "var(--text-3)", textTransform: "capitalize" }}>{item.source}</div> : <input value={item.description ?? item.notes ?? ""} onChange={(e) => updateItem(itemKey, item.id, itemKey === "manualItems" ? { description: e.target.value } : { notes: e.target.value })} placeholder={notesLabel} style={inputCss} />}
            <input type="number" min={0} value={item.quantity} onChange={(e) => updateItem(itemKey, item.id, { quantity: num(e.target.value) })} style={inputCss} />
            <input type="number" min={0} step={0.01} value={item.unitPrice} onChange={(e) => updateItem(itemKey, item.id, { unitPrice: num(e.target.value) })} style={inputCss} />
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", textAlign: "right" }}>{formatCurrency(item.quantity * item.unitPrice, currency)}</div>
            <button type="button" onClick={() => removeItem(itemKey, item.id)} style={{ border: "none", background: "var(--red-dim)", color: "var(--red)", borderRadius: 8, height: 32, cursor: "pointer", fontWeight: 900 }}>x</button>
          </div>
          {showSource && (
            <div style={{ marginTop: 8 }}>
              <input value={item.notes ?? ""} onChange={(e) => updateItem(itemKey, item.id, { notes: e.target.value })} placeholder="Notes" style={inputCss} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function QuoteBreakdownPanel({ input, breakdown, currency }: { input: QuoteInput; breakdown: QuoteBreakdown | null; currency: string }) {
  return (
    <section style={card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <h2 style={{ fontSize: 15, margin: 0, fontFamily: "var(--font-display)" }}>Quote Breakdown</h2>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--orange)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Subtotal</span>
      </div>

      {breakdown ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Summary label="Client" value={input.clientName || "-"} />
          <Summary label="Event" value={input.eventType || "-"} />
          <Summary label="Date" value={input.eventDate || "-"} />
          <Summary label="Location" value={input.eventLocation || "-"} />
          <Divider />
          <Money label="Package Price" value={breakdown.packagePrice ?? 0} currency={currency} />
          <Money label={input.selectedPackage ? "Extra Garland Price" : "Garland Price"} value={breakdown.basePrice ?? breakdown.extraGarlandPrice ?? 0} currency={currency} />
          <Money label="Add-ons Total" value={breakdown.addonsTotal} currency={currency} />
          <Money label="Inventory/Catalog Items Total" value={breakdown.inventoryTotal ?? 0} currency={currency} />
          <Money label="Manual Line Items Total" value={breakdown.manualItemsTotal ?? 0} currency={currency} />
          <Money label="Delivery Fee" value={breakdown.deliveryFee ?? 0} currency={currency} />
          <Money label="Setup Fee" value={breakdown.setupFee ?? 0} currency={currency} />
          <Money label="Takedown Fee" value={breakdown.takedownFee ?? 0} currency={currency} />
          <Money label="Labour Fee" value={breakdown.labourFee ?? 0} currency={currency} />
          <Money label="Takedown Labour Fee" value={breakdown.takedownLabourFee ?? 0} currency={currency} />
          <Money label="Discount" value={-(breakdown.discountAmount ?? 0)} currency={currency} />
          <Money label="Tax" value={breakdown.taxAmount ?? 0} currency={currency} />
          <Divider />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)" }}>Subtotal</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "var(--orange)" }}>{formatCurrency(breakdown.subtotal, currency)}</span>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>Choose a pricing tier to calculate the quote.</p>
      )}
    </section>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12 }}><span style={{ color: "var(--text-3)" }}>{label}</span><strong style={{ color: "var(--text)", textAlign: "right" }}>{value}</strong></div>;
}

function Money({ label, value, currency }: { label: string; value: number; currency: string }) {
  return <Summary label={label} value={formatCurrency(value, currency)} />;
}

function Divider() {
  return <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />;
}

function buildQuoteText(input: QuoteInput, breakdown: QuoteBreakdown, currency: string) {
  return [
    `Quote for ${input.clientName || "Client"}`,
    input.clientPhone ? `Phone: ${input.clientPhone}` : "",
    input.clientEmail ? `Email: ${input.clientEmail}` : "",
    input.eventType ? `Event: ${input.eventType}` : "",
    input.eventDate ? `Date: ${input.eventDate}` : "",
    input.eventLocation ? `Location: ${input.eventLocation}` : "",
    input.venuePostcode ? `Venue postcode: ${input.venuePostcode}` : "",
    "",
    breakdown.packageName ? `Package: ${breakdown.packageName}` : "",
    `Tier: ${breakdown.tierName}`,
    `Garland length: ${input.length}${input.unit}`,
    "",
    `Package Price: ${formatCurrency(breakdown.packagePrice ?? 0, currency)}`,
    `${input.selectedPackage ? "Extra Garland Price" : "Garland Price"}: ${formatCurrency(breakdown.basePrice ?? breakdown.extraGarlandPrice ?? 0, currency)}`,
    `Add-ons Total: ${formatCurrency(breakdown.addonsTotal, currency)}`,
    `Inventory/Catalog Items Total: ${formatCurrency(breakdown.inventoryTotal ?? 0, currency)}`,
    `Manual Line Items Total: ${formatCurrency(breakdown.manualItemsTotal ?? 0, currency)}`,
    `Delivery Fee: ${formatCurrency(breakdown.deliveryFee ?? 0, currency)}`,
    `Setup Fee: ${formatCurrency(breakdown.setupFee ?? 0, currency)}`,
    `Takedown Fee: ${formatCurrency(breakdown.takedownFee ?? 0, currency)}`,
    `Labour Fee: ${formatCurrency(breakdown.labourFee ?? 0, currency)}`,
    `Takedown Labour Fee: ${formatCurrency(breakdown.takedownLabourFee ?? 0, currency)}`,
    `Discount: -${formatCurrency(breakdown.discountAmount ?? 0, currency)}`,
    `Tax: ${formatCurrency(breakdown.taxAmount ?? 0, currency)}`,
    "",
    `Subtotal: ${formatCurrency(breakdown.subtotal, currency)}`,
  ].filter(Boolean).join("\n");
}
