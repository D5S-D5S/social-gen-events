import { DistanceUnit, DeliverySettings } from "../types";

export function convertMilesToKm(miles: number): number {
  return miles * 1.60934;
}

export function convertKmToMiles(km: number): number {
  return km / 1.60934;
}

export function calculateDeliveryFee(
  distance: number,
  unit: DistanceUnit,
  settings: DeliverySettings
): number {
  const freeRadius =
    unit === "miles" ? settings.freeRadiusMiles : settings.freeRadiusKm;
  const costPerUnit =
    unit === "miles" ? settings.costPerMile : settings.costPerKm;

  const billableDistance = Math.max(0, distance - freeRadius);

  if (billableDistance === 0) {
    return 0;
  }

  const raw = billableDistance * costPerUnit;
  const withMin = Math.max(raw, settings.minimumFee);
  const withMax =
    settings.maximumFee !== undefined
      ? Math.min(withMin, settings.maximumFee)
      : withMin;

  return Math.round(withMax * 100) / 100;
}
