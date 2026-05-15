export type PlanKey = "starter" | "tier_1" | "tr1" | "pro" | "enterprise" | "admin";

export type PlanDefinition = {
  key: Exclude<PlanKey, "tr1">;
  label: string;
  displayName: string;
  stripeName: string;
  description: string;
  monthlyAmount: number;
  currency: "usd";
  aiTokensIncluded: number;
  mockupTokensIncluded: number;
  includesAiTools: boolean;
  features: string[];
};

export const PRO_PLAN_PUBLICLY_AVAILABLE = process.env.NEXT_PUBLIC_PRO_PLAN_AVAILABLE === "true";
export const PRO_PLAN_COMING_SOON_MESSAGE = "Pro is coming soon. AI tools are marked as Pro, but checkout is paused until the tools are launch-ready.";

export const PLAN_DEFINITIONS: Record<Exclude<PlanKey, "tr1">, PlanDefinition> = {
  starter: {
    key: "starter",
    label: "Starter",
    displayName: "Starter",
    stripeName: "BalloonBase Starter",
    description: "Account created, subscription not active yet.",
    monthlyAmount: 0,
    currency: "usd",
    aiTokensIncluded: 0,
    mockupTokensIncluded: 0,
    includesAiTools: false,
    features: ["Create an account", "Choose a paid plan to unlock the app"],
  },
  tier_1: {
    key: "tier_1",
    label: "TR1",
    displayName: "Tier 1",
    stripeName: "BalloonBase Tier 1",
    description: "Core quote builder, catalog, inventory, packages, and add-ons.",
    monthlyAmount: 1999,
    currency: "usd",
    aiTokensIncluded: 0,
    mockupTokensIncluded: 0,
    includesAiTools: false,
    features: [
      "Quick Quote and Detailed Quote",
      "Catalog, Inventory, Packages, and Add-ons",
      "PDF and quote text tools",
      "Global quote settings",
    ],
  },
  pro: {
    key: "pro",
    label: "Pro",
    displayName: "Pro",
    stripeName: "BalloonBase Pro",
    description: "Tier 1 plus AI tools, monthly AI usage, and integration-ready account tools.",
    monthlyAmount: 4999,
    currency: "usd",
    aiTokensIncluded: 200,
    mockupTokensIncluded: 200,
    includesAiTools: true,
    features: [
      "Everything in Tier 1",
      "AI Length Estimator",
      "AI Mockup Generator access",
      "200 shared AI usage tokens per month",
      "GHL white-label connection settings",
    ],
  },
  enterprise: {
    key: "enterprise",
    label: "Studio",
    displayName: "Studio",
    stripeName: "BalloonBase Studio",
    description: "Higher-volume plan for decorators who want more AI usage, team workflow, and deeper GHL support.",
    monthlyAmount: 9999,
    currency: "usd",
    aiTokensIncluded: 800,
    mockupTokensIncluded: 800,
    includesAiTools: true,
    features: [
      "Everything in Pro",
      "800 shared AI usage tokens per month",
      "Advanced mockup reference library",
      "Multi-user/team workspace ready",
      "Multiple GHL location support ready",
      "Priority onboarding and support",
    ],
  },
  admin: {
    key: "admin",
    label: "ADMIN",
    displayName: "Admin",
    stripeName: "BalloonBase Admin",
    description: "Internal admin access.",
    monthlyAmount: 0,
    currency: "usd",
    aiTokensIncluded: 999,
    mockupTokensIncluded: 999,
    includesAiTools: true,
    features: ["Admin access"],
  },
};

export function canonicalPlan(plan?: string | null, admin = false): Exclude<PlanKey, "tr1"> {
  if (admin) return "admin";
  if (!plan) return "starter";
  if (plan === "tr1") return "tier_1";
  if (plan === "tier_1" || plan === "pro" || plan === "enterprise" || plan === "starter") return plan;
  return "starter";
}

export function getPlan(plan?: string | null, admin = false): PlanDefinition {
  return PLAN_DEFINITIONS[canonicalPlan(plan, admin)];
}

export function isProOrAbove(plan?: string | null, admin = false) {
  const key = canonicalPlan(plan, admin);
  return key === "pro" || key === "enterprise" || key === "admin";
}

export function canUseAiTools(plan?: string | null, admin = false) {
  return getPlan(plan, admin).includesAiTools;
}

export function formatPlanPrice(amount: number) {
  if (amount <= 0) return "Custom";
  return `$${(amount / 100).toFixed(2)}`;
}
