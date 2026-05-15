import { calculateDeliveryFee, convertMilesToKm, convertKmToMiles } from "./calculator";
import { DeliverySettings } from "../types";

function makeSettings(overrides: Partial<DeliverySettings> = {}): DeliverySettings {
  return {
    homeAddress: "London, UK",
    freeRadiusMiles: 10,
    freeRadiusKm: 16,
    costPerMile: 1.5,
    costPerKm: 0.93,
    minimumFee: 20,
    setupFee: 0,
    takedownFee: 0,
    ...overrides,
  };
}

describe("calculateDeliveryFee", () => {
  test("within free radius returns 0", () => {
    const settings = makeSettings({ freeRadiusMiles: 10 });
    expect(calculateDeliveryFee(8, "miles", settings)).toBe(0);
  });

  test("exactly at free radius boundary returns 0", () => {
    const settings = makeSettings({ freeRadiusMiles: 10 });
    expect(calculateDeliveryFee(10, "miles", settings)).toBe(0);
  });

  test("beyond free radius uses minimum fee when raw is lower", () => {
    // 12 miles, free 10 → billable 2 miles → raw = 2 * 1.5 = 3, min 20 → fee = 20
    const settings = makeSettings({
      freeRadiusMiles: 10,
      costPerMile: 1.5,
      minimumFee: 20,
    });
    expect(calculateDeliveryFee(12, "miles", settings)).toBe(20);
  });

  test("standard calculation when raw exceeds minimum", () => {
    // 20 miles, free 10 → billable 10 miles → raw = 10 * 1.5 = 15, min 20 → fee = 20
    const settings = makeSettings({
      freeRadiusMiles: 10,
      costPerMile: 1.5,
      minimumFee: 10,
    });
    // billable = 10, raw = 15, min = 10 → result = 15
    expect(calculateDeliveryFee(20, "miles", settings)).toBe(15);
  });

  test("maximumFee caps the result", () => {
    // 100 miles, free 0 → billable 100 miles → raw = 150, capped at 50
    const settings = makeSettings({
      freeRadiusMiles: 0,
      costPerMile: 1.5,
      minimumFee: 10,
      maximumFee: 50,
    });
    expect(calculateDeliveryFee(100, "miles", settings)).toBe(50);
  });

  test("km calculation is correct", () => {
    // 20km, free 16km → billable 4km → raw = 4 * 0.93 = 3.72, min 20 → fee = 20
    const settings = makeSettings({
      freeRadiusKm: 16,
      costPerKm: 0.93,
      minimumFee: 20,
    });
    expect(calculateDeliveryFee(20, "km", settings)).toBe(20);
  });

  test("km calculation with large distance", () => {
    // 50km, free 16km → billable 34km → raw = 34 * 0.93 = 31.62, min 20 → fee = 31.62
    const settings = makeSettings({
      freeRadiusKm: 16,
      costPerKm: 0.93,
      minimumFee: 20,
    });
    expect(calculateDeliveryFee(50, "km", settings)).toBe(31.62);
  });
});

describe("unit conversions", () => {
  test("convertMilesToKm is correct", () => {
    expect(convertMilesToKm(1)).toBeCloseTo(1.60934, 4);
    expect(convertMilesToKm(10)).toBeCloseTo(16.0934, 3);
  });

  test("convertKmToMiles is correct", () => {
    expect(convertKmToMiles(1.60934)).toBeCloseTo(1, 4);
    expect(convertKmToMiles(16)).toBeCloseTo(9.9419, 3);
  });

  test("round trip conversion is stable", () => {
    const original = 25;
    const converted = convertMilesToKm(original);
    const back = convertKmToMiles(converted);
    expect(back).toBeCloseTo(original, 4);
  });
});
