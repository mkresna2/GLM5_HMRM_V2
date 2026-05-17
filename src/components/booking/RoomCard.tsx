'use client';

import { useState } from 'react';
import { Bed, Users, Coffee, Wifi, Wind, Tv, Bath, Sparkles, Clock, AlertTriangle, Check } from 'lucide-react';
import { useBookingStore } from '@/store/booking-store';
import { holdRoom, trackEvent } from '@/lib/api';
import type { RoomSearchResult, RatePlanResult } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: RoomSearchResult;
  searchId: string;
}

const amenityIcons: Record<string, React.ReactNode> = {
  'King Bed': <Bed className="h-4 w-4" />,
  'Queen Bed': <Bed className="h-4 w-4" />,
  'Free WiFi': <Wifi className="h-4 w-4" />,
  'Breakfast': <Coffee className="h-4 w-4" />,
  'Air Conditioning': <Wind className="h-4 w-4" />,
  'Smart TV': <Tv className="h-4 w-4" />,
  'Bathtub': <Bath className="h-4 w-4" />,
  'default': <Sparkles className="h-4 w-4" />,
};

function getAmenityIcon(amenity: string) {
  const normalizedAmenity = amenity.toLowerCase();
  for (const [key, icon] of Object.entries(amenityIcons)) {
    if (normalizedAmenity.includes(key.toLowerCase())) {
      return icon;
    }
  }
  return amenityIcons['default'];
}

export function RoomCard({ room, searchId }: RoomCardProps) {
  const { searchForm, selectRoom, searchResults } = useBookingStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectRate = async (ratePlan: RatePlanResult) => {
    if (!searchForm.arrivalDate || !searchForm.departureDate) return;

    setLoadingPlan(ratePlan.ratePlanCode);
    setError(null);

    try {
      await trackEvent('rate_selected', {
        room_type: room.roomType,
        rate_plan: ratePlan.ratePlanCode,
        price_per_night: ratePlan.pricePerNight,
        total_price: ratePlan.totalPrice,
      });

      const holdResponse = await holdRoom({
        propertyId: 'H001',
        searchId,
        roomType: room.roomType,
        ratePlanCode: ratePlan.ratePlanCode,
        arrivalDate: searchForm.arrivalDate,
        departureDate: searchForm.departureDate,
        adults: searchForm.adults,
        children: searchForm.children,
      });

      selectRoom(room, ratePlan, holdResponse.holdId);

      await trackEvent('room_hold_created', {
        hold_id: holdResponse.holdId,
        room_type: room.roomType,
        rate_plan: ratePlan.ratePlanCode,
        expires_at: holdResponse.expiresAt,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to hold room. Please try again.');
      setLoadingPlan(null);
    }
  };

  const getAvailabilityBadge = (count: number) => {
    if (count === 0) {
      return <Badge variant="destructive">Sold Out</Badge>;
    }
    if (count <= 2) {
      return (
        <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Only {count} left
        </Badge>
      );
    }
    if (count <= 5) {
      return (
        <Badge variant="outline" className="border-orange-400 text-orange-700 bg-orange-50">
          {count} available
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-green-400 text-green-700 bg-green-50">
        <Check className="h-3 w-3 mr-1" />
        {count} available
      </Badge>
    );
  };

  return (
    <Card className="overflow-hidden border-stone-200 hover:shadow-lg transition-shadow duration-300">
      {/* Room Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-stone-100 to-stone-200">
        {room.imageUrl ? (
          <img
            src={room.imageUrl}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Bed className="h-16 w-16 text-stone-300" />
          </div>
        )}
        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          {getAvailabilityBadge(room.availableCount)}
        </div>
      </div>

      <CardContent className="p-5">
        {/* Room Info */}
        <div className="space-y-3">
          <div>
            <h3 className="text-xl font-semibold text-stone-800">{room.name}</h3>
            {room.description && (
              <p className="text-sm text-stone-500 mt-1 line-clamp-2">{room.description}</p>
            )}
          </div>

          {/* Amenities */}
          {room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {room.amenities.slice(0, 4).map((amenity) => (
                <div
                  key={amenity}
                  className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100 px-2 py-1 rounded-full"
                >
                  {getAmenityIcon(amenity)}
                  <span>{amenity}</span>
                </div>
              ))}
              {room.amenities.length > 4 && (
                <div className="text-xs text-stone-500 bg-stone-100 px-2 py-1 rounded-full">
                  +{room.amenities.length - 4} more
                </div>
              )}
            </div>
          )}

          <Separator className="bg-stone-100" />

          {/* Rate Plans */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-stone-600">Available Rates</h4>
            {room.ratePlans.map((ratePlan) => (
              <div
                key={ratePlan.ratePlanCode}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  ratePlan.urgencyBadge
                    ? "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
                    : "border-stone-200 bg-stone-50/50"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-stone-800">{ratePlan.name}</span>
                      {ratePlan.discountPct > 0 && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                          {ratePlan.discountPct}% off
                        </Badge>
                      )}
                      {ratePlan.includesBreakfast && (
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          <Coffee className="h-3 w-3 mr-1" />
                          Breakfast
                        </Badge>
                      )}
                      {ratePlan.isRefundable ? (
                        <Badge variant="outline" className="border-green-200 text-green-700">
                          Free Cancellation
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-stone-300 text-stone-600">
                          Non-refundable
                        </Badge>
                      )}
                    </div>
                    {ratePlan.description && (
                      <p className="text-xs text-stone-500">{ratePlan.description}</p>
                    )}
                    {ratePlan.cancellationDeadline && (
                      <p className="text-xs text-stone-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Cancel by {ratePlan.cancellationDeadline}
                      </p>
                    )}
                    {ratePlan.urgencyBadge && (
                      <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {ratePlan.urgencyBadge}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-stone-800">
                        ${ratePlan.pricePerNight.toFixed(0)}
                      </p>
                      <p className="text-xs text-stone-500">per night</p>
                      <p className="text-sm font-medium text-amber-700">
                        ${ratePlan.totalPrice.toFixed(0)} total
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSelectRate(ratePlan)}
                      disabled={room.availableCount === 0 || loadingPlan !== null}
                      className={cn(
                        "min-w-[80px]",
                        ratePlan.urgencyBadge
                          ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                          : "bg-amber-600 hover:bg-amber-700"
                      )}
                    >
                      {loadingPlan === ratePlan.ratePlanCode ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                      ) : (
                        'Select'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden border-stone-200">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardContent className="p-5 space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}
