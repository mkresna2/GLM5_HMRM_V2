'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Users, ChevronDown, Search, Tag } from 'lucide-react';
import { useBookingStore } from '@/store/booking-store';
import { searchAvailability, trackEvent } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SearchWidgetProps {
  onSearchComplete?: () => void;
}

export function SearchWidget({ onSearchComplete }: SearchWidgetProps) {
  const { searchForm, setSearchForm, setSearchResults, setIsSearching, setSearchResults: setResults } = useBookingStore();
  const [arrivalOpen, setArrivalOpen] = useState(false);
  const [departureOpen, setDepartureOpen] = useState(false);
  const [guestsOpen, setGuestsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchForm.arrivalDate || !searchForm.departureDate) {
      setError('Please select arrival and departure dates');
      return;
    }

    if (searchForm.arrivalDate >= searchForm.departureDate) {
      setError('Departure date must be after arrival date');
      return;
    }

    setError(null);
    setIsSearching(true);

    try {
      await trackEvent('search_initiated', {
        arrival_date: searchForm.arrivalDate.toISOString(),
        departure_date: searchForm.departureDate.toISOString(),
        adults: searchForm.adults,
        children: searchForm.children,
        promo_code: searchForm.promoCode,
      });

      const response = await searchAvailability({
        propertyId: 'H001',
        ...searchForm,
      });

      setResults(response.rooms, response.searchId);
      
      await trackEvent('search_completed', {
        search_id: response.searchId,
        results_count: response.rooms.length,
      });

      onSearchComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed. Please try again.');
      setIsSearching(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select date';
    return format(date, 'MMM dd, yyyy');
  };

  const nights = searchForm.arrivalDate && searchForm.departureDate
    ? Math.ceil((searchForm.departureDate.getTime() - searchForm.arrivalDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-amber-100">
      <CardContent className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Arrival Date */}
          <div className="space-y-2">
            <Label htmlFor="arrival" className="text-sm font-medium text-stone-600">
              Check In
            </Label>
            <Popover open={arrivalOpen} onOpenChange={setArrivalOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="arrival"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50",
                    !searchForm.arrivalDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-amber-600" />
                  {formatDate(searchForm.arrivalDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={searchForm.arrivalDate || undefined}
                  onSelect={(date) => {
                    setSearchForm({ arrivalDate: date || null });
                    if (date && searchForm.departureDate && date >= searchForm.departureDate) {
                      setSearchForm({ departureDate: addDays(date, 1) });
                    }
                    setArrivalOpen(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Departure Date */}
          <div className="space-y-2">
            <Label htmlFor="departure" className="text-sm font-medium text-stone-600">
              Check Out
            </Label>
            <Popover open={departureOpen} onOpenChange={setDepartureOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="departure"
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50",
                    !searchForm.departureDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-amber-600" />
                  {formatDate(searchForm.departureDate)}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={searchForm.departureDate || undefined}
                  onSelect={(date) => {
                    setSearchForm({ departureDate: date || null });
                    setDepartureOpen(false);
                  }}
                  disabled={(date) => 
                    date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                    (searchForm.arrivalDate ? date <= searchForm.arrivalDate : false)
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Guests */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-stone-600">Guests</Label>
            <Popover open={guestsOpen} onOpenChange={setGuestsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-11 border-stone-200 hover:border-amber-400 hover:bg-amber-50/50"
                >
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-amber-600" />
                    <span>{searchForm.adults} Adult{searchForm.adults !== 1 ? 's' : ''}</span>
                    {searchForm.children > 0 && (
                      <span className="ml-1">, {searchForm.children} Child{searchForm.children !== 1 ? 'ren' : ''}</span>
                    )}
                  </div>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-4" align="start">
                <div className="space-y-4">
                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-700">Adults</p>
                      <p className="text-xs text-stone-500">Ages 13 or above</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => searchForm.adults > 1 && setSearchForm({ adults: searchForm.adults - 1 })}
                        disabled={searchForm.adults <= 1}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{searchForm.adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => searchForm.adults < 10 && setSearchForm({ adults: searchForm.adults + 1 })}
                        disabled={searchForm.adults >= 10}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-stone-700">Children</p>
                      <p className="text-xs text-stone-500">Ages 2-12</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => searchForm.children > 0 && setSearchForm({ children: searchForm.children - 1 })}
                        disabled={searchForm.children <= 0}
                      >
                        -
                      </Button>
                      <span className="w-8 text-center font-medium">{searchForm.children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => searchForm.children < 6 && setSearchForm({ children: searchForm.children + 1 })}
                        disabled={searchForm.children >= 6}
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-amber-600 hover:bg-amber-700"
                    onClick={() => setGuestsOpen(false)}
                  >
                    Done
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Promo Code */}
          <div className="space-y-2">
            <Label htmlFor="promo" className="text-sm font-medium text-stone-600">
              Promo Code
            </Label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-600" />
              <Input
                id="promo"
                placeholder="Enter code"
                value={searchForm.promoCode}
                onChange={(e) => setSearchForm({ promoCode: e.target.value.toUpperCase() })}
                className="pl-10 h-11 border-stone-200 focus:border-amber-400 focus:ring-amber-400/20"
              />
            </div>
          </div>

          {/* Search Button */}
          <div className="space-y-2 flex flex-col justify-end">
            <Button
              onClick={handleSearch}
              disabled={useBookingStore.getState().isSearching}
              className="h-11 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg shadow-amber-600/20"
            >
              {useBookingStore.getState().isSearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Duration Display */}
        {nights > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-sm text-stone-600">
              <span className="font-medium text-amber-700">{nights} night{nights !== 1 ? 's' : ''}</span>
              {' '}stay · {searchForm.adults + searchForm.children} guest{(searchForm.adults + searchForm.children) !== 1 ? 's' : ''}
            </p>
          </div>
        )}

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
