import { calculateBreakdown, roundCurrency, formatCurrency } from "./engine";
import { DEFAULT_SETTINGS } from "../defaults";
import { GlobalSettings, QuoteInput } from "../types";

function makeInput(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return {
    clientName: "Test Client",
    clientEmail: "test@example.com",
    eventDate: "2025-06-01",
    eventLocation: "",
    tierId: "tier-classic",
    length: 20,
    unit: "ft",
    selectedAddonIds: [],
    lineItems: [],
    deliveryMode: "none",
    flatDeliveryFee: 0,
    ...overrides,
  };
}

describe("calculateBreakdown", () => {
  test("20ft Classic = £300 base price", () => {
    const result = calculateBreakdown(makeInput(), DEFAULT_SETTINGS);
    // 20 * £15 = £300, minimum spend £150 not triggered
    expect(result.basePrice).toBe(300);
  });

  test("6m Premier base price", () => {
    const input = makeInput({ tierId: "tier-premier", length: 6, unit: "m" });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    // 6 * £72 = £432, minimum spend £250 not triggered
    expect(result.basePrice).toBe(432);
  });

  test("add-ons sum correctly", () => {
    const input = makeInput({
      selectedAddonIds: ["addon-cake-stand", "addon-led-number-set"],
    });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    // £45 + £60 = £105
    expect(result.addonsTotal).toBe(105);
    expect(result.addons).toHaveLength(2);
  });

  test("custom fee increases subtotal", () => {
    const input = makeInput({
      lineItems: [{ id: "fee-1", name: "Setup fee", amount: 50, type: "fee" }],
    });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    // 300 base + 50 fee = 350
    expect(result.preDeliverySubtotal).toBe(350);
  });

  test("discount reduces subtotal", () => {
    const input = makeInput({
      lineItems: [
        { id: "disc-1", name: "Loyalty discount", amount: 30, type: "discount" },
      ],
    });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    // 300 base - 30 discount = 270
    expect(result.preDeliverySubtotal).toBe(270);
  });

  test("subtotal minimum is 0 even with large discount", () => {
    const input = makeInput({
      lineItems: [
        {
          id: "disc-1",
          name: "Full discount",
          amount: 999,
          type: "discount",
        },
      ],
    });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    expect(result.preDeliverySubtotal).toBe(0);
  });

  test("flat delivery fee adds to total", () => {
    const input = makeInput({ deliveryMode: "flat", flatDeliveryFee: 25 });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    expect(result.deliveryFee).toBe(25);
    expect(result.subtotal).toBe(325);
  });

  test("distance within free radius = £0 delivery fee", () => {
    const settings: GlobalSettings = {
      ...DEFAULT_SETTINGS,
      delivery: {
        ...DEFAULT_SETTINGS.delivery,
        freeRadiusMiles: 10,
        minimumFee: 20,
      },
    };
    const input = makeInput({
      deliveryMode: "distance",
      distanceFromBase: 8,
      distanceUnit: "miles",
    });
    const result = calculateBreakdown(input, settings);
    expect(result.deliveryFee).toBe(0);
  });

  test("distance beyond free radius uses minimumFee when raw is lower", () => {
    const settings: GlobalSettings = {
      ...DEFAULT_SETTINGS,
      delivery: {
        ...DEFAULT_SETTINGS.delivery,
        freeRadiusMiles: 10,
        costPerMile: 1.5,
        minimumFee: 20,
      },
    };
    // 12 miles, free 10 → billable 2 miles → raw = 3, min 20 → fee = 20
    const input = makeInput({
      deliveryMode: "distance",
      distanceFromBase: 12,
      distanceUnit: "miles",
    });
    const result = calculateBreakdown(input, settings);
    expect(result.deliveryFee).toBe(20);
  });

  test("large distance capped by maximumFee", () => {
    const settings: GlobalSettings = {
      ...DEFAULT_SETTINGS,
      delivery: {
        ...DEFAULT_SETTINGS.delivery,
        freeRadiusMiles: 0,
        costPerMile: 2,
        minimumFee: 10,
        maximumFee: 50,
      },
    };
    // 100 miles * £2 = £200, capped at £50
    const input = makeInput({
      deliveryMode: "distance",
      distanceFromBase: 100,
      distanceUnit: "miles",
    });
    const result = calculateBreakdown(input, settings);
    expect(result.deliveryFee).toBe(50);
  });

  test("missing location (deliveryMode none) → deliveryFee is null", () => {
    const input = makeInput({ deliveryMode: "none" });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    expect(result.deliveryFee).toBeNull();
  });

  test("platform fee applied when passPlatformFeeToCustomer = true", () => {
    const settings: GlobalSettings = {
      ...DEFAULT_SETTINGS,
      passPlatformFeeToCustomer: true,
      platformFeePercent: 2.5,
    };
    const input = makeInput();
    const result = calculateBreakdown(input, settings);
    // subtotal = 300, platform fee = 300 * 0.025 = 7.5
    expect(result.platformFeeAmount).toBe(7.5);
    expect(result.total).toBe(307.5);
  });

  test("platform fee = 0 when not passed to customer", () => {
    const settings: GlobalSettings = {
      ...DEFAULT_SETTINGS,
      passPlatformFeeToCustomer: false,
    };
    const input = makeInput();
    const result = calculateBreakdown(input, settings);
    expect(result.platformFeeAmount).toBe(0);
    expect(result.total).toBe(300);
  });

  test("deposit = 30% of total", () => {
    const settings: GlobalSettings = {
      ...DEFAULT_SETTINGS,
      depositPercent: 30,
    };
    const input = makeInput();
    const result = calculateBreakdown(input, settings);
    // total = 300, deposit = 300 * 0.30 = 90
    expect(result.depositAmount).toBe(90);
    expect(result.depositPercent).toBe(30);
  });

  test("Grand Gala minimum spend enforced", () => {
    // 3ft * £35 = £105, but minimum spend is £500
    const input = makeInput({ tierId: "tier-grand-gala", length: 3, unit: "ft" });
    const result = calculateBreakdown(input, DEFAULT_SETTINGS);
    expect(result.basePrice).toBe(500);
  });

  test("throws if tier not found", () => {
    const input = makeInput({ tierId: "tier-nonexistent" });
    expect(() => calculateBreakdown(input, DEFAULT_SETTINGS)).toThrow(
      "Tier not found: tier-nonexistent"
    );
  });

  test("roundCurrency handles floating point", () => {
    // Classic floating point issue: 0.1 + 0.2 = 0.30000000000000004
    expect(roundCurrency(0.1 + 0.2)).toBe(0.3);
    expect(roundCurrency(1.005)).toBe(1.01);
    expect(roundCurrency(2.555)).toBe(2.56);
  });
});

describe("formatCurrency", () => {
  test("formats GBP correctly", () => {
    const result = formatCurrency(300);
    expect(result).toBe("£300.00");
  });

  test("formats with custom currency", () => {
    const result = formatCurrency(300, "USD");
    expect(result).toContain("300.00");
  });
});
