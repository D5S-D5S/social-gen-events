export type Unit = "ft" | "m";
export type DistanceUnit = "miles" | "km";
export type QuoteStatus = "draft" | "sent" | "won" | "paid" | "lost" | "cancelled";
export type LineItemType = "fee" | "discount";
export type Confidence = "low" | "medium" | "high";
export type DeliveryMode = "distance" | "flat" | "none";
export type QuoteType = "quick" | "full";
export type DiscountType = "fixed" | "percentage";
export type EventEnvironment = "indoor" | "outdoor" | "";

export interface Tier {
  id: string;
  name: string;
  pricePerFt: number;
  pricePerM: number;
  description: string;
  minLengthFt?: number;
  minLengthM?: number;
  minimumSpend?: number;
  active: boolean;
  sortOrder: number;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  category?: string;
  active: boolean;
  sortOrder: number;
}

export interface LineItem {
  id: string;
  name: string;
  amount: number;
  type: LineItemType;
}

export interface DeliverySettings {
  homeAddress: string;
  freeRadiusMiles: number;
  freeRadiusKm: number;
  costPerMile: number;
  costPerKm: number;
  minimumFee: number;
  maximumFee?: number;
  setupFee: number;
  takedownFee: number;
}

export interface GlobalSettings {
  depositPercent: number;
  platformFeePercent: number;
  passPlatformFeeToCustomer: boolean;
  currency: string;
  taxEnabled?: boolean;
  taxPercent?: number;
  deliveryEnabled?: boolean;
  labourEnabled?: boolean;
  discountEnabled?: boolean;
  setupFeeEnabled?: boolean;
  takedownFeeEnabled?: boolean;
  defaultDeliveryMode?: "none" | "manual" | "automatic";
  defaultRoundTrip?: boolean;
  defaultHourlyRate?: number;
  aiTokensIncluded?: number;
  aiTokensUsed?: number;
  mockupTokensIncluded?: number;
  mockupTokensUsed?: number;
  defaultUnit: Unit;
  defaultDistanceUnit: DistanceUnit;
  tiers: Tier[];
  addons: Addon[];
  delivery: DeliverySettings;
}

export interface QuoteSettingsOverride {
  currency: string;
  depositPercent: number;
  taxEnabled: boolean;
  taxPercent: number;
  deliveryEnabled: boolean;
  labourEnabled: boolean;
  discountEnabled: boolean;
  setupFeeEnabled: boolean;
  takedownFeeEnabled: boolean;
  setupFeeAmount?: number;
  takedownFeeAmount?: number;
  labourHourlyRate?: number;
  labourStaffCount?: number;
}

export interface SelectedPackage {
  id: string;
  name: string;
  description?: string;
  price: number;
  includedItems?: string;
  includedGarlandLength?: number;
  tierId?: string;
  tierName?: string;
  unit?: Unit;
}

export interface QuotePricedItem {
  id: string;
  source: "addon" | "inventory" | "catalog" | "manual";
  sourceId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
  priceOverride?: number;
}

export interface DeliveryQuoteInput {
  enabled: boolean;
  mode: "none" | "manual" | "automatic";
  businessPostcode: string;
  venuePostcode: string;
  distance: number;
  roundTrip: boolean;
  freeMilesIncluded: number;
  pricePerMile: number;
  minimumDeliveryFee: number;
  manualFee: number;
  overrideFee?: number;
}

export interface LabourQuoteInput {
  enabled: boolean;
  manualOverride: boolean;
  setupHours: number;
  staffCount: number;
  hourlyRate: number;
  labourFeeOverride?: number;
  takedownHours: number;
  takedownFeeOverride?: number;
}

export interface DiscountQuoteInput {
  enabled: boolean;
  type: DiscountType;
  amount: number;
  reason: string;
}

export interface QuoteInput {
  quoteType?: QuoteType;
  clientName: string;
  clientPhone?: string;
  clientEmail: string;
  eventType?: string;
  eventDate: string;
  eventLocation: string;
  venuePostcode?: string;
  eventEnvironment?: EventEnvironment;
  quoteSettings?: QuoteSettingsOverride;
  selectedPackage?: SelectedPackage | null;
  tierId: string;
  length: number;
  includedLength?: number;
  unit: Unit;
  addonItems?: QuotePricedItem[];
  inventoryItems?: QuotePricedItem[];
  manualItems?: QuotePricedItem[];
  delivery?: DeliveryQuoteInput;
  labour?: LabourQuoteInput;
  discount?: DiscountQuoteInput;
  setupFee?: number;
  takedownFee?: number;
  selectedAddonIds: string[];
  lineItems: LineItem[];
  deliveryMode: DeliveryMode;
  flatDeliveryFee: number;
  eventCoordinates?: { lat: number; lng: number };
  distanceFromBase?: number;
  distanceUnit?: DistanceUnit;
  notes?: string;
}

export interface BreakdownAddon {
  id: string;
  name: string;
  price: number;
}

export interface QuoteBreakdown {
  tierName: string;
  length: number;
  includedLength?: number;
  extraLength?: number;
  unit: Unit;
  basePrice: number;
  packagePrice?: number;
  packageName?: string;
  extraGarlandPrice?: number;
  addonItems?: QuotePricedItem[];
  inventoryItems?: QuotePricedItem[];
  manualItems?: QuotePricedItem[];
  addons: BreakdownAddon[];
  addonsTotal: number;
  inventoryTotal?: number;
  manualItemsTotal?: number;
  fees: LineItem[];
  discounts: LineItem[];
  preDeliverySubtotal: number;
  deliveryFee: number | null;
  setupFee?: number;
  labourFee?: number;
  takedownLabourFee?: number;
  takedownFee?: number;
  discountAmount?: number;
  discountReason?: string;
  taxAmount?: number;
  taxPercent?: number;
  deliveryDistance?: number;
  deliveryUnit?: DistanceUnit;
  subtotal: number;
  platformFeeAmount: number;
  platformFeeVisible: boolean;
  platformFeeLabel: string;
  depositPercent: number;
  depositAmount: number;
  total: number;
}

export interface Quote {
  id: string;
  publicId: string;
  number: string;
  status: QuoteStatus;
  input: QuoteInput;
  breakdown: QuoteBreakdown;
  createdAt: string;
  updatedAt: string;
}

export interface EstimateInput {
  eventType?: string;
  backdropWidthFt?: number;
  numPanels?: number;
  archType?: string;
  imageBase64?: string;
  imageMimeType?: string;
  freeText?: string;
}

export interface EstimateOutput {
  estimatedLengthMinFt: number;
  estimatedLengthMaxFt: number;
  recommendedLengthFt: number;
  estimatedLengthMinM: number;
  estimatedLengthMaxM: number;
  recommendedLengthM: number;
  recommendedTierId: string;
  recommendedTierName: string;
  recommendedAddonIds: string[];
  confidence: Confidence;
  reasoning: string;
}

export interface DistanceResult {
  distanceMiles: number;
  distanceKm: number;
  duration?: string;
  origin: string;
  destination: string;
}
