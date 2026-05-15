// lib/store.ts
// Simple localStorage helpers  SSR-safe

export function ls<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function lsSet(key: string, val: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // storage full or private mode
  }
}

export function lsUpdate<T extends object>(key: string, fallback: T, updater: (prev: T) => T): T {
  const prev = ls(key, fallback);
  const next = updater(prev);
  lsSet(key, next);
  return next;
}

export type SidebarState = {
  iconOnly: boolean;
  groups: Record<string, boolean>;
};

export type Submission = {
  id: string;
  formId: string;
  formName: string;
  submittedAt: string;
  status: "New" | "Contacted" | "Archived" | "Booked";
  data: Record<string, string>;
  labels: Record<string, string>;
};

export type PaymentRecord = {
  id: string;
  quoteId: string;
  clientName: string;
  amount: number;
  method: "cash" | "bank_transfer" | "card" | "other";
  methodOther?: string;
  type: "deposit" | "balance" | "full";
  date: string;
  notes: string;
};

export type JobExpense = {
  id: string;
  quoteId: string;
  category: "Gas" | "Materials" | "Labor" | "Parking" | "Other";
  amount: number;
  notes: string;
  date: string;
  mileage?: number;
  autoCalc?: boolean;
};

export type FuelSettings = {
  unitPref: "miles" | "km";
  efficiency: number;
  efficiencyUnit: "mpg" | "L100km";
  fuelPrice: number;
  fuelPriceUnit: "per_litre" | "per_gallon";
};

export const DEFAULT_FUEL: FuelSettings = {
  unitPref: "miles",
  efficiency: 35,
  efficiencyUnit: "mpg",
  fuelPrice: 1.55,
  fuelPriceUnit: "per_litre",
};

export function calcGasCost(mileage: number, settings: FuelSettings): number {
  const { efficiency, efficiencyUnit, fuelPrice, fuelPriceUnit, unitPref } = settings;
  const miles = unitPref === "km" ? mileage * 0.621371 : mileage;
  const pricePerLitre = fuelPriceUnit === "per_gallon" ? fuelPrice / 4.546 : fuelPrice;
  let litresUsed: number;
  if (efficiencyUnit === "mpg") {
    litresUsed = (miles / efficiency) * 4.546;
  } else {
    const km = unitPref === "miles" ? mileage * 1.60934 : mileage;
    litresUsed = (efficiency * km) / 100;
  }
  return Math.round(litresUsed * pricePerLitre * 100) / 100;
}

export type DeliverySettings = {
  enabled: boolean;
  unit: "miles" | "km";
  ratePerUnit: number;
  baseAddress: string;
  googleMapsApiKey: string;
};

export const DEFAULT_DELIVERY: DeliverySettings = {
  enabled: false,
  unit: "miles",
  ratePerUnit: 1.5,
  baseAddress: "",
  googleMapsApiKey: "",
};

export type PlanType = "starter" | "pro";

export interface UserPlan {
  type: PlanType;
  trialEndsAt?: string;
  paidUntil?: string;
  status: "trial" | "active" | "expired";
}

export const DEFAULT_PLAN: UserPlan = {
  type: "pro",
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  status: "trial",
};

export const LS_KEYS = {
  SUBMISSIONS: "bb_form_submissions",
  SIDEBAR: "bb_sidebar_state",
  PAYMENTS: "bb_payments",
  JOB_EXPENSES: "bb_job_expenses",
  FUEL_SETTINGS: "bb_fuel_settings",
  SAVED_PALETTES: "bb_saved_palettes",
  CUSTOMER_NOTES: "bb_customer_notes",
  DELIVERY_SETTINGS: "bb_delivery_settings",
  USER_PLAN: "bb_user_plan",
  QUOTES: "bb_quotes",
};
