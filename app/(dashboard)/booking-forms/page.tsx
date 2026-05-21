"use client";

import { useEffect, useState } from "react";
import ProFeatureOverlay from "@/components/ProFeatureOverlay";
import type { UserPlan } from "@/lib/store";

export default function BookingFormsPage() {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("bb_user_plan");
      if (stored) {
        setUserPlan(JSON.parse(stored));
      }
    } catch {
      // fallback if storage fails
    }
    setMounted(true);
  }, []);

  const isProPlan =
    userPlan && (userPlan.type === "pro") && (userPlan.status === "trial" || userPlan.status === "active");

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <ProFeatureOverlay
        featureName="Booking Forms"
        description="Create beautiful booking forms to collect client information and preferences. Automatically populate your pipeline with qualified leads ready to close."
        isProPlan={!!isProPlan}
      />

      {isProPlan && (
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Forms</h1>
            <p className="text-gray-600">
              Create custom booking forms to collect client information and preferences.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Form</h2>
              <p className="text-gray-600 mb-4">Design a custom form for your clients</p>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                New Form
              </button>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Form Templates</h2>
              <p className="text-gray-600 mb-4">Start with a pre-built template</p>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors">
                Browse Templates
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
