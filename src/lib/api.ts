import type { SearchFormState, SearchResponse, HoldResponse, ConfirmBookingResponse, Booking, KPIStats, DashboardData, PricingDecision, FeatureStore } from '@/types';

const API_BASE = '/api';

// Helper to get session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return '';
  return sessionStorage.getItem('hmrm_session_id') || '';
};

// Search availability
export async function searchAvailability(params: SearchFormState & { propertyId: string }): Promise<SearchResponse> {
  const response = await fetch(`${API_BASE}/booking/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property_id: params.propertyId,
      arrival_date: params.arrivalDate?.toISOString().split('T')[0],
      departure_date: params.departureDate?.toISOString().split('T')[0],
      adults: params.adults,
      children: params.children,
      rooms: params.rooms,
      currency: 'USD',
      promo_code: params.promoCode || null,
      session_id: getSessionId(),
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Search failed');
  }
  
  return response.json();
}

// Hold room
export async function holdRoom(params: {
  propertyId: string;
  searchId: string;
  roomType: string;
  ratePlanCode: string;
  arrivalDate: Date;
  departureDate: Date;
  adults: number;
  children: number;
}): Promise<HoldResponse> {
  const response = await fetch(`${API_BASE}/booking/hold`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      property_id: params.propertyId,
      search_id: params.searchId,
      room_type: params.roomType,
      rate_plan_code: params.ratePlanCode,
      arrival_date: params.arrivalDate.toISOString().split('T')[0],
      departure_date: params.departureDate.toISOString().split('T')[0],
      adults: params.adults,
      children: params.children,
      session_id: getSessionId(),
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Hold failed');
  }
  
  return response.json();
}

// Confirm booking
export async function confirmBooking(params: {
  holdId: string;
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    country: string;
  };
  addons: { code: string; quantity: number }[];
  specialRequests: string;
}): Promise<ConfirmBookingResponse> {
  const response = await fetch(`${API_BASE}/booking/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      hold_id: params.holdId,
      guest: params.guest,
      addons: params.addons,
      special_requests: params.specialRequests,
      session_id: getSessionId(),
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Booking failed');
  }
  
  return response.json();
}

// Get booking
export async function getBooking(bookingId: string): Promise<Booking> {
  const response = await fetch(`${API_BASE}/booking/${bookingId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get booking');
  }
  
  return response.json();
}

// Cancel booking
export async function cancelBooking(bookingId: string, reason: string): Promise<{
  bookingId: string;
  status: string;
  refundAmount: number;
  refundStatus: string;
}> {
  const response = await fetch(`${API_BASE}/booking/${bookingId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Cancellation failed');
  }
  
  return response.json();
}

// Track event
export async function trackEvent(eventType: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: eventType,
        ...payload,
        session_id: getSessionId(),
      }),
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}

// Dashboard API
export async function getDashboardData(propertyId: string): Promise<DashboardData> {
  const response = await fetch(`${API_BASE}/dashboard?propertyId=${propertyId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get dashboard data');
  }
  
  return response.json();
}

// Get pricing decisions
export async function getPricingDecisions(propertyId: string, startDate?: string, endDate?: string): Promise<PricingDecision[]> {
  const params = new URLSearchParams({ propertyId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  
  const response = await fetch(`${API_BASE}/pricing/decisions?${params}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get pricing decisions');
  }
  
  return response.json();
}

// Trigger pricing optimization
export async function triggerPricing(params: {
  propertyId: string;
  arrivalDate: string;
  mode: 'ml_only' | 'hybrid' | 'full_mc';
}): Promise<{
  recommendedPrices: Record<string, number>;
  expectedNetRevenue: number;
  optimizationModeUsed: string;
}> {
  const response = await fetch(`${API_BASE}/pricing/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Pricing optimization failed');
  }
  
  return response.json();
}

// Apply pricing recommendation
export async function applyPricing(params: {
  propertyId: string;
  arrivalDate: string;
  prices: Record<string, number>;
}): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/pricing/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to apply pricing');
  }
  
  return response.json();
}

// Get feature store data
export async function getFeatureStore(propertyId: string, arrivalDate: string): Promise<FeatureStore> {
  const response = await fetch(`${API_BASE}/features?propertyId=${propertyId}&arrivalDate=${arrivalDate}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get feature store data');
  }
  
  return response.json();
}
