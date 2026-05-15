import {
  QuoteInput,
  GlobalSettings,
  QuoteBreakdown,
  BreakdownAddon,
  LineItem,
  QuotePricedItem,
} from "../types";
import { calculateDeliveryFee } from "../delivery/calculator";

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateBreakdown(
  input: QuoteInput,
  settings: GlobalSettings
): QuoteBreakdown {
  const tier = settings.tiers.find((t) => t.id === input.tierId);
  if (!tier) {
    throw new Error(`Tier not found: ${input.tierId}`);
  }

  const quoteSettings = {
    currency: input.quoteSettings?.currency ?? settings.currency,
    taxEnabled: input.quoteSettings?.taxEnabled ?? settings.taxEnabled ?? false,
    taxPercent: input.quoteSettings?.taxPercent ?? settings.taxPercent ?? 0,
    deliveryEnabled: input.quoteSettings?.deliveryEnabled ?? settings.deliveryEnabled ?? true,
    labourEnabled: input.quoteSettings?.labourEnabled ?? settings.labourEnabled ?? true,
    discountEnabled: input.quoteSettings?.discountEnabled ?? settings.discountEnabled ?? true,
    setupFeeEnabled: input.quoteSettings?.setupFeeEnabled ?? settings.setupFeeEnabled ?? true,
    takedownFeeEnabled: input.quoteSettings?.takedownFeeEnabled ?? settings.takedownFeeEnabled ?? true,
    setupFeeAmount: input.quoteSettings?.setupFeeAmount ?? settings.delivery.setupFee ?? 0,
    takedownFeeAmount: input.quoteSettings?.takedownFeeAmount ?? settings.delivery.takedownFee ?? 0,
    depositPercent: input.quoteSettings?.depositPercent ?? settings.depositPercent,
  };

  // 1. Package + extra garland pricing. MVP uses included length from the package
  // and only prices the extra length against the selected tier.
  const tierUnitRate = input.unit === "ft" ? tier.pricePerFt : tier.pricePerM;
  const packagePrice = roundCurrency(input.selectedPackage?.price ?? 0);
  const includedLength = Number(input.includedLength ?? input.selectedPackage?.includedGarlandLength ?? 0);
  const extraLength = Math.max(0, Number(input.length || 0) - includedLength);
  const extraGarlandPrice = roundCurrency(extraLength * tierUnitRate);

  // Backwards compatibility for old quick quotes that only had length/tier.
  let basePrice = roundCurrency(input.length * tierUnitRate);
  if (packagePrice > 0 || includedLength > 0 || input.quoteType === "full") {
    basePrice = extraGarlandPrice;
  } else if (tier.minimumSpend !== undefined && basePrice < tier.minimumSpend) {
    basePrice = tier.minimumSpend;
  }

  // 2. Add-ons from the old settings model and the new saved/custom item model.
  const addons: BreakdownAddon[] = input.selectedAddonIds
    .map((id) => settings.addons.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined)
    .map((a) => ({ id: a.id, name: a.name, price: a.price }));

  const addonItems = normalisePricedItems(input.addonItems ?? [], "addon");
  const inventoryItems = normalisePricedItems(input.inventoryItems ?? [], "inventory");
  const manualItems = normalisePricedItems(input.manualItems ?? [], "manual");

  const addonsTotal = roundCurrency(
    addons.reduce((sum, a) => sum + a.price, 0) + totalPricedItems(addonItems)
  );
  const inventoryTotal = roundCurrency(totalPricedItems(inventoryItems));
  const manualItemsTotal = roundCurrency(totalPricedItems(manualItems));

  // 3. Legacy fee/discount rows still work.
  const fees: LineItem[] = input.lineItems.filter((li) => li.type === "fee");
  const discounts: LineItem[] = input.lineItems.filter(
    (li) => li.type === "discount"
  );

  const feesTotal = roundCurrency(fees.reduce((sum, f) => sum + f.amount, 0));
  const discountsTotal = roundCurrency(
    discounts.reduce((sum, d) => sum + d.amount, 0)
  );

  // 4. Delivery, setup, labour, takedown.
  const setupFee = quoteSettings.setupFeeEnabled ? roundCurrency(Number(input.setupFee ?? quoteSettings.setupFeeAmount ?? 0)) : 0;
  const takedownFee = quoteSettings.takedownFeeEnabled ? roundCurrency(Number(input.takedownFee ?? quoteSettings.takedownFeeAmount ?? 0)) : 0;
  const deliveryFee = quoteSettings.deliveryEnabled ? calculateMvpDeliveryFee(input) : 0;
  const labourFee = quoteSettings.labourEnabled ? calculateLabourFee(input) : 0;
  const takedownLabourFee = quoteSettings.labourEnabled ? calculateTakedownLabourFee(input) : 0;

  // 5. Discount and tax.
  const beforeDiscount = roundCurrency(
    packagePrice +
    basePrice +
    addonsTotal +
    inventoryTotal +
    manualItemsTotal +
    feesTotal +
    setupFee +
    deliveryFee +
    labourFee +
    takedownLabourFee +
    takedownFee
  );

  const discountAmount = quoteSettings.discountEnabled
    ? roundCurrency(calculateDiscountAmount(input, beforeDiscount) + discountsTotal)
    : 0;

  const taxableSubtotal = Math.max(0, beforeDiscount - discountAmount);
  const taxAmount = quoteSettings.taxEnabled
    ? roundCurrency(taxableSubtotal * (quoteSettings.taxPercent / 100))
    : 0;

  const preDeliverySubtotal = roundCurrency(
    Math.max(0, packagePrice + basePrice + addonsTotal + inventoryTotal + manualItemsTotal + feesTotal - discountAmount)
  );

  // 6. Legacy distance metadata.
  let deliveryDistance: number | undefined;
  let deliveryUnit = input.distanceUnit;
  let legacyDeliveryFee: number | null = null;
  if (input.deliveryMode === "flat" && !input.delivery) {
    legacyDeliveryFee = roundCurrency(input.flatDeliveryFee);
  } else if (
    input.deliveryMode === "distance" &&
    input.distanceFromBase !== undefined &&
    !input.delivery
  ) {
    const distUnit = input.distanceUnit ?? settings.defaultDistanceUnit;
    legacyDeliveryFee = roundCurrency(
      calculateDeliveryFee(
        input.distanceFromBase,
        distUnit,
        settings.delivery
      )
    );
    deliveryDistance = input.distanceFromBase;
    deliveryUnit = distUnit;
  }

  const finalDeliveryFee = input.delivery ? deliveryFee : (legacyDeliveryFee ?? deliveryFee);

  // 7. Subtotal is the MVP quote total. Payment/deposit display is intentionally
  // left for later tiers, but the fields remain for old screens/data.
  const subtotal = roundCurrency(taxableSubtotal + taxAmount);

  // 8. Platform fee is disabled for Tier 1 quote output.
  const platformFeeAmount = settings.passPlatformFeeToCustomer
    ? roundCurrency(subtotal * (settings.platformFeePercent / 100))
    : 0;

  // 9. Total remains equal to subtotal for MVP quote builder.
  const total = roundCurrency(subtotal + platformFeeAmount);

  // 10. Kept for compatibility, not shown in the MVP quote summary.
  const depositAmount = roundCurrency(
    total * (quoteSettings.depositPercent / 100)
  );

  return {
    tierName: tier.name,
    length: input.length,
    includedLength,
    extraLength,
    unit: input.unit,
    basePrice,
    packagePrice,
    packageName: input.selectedPackage?.name,
    extraGarlandPrice,
    addonItems,
    inventoryItems,
    manualItems,
    addons,
    addonsTotal,
    inventoryTotal,
    manualItemsTotal,
    fees,
    discounts,
    preDeliverySubtotal,
    deliveryFee: finalDeliveryFee,
    setupFee,
    labourFee,
    takedownLabourFee,
    takedownFee,
    discountAmount,
    discountReason: input.discount?.reason,
    taxAmount,
    taxPercent: quoteSettings.taxEnabled ? quoteSettings.taxPercent : 0,
    deliveryDistance,
    deliveryUnit,
    subtotal,
    platformFeeAmount,
    platformFeeVisible: settings.passPlatformFeeToCustomer,
    platformFeeLabel: `Transaction fee (${settings.platformFeePercent}%)`,
    depositPercent: quoteSettings.depositPercent,
    depositAmount,
    total,
  };
}

function normalisePricedItems(items: QuotePricedItem[], fallbackSource: QuotePricedItem["source"]): QuotePricedItem[] {
  return items.map((item) => ({
    ...item,
    id: item.id || crypto.randomUUID(),
    source: item.source || fallbackSource,
    quantity: Number(item.quantity) || 0,
    unitPrice: Number(item.priceOverride ?? item.unitPrice) || 0,
  }));
}

function totalPricedItems(items: QuotePricedItem[]): number {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.priceOverride ?? item.unitPrice) || 0), 0);
}

function calculateMvpDeliveryFee(input: QuoteInput): number {
  const delivery = input.delivery;
  if (!delivery?.enabled) return 0;
  if (delivery.mode === "none") return 0;
  if (typeof delivery.overrideFee === "number") return roundCurrency(delivery.overrideFee);
  if (delivery.mode === "manual") return roundCurrency(delivery.manualFee);

  const billableDistance = Math.max(0, Number(delivery.distance || 0) - Number(delivery.freeMilesIncluded || 0));
  const multiplier = delivery.roundTrip ? 2 : 1;
  const calculated = billableDistance * multiplier * Number(delivery.pricePerMile || 0);
  if (calculated <= 0) return 0;
  return roundCurrency(Math.max(calculated, Number(delivery.minimumDeliveryFee || 0)));
}

function calculateLabourFee(input: QuoteInput): number {
  const labour = input.labour;
  if (!labour?.enabled) return 0;
  if (labour.manualOverride && typeof labour.labourFeeOverride === "number") return roundCurrency(labour.labourFeeOverride);
  return roundCurrency(Number(labour.setupHours || 0) * Number(labour.staffCount || 0) * Number(labour.hourlyRate || 0));
}

function calculateTakedownLabourFee(input: QuoteInput): number {
  const labour = input.labour;
  if (!labour?.enabled) return 0;
  if (labour.manualOverride && typeof labour.takedownFeeOverride === "number") return roundCurrency(labour.takedownFeeOverride);
  return roundCurrency(Number(labour.takedownHours || 0) * Number(labour.staffCount || 0) * Number(labour.hourlyRate || 0));
}

function calculateDiscountAmount(input: QuoteInput, subtotal: number): number {
  const discount = input.discount;
  if (!discount?.enabled) return 0;
  if (discount.type === "percentage") {
    return subtotal * (Number(discount.amount || 0) / 100);
  }
  return Number(discount.amount || 0);
}
