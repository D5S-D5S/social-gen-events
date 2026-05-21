"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface ProFeatureOverlayProps {
  featureName: string;
  description?: string;
  isProPlan?: boolean;
}

export default function ProFeatureOverlay({
  featureName,
  description,
  isProPlan = false,
}: ProFeatureOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isProPlan) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {/* Coming Soon Badge */}
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full mb-6">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          Coming Soon
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {featureName}
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8 text-base">
          {description || (
            <>
              This feature is part of our <strong>Pro plan</strong>, currently
              in development. Upgrade to Pro to access it when it launches.
            </>
          )}
        </p>

        {/* Benefits Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-8 space-y-2 text-left">
          <p className="text-sm font-semibold text-gray-900">Pro Plan includes:</p>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-orange-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Unlimited bookings & clients
            </li>
            <li className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-orange-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              AI-powered tools (Estimator & Mockup)
            </li>
            <li className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-orange-500 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Calendar sync & priority support
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/dashboard/billing"
            className="block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Upgrade to Pro
          </Link>
          <button
            onClick={() => window.history.back()}
            className="block w-full border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-gray-500 mt-4">
          7-day free trial • No credit card required
        </p>
      </div>
    </div>
  );
}
