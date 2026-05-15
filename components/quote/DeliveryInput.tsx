"use client";

import { useState, useEffect, useRef } from "react";
import { DeliveryMode, DistanceUnit, DeliverySettings, DistanceResult, QuoteInput } from "@/lib/types";
import { calculateDeliveryFee } from "@/lib/delivery/calculator";
import { formatCurrency } from "@/lib/pricing/engine";

interface DeliveryInputProps {
  mode: DeliveryMode;
  flatFee: number;
  distanceFromBase?: number;
  distanceUnit?: DistanceUnit;
  eventLocation: string;
  eventCoordinates?: { lat: number; lng: number };
  deliverySettings: DeliverySettings;
  onUpdate: (partial: Partial<QuoteInput>) => void;
}

const MODES: { value: DeliveryMode; label: string }[] = [
  { value: "distance", label: "Distance" },
  { value: "flat", label: "Flat Fee" },
  { value: "none", label: "None (TBC)" },
];

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#9A8070",
  marginBottom: 6,
  display: "block",
};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
    initAutocomplete?: () => void;
  }
}

export default function DeliveryInput({
  mode,
  flatFee,
  distanceFromBase,
  distanceUnit = "miles",
  eventLocation,
  deliverySettings,
  onUpdate,
}: DeliveryInputProps) {
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [distanceResult, setDistanceResult] = useState<DistanceResult | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  // Load Google Places script if key is available
  useEffect(() => {
    if (!googleMapsKey || typeof window === "undefined") return;
    if (window.google?.maps?.places) {
      attachAutocomplete();
      return;
    }
    const scriptId = "google-maps-places";
    if (document.getElementById(scriptId)) return;

    window.initAutocomplete = attachAutocomplete;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsKey}&libraries=places&callback=initAutocomplete`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    return () => {
      delete window.initAutocomplete;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsKey]);

  function attachAutocomplete() {
    if (!addressInputRef.current || !window.google?.maps?.places) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const autocomplete = new window.google.maps.places.Autocomplete(
      addressInputRef.current,
      { types: ["geocode"] }
    );
    autocomplete.addListener("place_changed", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const place = autocomplete.getPlace() as any;
      const address = place.formatted_address ?? place.name ?? "";
      const lat = place.geometry?.location?.lat?.() as number | undefined;
      const lng = place.geometry?.location?.lng?.() as number | undefined;
      onUpdate({
        eventLocation: address,
        eventCoordinates: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
      });
    });
  }

  async function handleCalculateDistance() {
    if (!eventLocation) {
      setCalcError("Please enter an event address.");
      return;
    }
    if (!deliverySettings.homeAddress) {
      setCalcError("Home address not configured in delivery settings.");
      return;
    }

    setCalculating(true);
    setCalcError(null);

    try {
      const response = await fetch("/api/delivery/distance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: deliverySettings.homeAddress,
          destination: eventLocation,
          unit: distanceUnit,
        }),
      });

      const data = await response.json() as DistanceResult & { error?: string; fallback?: boolean };

      if (data.error && data.fallback) {
        setCalcError(data.error);
        setCalculating(false);
        return;
      }

      if (data.error) {
        setCalcError(data.error);
        setCalculating(false);
        return;
      }

      setDistanceResult(data);
      const distance = distanceUnit === "miles" ? data.distanceMiles : data.distanceKm;
      onUpdate({ distanceFromBase: distance, distanceUnit });
    } catch {
      setCalcError("Failed to calculate distance. Please try again.");
    } finally {
      setCalculating(false);
    }
  }

  const calculatedFee =
    distanceFromBase !== undefined
      ? calculateDeliveryFee(distanceFromBase, distanceUnit, deliverySettings)
      : null;

  return (
    <div>
      {/* Mode selector */}
      <div
        style={{
          display: "flex",
          border: "1px solid #EDE8E3",
          borderRadius: 14,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => onUpdate({ deliveryMode: m.value })}
            style={{
              flex: 1,
              padding: "10px 0",
              border: "none",
              borderRight: m.value !== "none" ? "1px solid #EDE8E3" : "none",
              background: mode === m.value ? "#F05A00" : "#fff",
              color: mode === m.value ? "#fff" : "#1A1208",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Distance mode */}
      {mode === "distance" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Event Address</label>
            <input
              ref={addressInputRef}
              type="text"
              value={eventLocation}
              onChange={(e) => onUpdate({ eventLocation: e.target.value })}
              placeholder={
                googleMapsKey
                  ? "Start typing an address..."
                  : "Enter event address"
              }
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #EDE8E3",
                borderRadius: 12,
                fontSize: 14,
                color: "#1A1208",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div>
              <label style={labelStyle}>Unit</label>
              <div
                style={{
                  display: "flex",
                  border: "1px solid #EDE8E3",
                  borderRadius: 12,
                  overflow: "hidden",
                }}
              >
                {(["miles", "km"] as DistanceUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => onUpdate({ distanceUnit: u })}
                    style={{
                      padding: "9px 14px",
                      border: "none",
                      background: distanceUnit === u ? "#F05A00" : "#fff",
                      color: distanceUnit === u ? "#fff" : "#1A1208",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleCalculateDistance}
              disabled={calculating}
              style={{
                flex: 1,
                padding: "10px 14px",
                background: calculating ? "#EDE8E3" : "#F05A00",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 13,
                cursor: calculating ? "not-allowed" : "pointer",
              }}
            >
              {calculating ? "Calculating..." : "Calculate Distance"}
            </button>
          </div>

          {calcError && (
            <div
              style={{
                fontSize: 13,
                color: "#c0392b",
                padding: "8px 12px",
                background: "#fdf2f2",
                borderRadius: 8,
                border: "1px solid #fcdede",
              }}
            >
              {calcError}
            </div>
          )}

          {distanceResult && distanceFromBase !== undefined && (
            <div
              style={{
                padding: "12px 14px",
                background: "#F7F4F1",
                borderRadius: 12,
                fontSize: 13,
              }}
            >
              <div style={{ marginBottom: 4 }}>
                <span style={{ color: "#9A8070" }}>Distance: </span>
                <span style={{ fontWeight: 700, color: "#1A1208" }}>
                  {distanceUnit === "miles"
                    ? `${distanceResult.distanceMiles} miles`
                    : `${distanceResult.distanceKm} km`}
                </span>
                {distanceResult.duration && (
                  <span style={{ color: "#9A8070", marginLeft: 8 }}>
                    ({distanceResult.duration})
                  </span>
                )}
              </div>
              {calculatedFee !== null && (
                <div>
                  <span style={{ color: "#9A8070" }}>Delivery fee: </span>
                  <span style={{ fontWeight: 700, color: "#F05A00" }}>
                    {calculatedFee === 0
                      ? "Included (within free radius)"
                      : formatCurrency(calculatedFee)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Flat fee mode */}
      {mode === "flat" && (
        <div>
          <label style={labelStyle}>Flat Delivery Fee</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "#1A1208" }}>£</span>
            <input
              type="number"
              min={0}
              step={0.01}
              value={flatFee}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onUpdate({ flatDeliveryFee: isNaN(val) ? 0 : val });
              }}
              style={{
                width: "100%",
                padding: "10px 14px",
                border: "1px solid #EDE8E3",
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 600,
                color: "#1A1208",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
      )}

      {/* None mode */}
      {mode === "none" && (
        <div
          style={{
            padding: "12px 14px",
            background: "#F7F4F1",
            borderRadius: 12,
            fontSize: 13,
            color: "#9A8070",
            border: "1px solid #EDE8E3",
          }}
        >
          Delivery TBC — will not be included in total
        </div>
      )}
    </div>
  );
}
