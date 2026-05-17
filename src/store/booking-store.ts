import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SearchFormState, CheckoutState, RoomSearchResult, RatePlanResult, Addon } from '@/types';

// Generate unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/** JSON persist stores dates as strings; revive on rehydrate. */
const parseStoredDate = (value: Date | string | null | undefined): Date | null => {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
};

const reviveDateFields = <T extends { arrivalDate: Date | null; departureDate: Date | null }>(
  form: T
): T => ({
  ...form,
  arrivalDate: parseStoredDate(form.arrivalDate),
  departureDate: parseStoredDate(form.departureDate),
});

// Get or create session ID
const getSessionId = () => {
  if (typeof window === 'undefined') return generateSessionId();
  let sessionId = sessionStorage.getItem('hmrm_session_id');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('hmrm_session_id', sessionId);
  }
  return sessionId;
};

interface BookingStore {
  // Session
  sessionId: string;
  
  // Search state
  searchForm: SearchFormState;
  searchResults: RoomSearchResult[] | null;
  searchId: string | null;
  isSearching: boolean;
  
  // Checkout state
  checkout: CheckoutState;
  
  // UI state
  currentView: 'booking' | 'dashboard';
  activeTab: 'search' | 'checkout' | 'confirmation' | 'manage';
  
  // Actions
  setSearchForm: (form: Partial<SearchFormState>) => void;
  setSearchResults: (results: RoomSearchResult[] | null, searchId: string | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  
  selectRoom: (room: RoomSearchResult, ratePlan: RatePlanResult, holdId: string) => void;
  setHoldInfo: (holdId: string, pricePerNight: number, totalPrice: number, addons: Addon[]) => void;
  setGuestInfo: (info: Partial<CheckoutState['guestInfo']>) => void;
  addAddon: (addon: Addon) => void;
  removeAddon: (code: string) => void;
  updateAddonQuantity: (code: string, quantity: number) => void;
  
  setCurrentView: (view: 'booking' | 'dashboard') => void;
  setActiveTab: (tab: 'search' | 'checkout' | 'confirmation' | 'manage') => void;
  
  resetCheckout: () => void;
  resetAll: () => void;
}

const initialSearchForm: SearchFormState = {
  arrivalDate: null,
  departureDate: null,
  adults: 2,
  children: 0,
  rooms: 1,
  promoCode: '',
};

const initialCheckout: CheckoutState = {
  holdId: null,
  roomType: null,
  selectedRatePlan: null,
  arrivalDate: null,
  departureDate: null,
  los: 0,
  adults: 2,
  children: 0,
  pricePerNight: 0,
  totalPrice: 0,
  selectedAddons: [],
  guestInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    specialRequests: '',
  },
};

export const useBookingStore = create<BookingStore>()(
  persist(
    (set, get) => ({
      sessionId: typeof window !== 'undefined' ? getSessionId() : generateSessionId(),
      
      searchForm: initialSearchForm,
      searchResults: null,
      searchId: null,
      isSearching: false,
      
      checkout: initialCheckout,
      
      currentView: 'booking',
      activeTab: 'search',
      
      setSearchForm: (form) =>
        set((state) => ({
          searchForm: { ...state.searchForm, ...form },
        })),
      
      setSearchResults: (results, searchId) =>
        set({
          searchResults: results,
          searchId,
          isSearching: false,
        }),
      
      setIsSearching: (isSearching) => set({ isSearching }),
      
      selectRoom: (room, ratePlan, holdId) =>
        set((state) => ({
          checkout: {
            ...state.checkout,
            holdId,
            roomType: room,
            selectedRatePlan: ratePlan,
            arrivalDate: state.searchForm.arrivalDate,
            departureDate: state.searchForm.departureDate,
            los: ratePlan.totalPrice / ratePlan.pricePerNight,
            adults: state.searchForm.adults,
            children: state.searchForm.children,
            pricePerNight: ratePlan.pricePerNight,
            totalPrice: ratePlan.totalPrice,
          },
          activeTab: 'checkout',
        })),
      
      setHoldInfo: (holdId, pricePerNight, totalPrice, addons) =>
        set((state) => ({
          checkout: {
            ...state.checkout,
            holdId,
            pricePerNight,
            totalPrice,
          },
        })),
      
      setGuestInfo: (info) =>
        set((state) => ({
          checkout: {
            ...state.checkout,
            guestInfo: { ...state.checkout.guestInfo, ...info },
          },
        })),
      
      addAddon: (addon) =>
        set((state) => {
          const existing = state.checkout.selectedAddons.find((a) => a.code === addon.code);
          if (existing) {
            return {
              checkout: {
                ...state.checkout,
                selectedAddons: state.checkout.selectedAddons.map((a) =>
                  a.code === addon.code ? { ...a, quantity: a.quantity + 1 } : a
                ),
              },
            };
          }
          return {
            checkout: {
              ...state.checkout,
              selectedAddons: [
                ...state.checkout.selectedAddons,
                { code: addon.code, quantity: 1, price: addon.price },
              ],
            },
          };
        }),
      
      removeAddon: (code) =>
        set((state) => ({
          checkout: {
            ...state.checkout,
            selectedAddons: state.checkout.selectedAddons.filter((a) => a.code !== code),
          },
        })),
      
      updateAddonQuantity: (code, quantity) =>
        set((state) => ({
          checkout: {
            ...state.checkout,
            selectedAddons:
              quantity <= 0
                ? state.checkout.selectedAddons.filter((a) => a.code !== code)
                : state.checkout.selectedAddons.map((a) =>
                    a.code === code ? { ...a, quantity } : a
                  ),
          },
        })),
      
      setCurrentView: (view) => set({ currentView: view }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      resetCheckout: () =>
        set({
          checkout: initialCheckout,
          activeTab: 'search',
        }),
      
      resetAll: () =>
        set({
          searchForm: initialSearchForm,
          searchResults: null,
          searchId: null,
          isSearching: false,
          checkout: initialCheckout,
          currentView: 'booking',
          activeTab: 'search',
        }),
    }),
    {
      name: 'hmrm-booking-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        searchForm: state.searchForm,
        checkout: state.checkout,
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<BookingStore>;
        return {
          ...currentState,
          ...persisted,
          searchForm: reviveDateFields({
            ...currentState.searchForm,
            ...persisted.searchForm,
          }),
          checkout: reviveDateFields({
            ...currentState.checkout,
            ...persisted.checkout,
          }),
        };
      },
    }
  )
);

// Dashboard store
export type DashboardNavSection = 
  | 'dashboard' 
  | 'pricing' 
  | 'inventory' 
  | 'bookings' 
  | 'analytics-revenue' 
  | 'analytics-occupancy' 
  | 'analytics-channels' 
  | 'channels' 
  | 'rates' 
  | 'reports'
  | 'settings';

interface DashboardStore {
  selectedPropertyId: string;
  dateRange: { start: Date | null; end: Date | null };
  pricingMode: 'ML_ONLY' | 'ML_CONTROL_VARIATE' | 'FULL_MC';
  activeNavSection: DashboardNavSection;
  
  setSelectedPropertyId: (id: string) => void;
  setDateRange: (range: { start: Date | null; end: Date | null }) => void;
  setPricingMode: (mode: 'ML_ONLY' | 'ML_CONTROL_VARIATE' | 'FULL_MC') => void;
  setActiveNavSection: (section: DashboardNavSection) => void;
}

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      selectedPropertyId: 'H001',
      dateRange: { start: null, end: null },
      pricingMode: 'ML_ONLY',
      activeNavSection: 'dashboard',
      
      setSelectedPropertyId: (id) => set({ selectedPropertyId: id }),
      setDateRange: (range) => set({ dateRange: range }),
      setPricingMode: (mode) => set({ pricingMode: mode }),
      setActiveNavSection: (section) => set({ activeNavSection: section }),
    }),
    {
      name: 'hmrm-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DashboardStore>;
        const dateRange = persisted.dateRange ?? currentState.dateRange;
        return {
          ...currentState,
          ...persisted,
          dateRange: {
            start: parseStoredDate(dateRange.start),
            end: parseStoredDate(dateRange.end),
          },
        };
      },
    }
  )
);
