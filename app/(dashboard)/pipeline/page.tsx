"use client";

import { useEffect, useState } from "react";
import ProFeatureOverlay from "@/components/ProFeatureOverlay";
import type { UserPlan } from "@/lib/store";

export default function PipelinePage() {
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
        featureName="Sales Pipeline"
        description="Visualize your entire sales pipeline at a glance. Track leads, move them through stages, and never lose sight of a potential booking again."
        isProPlan={!!isProPlan}
      />

      {isProPlan && (
        <div className="space-y-6 p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Pipeline</h1>
            <p className="text-gray-600">
              Manage all your leads and bookings in one visual pipeline.
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {["Inquiry", "Interested", "Quoted", "Booked"].map((stage) => (
              <div key={stage} className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">{stage}</h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded p-3 text-sm text-gray-600 text-center">
                    No items
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 text-sm">
              Drag and drop leads between stages to track your progress. Connect your booking forms to automatically populate new inquiries.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
