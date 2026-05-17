'use client';

import { useState, useEffect } from 'react';
import { useBookingStore } from '@/store/booking-store';
import { trackEvent } from '@/lib/api';
import type { Addon } from '@/types';
import { SearchWidget } from './SearchWidget';
import { RoomCard, RoomCardSkeleton } from './RoomCard';
import { CheckoutForm } from './CheckoutForm';
import { BookingConfirmation } from './BookingConfirmation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bed, Search, Calendar, Users } from 'lucide-react';

// Sample addons - in production these would come from API
const SAMPLE_ADDONS: Addon[] = [
  {
    id: '1',
    propertyId: 'H001',
    code: 'BREAKFAST',
    name: 'Daily Breakfast Buffet',
    description: 'Full breakfast buffet for two guests',
    pricePerNight: true,
    price: 35,
  },
  {
    id: '2',
    propertyId: 'H001',
    code: 'PARKING',
    name: 'Valet Parking',
    description: 'Daily valet parking service',
    pricePerNight: true,
    price: 25,
  },
  {
    id: '3',
    propertyId: 'H001',
    code: 'SPA',
    name: 'Spa Access',
    description: 'Full day access to spa facilities',
    pricePerNight: false,
    price: 75,
  },
  {
    id: '4',
    propertyId: 'H001',
    code: 'LATE_CHECKOUT',
    name: 'Late Checkout (2 PM)',
    description: 'Extend your checkout time to 2 PM',
    pricePerNight: false,
    price: 50,
  },
  {
    id: '5',
    propertyId: 'H001',
    code: 'AIRPORT_TRANSFER',
    name: 'Airport Transfer',
    description: 'One-way private airport transfer',
    pricePerNight: false,
    price: 85,
  },
];

interface BookingEngineProps {
  onToggleView?: () => void;
}

export function BookingEngine({ onToggleView }: BookingEngineProps) {
  const {
    activeTab,
    setActiveTab,
    searchResults,
    searchId,
    isSearching,
    searchForm,
    resetCheckout,
  } = useBookingStore();

  const [confirmedBookingId, setConfirmedBookingId] = useState<string | null>(null);

  // Track page view on mount
  useEffect(() => {
    trackEvent('booking_engine_viewed', {
      view: 'booking',
    });
  }, []);

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleSearchComplete = () => {
    setActiveTab('search');
  };

  const handleBackToSearch = () => {
    setActiveTab('search');
  };

  const handleConfirmation = (bookingId: string) => {
    setConfirmedBookingId(bookingId);
    setActiveTab('confirmation');
  };

  const handleNewSearch = () => {
    setConfirmedBookingId(null);
    setActiveTab('search');
  };

  const nights = searchForm.arrivalDate && searchForm.departureDate
    ? Math.ceil((searchForm.departureDate.getTime() - searchForm.arrivalDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white">
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Welcome to Grand Horizon Hotel
            </h1>
            <p className="text-lg text-amber-100 max-w-2xl mx-auto">
              Experience luxury accommodations with world-class amenities. 
              Book your perfect stay today.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search Widget - Always visible at top */}
        {activeTab === 'search' && !searchResults && (
          <div className="-mt-24 relative z-10 mb-8">
            <SearchWidget onSearchComplete={handleSearchComplete} />
          </div>
        )}

        {/* Breadcrumb / Progress */}
        {activeTab !== 'search' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSearch}
                className="text-stone-500 hover:text-stone-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Search
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-stone-400">Search</span>
              {activeTab === 'checkout' && (
                <>
                  <span className="text-stone-300">/</span>
                  <span className="text-amber-600 font-medium">Checkout</span>
                </>
              )}
              {activeTab === 'confirmation' && (
                <>
                  <span className="text-stone-300">/</span>
                  <span className="text-stone-400">Checkout</span>
                  <span className="text-stone-300">/</span>
                  <span className="text-amber-600 font-medium">Confirmed</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Search Summary Bar */}
        {activeTab === 'search' && searchResults && searchResults.length > 0 && (
          <div className="mb-6">
            <Card className="border-stone-200 bg-white">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span className="text-stone-600">
                        {searchForm.arrivalDate?.toLocaleDateString()} - {searchForm.departureDate?.toLocaleDateString()}
                      </span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4 text-amber-600" />
                      <span className="text-stone-600">{nights} night{nights !== 1 ? 's' : ''}</span>
                    </div>
                    <Separator orientation="vertical" className="h-4" />
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      <span className="text-stone-600">
                        {searchForm.adults + searchForm.children} guest{(searchForm.adults + searchForm.children) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToSearch}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Modify Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'search' && (
          <>
            {/* Loading State */}
            {isSearching && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <RoomCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Search Results */}
            {!isSearching && searchResults && searchResults.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-stone-800">
                    Available Rooms
                  </h2>
                  <Badge variant="outline" className="text-stone-600">
                    {searchResults.length} room{searchResults.length !== 1 ? 's' : ''} found
                  </Badge>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {searchResults.map((room) => (
                    <RoomCard
                      key={room.roomType}
                      room={room}
                      searchId={searchId || ''}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {!isSearching && searchResults && searchResults.length === 0 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-8 text-center">
                  <Bed className="h-12 w-12 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-stone-800 mb-2">
                    No rooms available
                  </h3>
                  <p className="text-stone-600 mb-4">
                    We couldn&apos;t find any available rooms for your selected dates.
                    Please try different dates or adjust your search criteria.
                  </p>
                  <Button
                    variant="outline"
                    onClick={resetCheckout}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100"
                  >
                    Modify Search
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Initial State - No search yet */}
            {!isSearching && !searchResults && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-semibold text-stone-800 mb-2">
                  Find Your Perfect Stay
                </h2>
                <p className="text-stone-600">
                  Enter your travel dates above to see available rooms and rates.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'checkout' && (
          <CheckoutForm
            availableAddons={SAMPLE_ADDONS}
            onBack={handleBackToSearch}
            onConfirmation={handleConfirmation}
          />
        )}

        {activeTab === 'confirmation' && confirmedBookingId && (
          <BookingConfirmation
            bookingId={confirmedBookingId}
            onNewSearch={handleNewSearch}
          />
        )}
      </div>

      {/* Hotel Features Section - Only show on initial search */}
      {activeTab === 'search' && !searchResults && (
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-stone-200 text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bed className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">Luxury Rooms</h3>
                <p className="text-sm text-stone-600">
                  Choose from our selection of elegantly appointed rooms and suites.
                </p>
              </CardContent>
            </Card>
            <Card className="border-stone-200 text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">Flexible Booking</h3>
                <p className="text-sm text-stone-600">
                  Free cancellation on most bookings. Book with confidence.
                </p>
              </CardContent>
            </Card>
            <Card className="border-stone-200 text-center">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-stone-800 mb-2">Best Rate Guarantee</h3>
                <p className="text-sm text-stone-600">
                  Book direct for the best available rates and exclusive perks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
