// Core domain types for HMRM Booking Engine

export interface Property {
  id: string;
  propertyId: string;
  name: string;
  timezone: string;
  currency: string;
  totalRooms: number;
  overbookingTolerance: number;
  riskLambda: number;
}

export interface RoomType {
  id: string;
  propertyId: string;
  roomTypeCode: string;
  name: string;
  description: string | null;
  totalInventory: number;
  minPrice: number;
  maxPrice: number;
  defaultPrice: number;
  currentPrice: number;
  upgradeFrom: string | null;
  upgradeProb: number;
  imageUrl: string | null;
  amenities?: Amenity[];
}

export interface Amenity {
  id: string;
  code: string;
  name: string;
  icon: string | null;
}

export interface RatePlan {
  id: string;
  propertyId: string;
  ratePlanCode: string;
  name: string;
  description: string | null;
  isRefundable: boolean;
  cancelDeadlineHours: number;
  minLos: number;
  maxLos: number;
  discountPct: number;
  includesBreakfast: boolean;
}

export interface Addon {
  id: string;
  propertyId: string;
  code: string;
  name: string;
  description: string | null;
  pricePerNight: boolean;
  price: number;
}

export interface Booking {
  id: string;
  bookingId: string;
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  channel: string;
  arrivalDate: Date;
  departureDate: Date;
  los: number;
  adults: number;
  children: number;
  pricePerNight: number;
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  netRevenue: number;
  addonsTotal: number;
  leadTimeDays: number | null;
  isRefundable: boolean;
  cancellationPolicy: string | null;
  status: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string | null;
  guestCountry: string | null;
  specialRequests: string | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  refundAmount: number | null;
  sessionId: string | null;
  searchId: string | null;
  createdAt: Date;
  updatedAt: Date;
  roomType?: RoomType;
  ratePlan?: RatePlan;
}

export interface InventoryDaily {
  id: string;
  propertyId: string;
  arrivalDate: Date;
  roomTypeId: string;
  total: number;
  otb: number;
  available: number;
  held: number;
  updatedAt: Date;
  roomType?: RoomType;
}

export interface PricingDecision {
  id: string;
  propertyId: string;
  arrivalDate: Date;
  decisionTime: Date;
  pricingMode: 'ML_ONLY' | 'ML_CONTROL_VARIATE' | 'FULL_MC';
  pricesBefore: Record<string, number> | null;
  pricesAfter: Record<string, number> | null;
  expectedNetRevenue: number;
  revenueVariance: number | null;
  confidenceLow: number | null;
  confidenceHigh: number | null;
  triggerReason: string | null;
  computationMs: number | null;
  searchIntensityIndex: number | null;
  conversionProbability: number | null;
}

export interface FeatureStore {
  id: string;
  propertyId: string;
  arrivalDate: Date;
  searchIntensityIndex: number;
  priceCheckFrequency: number;
  geoDemandSpikeIndex: number;
  cartAbandonmentRate: number;
  cancellationVelocityIndex: number;
  pickupPaceIndex: number;
  competitorPriceIndex: number;
  conversionProbability: number;
  updatedAt: Date;
}

export interface RoomHold {
  id: string;
  holdId: string;
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  sessionId: string;
  searchId: string | null;
  arrivalDate: Date;
  departureDate: Date;
  los: number;
  adults: number;
  children: number;
  pricePerNight: number;
  totalPrice: number;
  expiresAt: Date;
}

// API Response Types
export interface SearchResponse {
  propertyId: string;
  arrivalDate: string;
  departureDate: string;
  los: number;
  currency: string;
  rooms: RoomSearchResult[];
  pricingNote: string;
  searchId: string;
}

export interface RoomSearchResult {
  roomType: string;
  name: string;
  description: string | null;
  availableCount: number;
  imageUrl: string | null;
  amenities: string[];
  ratePlans: RatePlanResult[];
}

export interface RatePlanResult {
  ratePlanCode: string;
  name: string;
  description: string | null;
  pricePerNight: number;
  totalPrice: number;
  isRefundable: boolean;
  cancellationDeadline: string | null;
  includesBreakfast: boolean;
  discountPct: number;
  urgencyBadge: string | null;
  minLos: number;
  maxLos: number;
}

export interface HoldResponse {
  holdId: string;
  expiresAt: string;
  roomType: string;
  roomName: string;
  pricePerNight: number;
  totalPrice: number;
  addonsAvailable: Addon[];
}

export interface ConfirmBookingResponse {
  bookingId: string;
  status: string;
  arrivalDate: string;
  departureDate: string;
  roomType: string;
  roomName: string;
  ratePlan: string;
  pricePerNight: number;
  grossRevenue: number;
  addonsTotal: number;
  totalCharged: number;
  cancellationDeadline: string | null;
  confirmationEmailSent: boolean;
  guestName: string;
}

// Pricing Engine Types
export interface PricingRequest {
  propertyId: string;
  arrivalDate: string;
  los: number;
  currency: string;
  roomInventory: Record<string, number>;
  otb: Record<string, number>;
  realTimeSignals: RealTimeSignals;
  mode: 'ml_only' | 'hybrid' | 'full_mc';
  riskAversionLambda: number;
}

export interface RealTimeSignals {
  searchIntensityIndex: number;
  conversionProbability: number;
  competitorPriceIndex: number;
  cancellationVelocityIndex: number;
  pickupPaceIndex: number;
  geoDemandSpikeIndex: number;
}

export interface PricingResponse {
  recommendedPrices: Record<string, number>;
  expectedNetRevenue: number;
  revenueVariance: number;
  confidenceInterval: [number, number];
  optimizationModeUsed: string;
  computationTimeMs: number;
  traceId: string;
  serviceVersion: string;
}

// Dashboard Types
export interface KPIStats {
  revpar: number;
  adr: number;
  occupancy: number;
  netRevenue: number;
  directShare: number;
  cancellationRate: number;
  totalBookings: number;
  avgLos: number;
}

export interface DashboardData {
  kpis: KPIStats;
  revenueByChannel: { channel: string; revenue: number; bookings: number }[];
  occupancyByDate: { date: string; occupancy: number }[];
  recentBookings: Booking[];
  pricingRecommendations: PricingDecision[];
}

// Search form state
export interface SearchFormState {
  arrivalDate: Date | null;
  departureDate: Date | null;
  adults: number;
  children: number;
  rooms: number;
  promoCode: string;
}

// Checkout state
export interface CheckoutState {
  holdId: string | null;
  roomType: RoomSearchResult | null;
  selectedRatePlan: RatePlanResult | null;
  arrivalDate: Date | null;
  departureDate: Date | null;
  los: number;
  adults: number;
  children: number;
  pricePerNight: number;
  totalPrice: number;
  selectedAddons: { code: string; quantity: number; price: number }[];
  guestInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
    specialRequests: string;
  };
}
