import { isAdminEmail } from "./admin";
import type { UserPlan } from "./store";

export async function getCurrentUser() {
  if (typeof window === "undefined") return null;

  try {
    const response = await fetch("/api/auth/me");
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function getUserPlanFromStorage(): UserPlan | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem("bb_user_plan");
    if (!stored) return null;
    return JSON.parse(stored) as UserPlan;
  } catch {
    return null;
  }
}

export function isUserProPlan(plan: UserPlan | null): boolean {
  if (!plan) return false;
  return plan.type === "pro" || plan.status === "trial" || plan.status === "active";
}

export function isProPlanFeatureAvailable(
  userPlan: UserPlan | null,
  userEmail: string | null
): boolean {
  // Admins always have access
  if (userEmail && isAdminEmail(userEmail)) return true;

  // Check if user has pro plan
  if (!userPlan) return false;

  return userPlan.type === "pro" && (userPlan.status === "trial" || userPlan.status === "active");
}
