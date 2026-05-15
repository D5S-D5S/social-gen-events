import { NextRequest, NextResponse } from "next/server";
import { DistanceResult, DistanceUnit } from "@/lib/types";

interface RequestBody {
  origin: string;
  destination: string;
  unit: DistanceUnit;
}

interface GoogleDistanceMatrixResponse {
  status: string;
  rows?: Array<{
    elements?: Array<{
      status: string;
      distance?: { value: number; text: string };
      duration?: { value: number; text: string };
    }>;
  }>;
  origin_addresses?: string[];
  destination_addresses?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RequestBody;
    const { origin, destination, unit } = body;

    if (!origin || !destination) {
      return NextResponse.json(
        { error: "origin and destination are required" },
        { status: 400 }
      );
    }

    const googleMapsKey = process.env.GOOGLE_MAPS_KEY;

    if (!googleMapsKey) {
      return NextResponse.json({
        error: "GOOGLE_MAPS_KEY not configured",
        fallback: true,
      });
    }

    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      units: "imperial",
      key: googleMapsKey,
    });

    const apiUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
    const apiResponse = await fetch(apiUrl);

    if (!apiResponse.ok) {
      return NextResponse.json({
        error: "Google Maps API request failed",
        fallback: true,
      });
    }

    const data = (await apiResponse.json()) as GoogleDistanceMatrixResponse;

    if (data.status !== "OK") {
      return NextResponse.json({
        error: `Google Maps API returned status: ${data.status}`,
        fallback: true,
      });
    }

    const element = data.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
      return NextResponse.json({
        error: `Route not found: ${element?.status ?? "unknown"}`,
        fallback: true,
      });
    }

    // Distance value is in meters
    const distanceMeters = element.distance?.value ?? 0;
    const distanceMiles = distanceMeters / 1609.344;
    const distanceKm = distanceMeters / 1000;

    const result: DistanceResult = {
      distanceMiles: Math.round(distanceMiles * 100) / 100,
      distanceKm: Math.round(distanceKm * 100) / 100,
      duration: element.duration?.text,
      origin: data.origin_addresses?.[0] ?? origin,
      destination: data.destination_addresses?.[0] ?? destination,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to calculate distance";
    return NextResponse.json({ error: message, fallback: true });
  }
}
