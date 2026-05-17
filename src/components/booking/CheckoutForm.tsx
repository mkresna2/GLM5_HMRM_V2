'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { 
  User, Mail, Phone, Globe, MessageSquare, CreditCard, 
  Shield, Clock, Check, Plus, Minus, ArrowLeft, Coffee,
  Sparkles, AlertTriangle
} from 'lucide-react';
import { useBookingStore } from '@/store/booking-store';
import { confirmBooking, trackEvent } from '@/lib/api';
import type { Addon } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 
  'Australia', 'Japan', 'China', 'India', 'Brazil', 'Mexico', 
  'Spain', 'Italy', 'Netherlands', 'Singapore'
].sort();

interface CheckoutFormProps {
  availableAddons?: Addon[];
  onBack?: () => void;
  onConfirmation?: (bookingId: string) => void;
}

export function CheckoutForm({ availableAddons = [], onBack, onConfirmation }: CheckoutFormProps) {
  const { 
    checkout, 
    setGuestInfo, 
    addAddon, 
    removeAddon, 
    updateAddonQuantity,
    setActiveTab,
    resetCheckout
  } = useBookingStore();
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Calculate hold expiry time using useMemo (15 minutes from when hold was created)
  const holdExpiry = useMemo(() => {
    if (checkout.holdId) {
      return new Date(Date.now() + 15 * 60 * 1000);
    }
    return null;
  }, [checkout.holdId]);

  // Update timer every second
  useEffect(() => {
    if (!holdExpiry) {
      setTimeRemaining('');
      return;
    }

    const updateTimer = () => {
      const remaining = holdExpiry.getTime() - Date.now();
      if (remaining <= 0) {
        setTimeRemaining('Expired');
      } else {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    };

    updateTimer(); // Initial update
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [holdExpiry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!checkout.holdId) {
      setError('No room hold found. Please select a room again.');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions to continue.');
      return;
    }

    if (!checkout.guestInfo.firstName || !checkout.guestInfo.lastName || 
        !checkout.guestInfo.email || !checkout.guestInfo.phone) {
      setError('Please fill in all required guest information fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await trackEvent('booking_initiated', {
        hold_id: checkout.holdId,
        room_type: checkout.roomType?.roomType,
        rate_plan: checkout.selectedRatePlan?.ratePlanCode,
        total_price: checkout.totalPrice,
      });

      const response = await confirmBooking({
        holdId: checkout.holdId,
        guest: {
          firstName: checkout.guestInfo.firstName,
          lastName: checkout.guestInfo.lastName,
          email: checkout.guestInfo.email,
          phone: checkout.guestInfo.phone,
          country: checkout.guestInfo.country,
        },
        addons: checkout.selectedAddons.map(a => ({ code: a.code, quantity: a.quantity })),
        specialRequests: checkout.guestInfo.specialRequests,
      });

      await trackEvent('booking_confirmed', {
        booking_id: response.bookingId,
        total_charged: response.totalCharged,
        confirmation_email_sent: response.confirmationEmailSent,
      });

      onConfirmation?.(response.bookingId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm booking. Please try again.');
      setIsSubmitting(false);
    }
  };

  const getAddonQuantity = (code: string) => {
    const addon = checkout.selectedAddons.find(a => a.code === code);
    return addon?.quantity || 0;
  };

  const handleAddonChange = (addon: Addon, delta: number) => {
    const currentQty = getAddonQuantity(addon.code);
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      removeAddon(addon.code);
    } else {
      if (currentQty === 0) {
        addAddon(addon);
      } else {
        updateAddonQuantity(addon.code, newQty);
      }
    }
  };

  const addonsTotal = checkout.selectedAddons.reduce(
    (sum, addon) => sum + addon.price * addon.quantity,
    0
  );

  const grandTotal = checkout.totalPrice + addonsTotal;

  if (!checkout.roomType || !checkout.selectedRatePlan) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-center">
          <p className="text-amber-700">No room selected. Please search and select a room first.</p>
          <Button 
            className="mt-4 bg-amber-600 hover:bg-amber-700"
            onClick={() => setActiveTab('search')}
          >
            Back to Search
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main Form - Left Side */}
      <div className="lg:col-span-2 space-y-6">
        {/* Hold Timer Alert */}
        {timeRemaining && (
          <Alert className="border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Reservation Held</AlertTitle>
            <AlertDescription className="text-amber-700">
              Your room is held for <span className="font-bold">{timeRemaining}</span>. Complete your booking to secure this rate.
            </AlertDescription>
          </Alert>
        )}

        {/* Guest Information */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <User className="h-5 w-5 text-amber-600" />
              Guest Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-stone-600">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={checkout.guestInfo.firstName}
                  onChange={(e) => setGuestInfo({ firstName: e.target.value })}
                  placeholder="John"
                  className="border-stone-200 focus:border-amber-400"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-stone-600">
                  Last Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={checkout.guestInfo.lastName}
                  onChange={(e) => setGuestInfo({ lastName: e.target.value })}
                  placeholder="Doe"
                  className="border-stone-200 focus:border-amber-400"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-stone-600">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="email"
                    type="email"
                    value={checkout.guestInfo.email}
                    onChange={(e) => setGuestInfo({ email: e.target.value })}
                    placeholder="john@example.com"
                    className="pl-10 border-stone-200 focus:border-amber-400"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-stone-600">
                  Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={checkout.guestInfo.phone}
                    onChange={(e) => setGuestInfo({ phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="pl-10 border-stone-200 focus:border-amber-400"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-stone-600">Country</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <select
                  id="country"
                  value={checkout.guestInfo.country}
                  onChange={(e) => setGuestInfo({ country: e.target.value })}
                  className="w-full h-9 pl-10 pr-3 rounded-md border border-stone-200 bg-transparent text-sm focus:border-amber-400 focus:outline-none"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialRequests" className="text-stone-600">
                Special Requests
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-stone-400" />
                <Textarea
                  id="specialRequests"
                  value={checkout.guestInfo.specialRequests}
                  onChange={(e) => setGuestInfo({ specialRequests: e.target.value })}
                  placeholder="Any special requests or preferences..."
                  className="pl-10 min-h-[80px] border-stone-200 focus:border-amber-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add-ons Section */}
        {availableAddons.length > 0 && (
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-stone-800">
                <Sparkles className="h-5 w-5 text-amber-600" />
                Enhance Your Stay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {availableAddons.map((addon) => {
                  const quantity = getAddonQuantity(addon.code);
                  return (
                    <div
                      key={addon.code}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        quantity > 0
                          ? "border-amber-300 bg-amber-50"
                          : "border-stone-200 hover:border-amber-300"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-stone-800">{addon.name}</h4>
                          {addon.description && (
                            <p className="text-xs text-stone-500 mt-1">{addon.description}</p>
                          )}
                          <p className="text-sm font-medium text-amber-700 mt-2">
                            ${addon.price.toFixed(2)}
                            {addon.pricePerNight && '/night'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleAddonChange(addon, -1)}
                            disabled={quantity === 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center font-medium">{quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleAddonChange(addon, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Information */}
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stone-800">
              <CreditCard className="h-5 w-5 text-amber-600" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 bg-stone-50 rounded-lg border border-dashed border-stone-300 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-stone-400 mb-2" />
              <p className="text-sm text-stone-500">
                Payment gateway integration placeholder
              </p>
              <p className="text-xs text-stone-400 mt-1">
                In production, secure payment form would appear here
              </p>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700">
                <p className="font-medium">Secure Payment</p>
                <p className="text-xs text-green-600">Your payment information is encrypted and secure.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Summary - Right Side */}
      <div className="lg:col-span-1">
        <div className="sticky top-4 space-y-4">
          <Card className="border-stone-200">
            <CardHeader>
              <CardTitle className="text-stone-800">Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Room Details */}
              <div className="space-y-2">
                <h4 className="font-medium text-stone-800">{checkout.roomType.name}</h4>
                <p className="text-sm text-stone-500">{checkout.selectedRatePlan.name}</p>
                {checkout.selectedRatePlan.includesBreakfast && (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    <Coffee className="h-3 w-3 mr-1" />
                    Breakfast Included
                  </Badge>
                )}
              </div>

              <Separator className="bg-stone-100" />

              {/* Dates */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">Check-in</span>
                  <span className="font-medium text-stone-700">
                    {checkout.arrivalDate && format(checkout.arrivalDate, 'EEE, MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Check-out</span>
                  <span className="font-medium text-stone-700">
                    {checkout.departureDate && format(checkout.departureDate, 'EEE, MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Duration</span>
                  <span className="font-medium text-stone-700">
                    {checkout.los} night{checkout.los !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Guests</span>
                  <span className="font-medium text-stone-700">
                    {checkout.adults} adult{checkout.adults !== 1 ? 's' : ''}
                    {checkout.children > 0 && `, ${checkout.children} child${checkout.children !== 1 ? 'ren' : ''}`}
                  </span>
                </div>
              </div>

              <Separator className="bg-stone-100" />

              {/* Pricing */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-500">
                    ${checkout.pricePerNight.toFixed(0)} x {checkout.los} nights
                  </span>
                  <span className="text-stone-700">${checkout.totalPrice.toFixed(2)}</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">Add-ons</span>
                    <span className="text-stone-700">${addonsTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-stone-500">Taxes & Fees</span>
                  <span className="text-stone-700">Included</span>
                </div>
              </div>

              <Separator className="bg-stone-100" />

              {/* Grand Total */}
              <div className="flex justify-between items-baseline">
                <span className="font-medium text-stone-700">Total</span>
                <span className="text-2xl font-bold text-amber-700">${grandTotal.toFixed(2)}</span>
              </div>

              {/* Cancellation Policy */}
              {checkout.selectedRatePlan.isRefundable ? (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Free cancellation until {checkout.selectedRatePlan.cancellationDeadline || '24 hours before check-in'}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Non-refundable - No cancellation available
                  </p>
                </div>
              )}

              <Separator className="bg-stone-100" />

              {/* Terms */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  className="mt-0.5 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <Label htmlFor="terms" className="text-sm text-stone-600 leading-relaxed cursor-pointer">
                  I agree to the{' '}
                  <span className="text-amber-700 underline">Terms & Conditions</span>
                  {' '}and{' '}
                  <span className="text-amber-700 underline">Privacy Policy</span>
                  {checkout.selectedRatePlan.isRefundable && (
                    <>, and understand the cancellation policy</>
                  )}
                </Label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={!termsAccepted || isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-lg font-medium shadow-lg shadow-amber-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-2" />
                    Processing...
                  </>
                ) : (
                  `Confirm Booking - $${grandTotal.toFixed(0)}`
                )}
              </Button>

              {/* Back Button */}
              <Button
                variant="ghost"
                className="w-full text-stone-500 hover:text-stone-700"
                onClick={() => {
                  resetCheckout();
                  onBack?.();
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Room Selection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
