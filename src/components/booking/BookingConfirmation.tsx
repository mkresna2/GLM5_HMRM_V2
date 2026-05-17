'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { 
  CheckCircle, Mail, Printer, Calendar, Users, Bed, 
  CreditCard, MapPin, Clock, AlertTriangle, Check,
  ArrowRight, Copy, Share2
} from 'lucide-react';
import { useBookingStore } from '@/store/booking-store';
import { trackEvent } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface BookingConfirmationProps {
  bookingId: string;
  onNewSearch?: () => void;
}

export function BookingConfirmation({ bookingId, onNewSearch }: BookingConfirmationProps) {
  const { checkout, resetAll } = useBookingStore();
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleCopyBookingId = async () => {
    try {
      await navigator.clipboard.writeText(bookingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      await trackEvent('booking_id_copied', { booking_id: bookingId });
    } catch (err) {
      console.error('Failed to copy booking ID');
    }
  };

  const handleEmailConfirmation = async () => {
    // Simulate sending email
    setEmailSent(true);
    await trackEvent('confirmation_email_requested', { booking_id: bookingId });
  };

  const handlePrint = () => {
    window.print();
    trackEvent('confirmation_printed', { booking_id: bookingId });
  };

  const handleNewSearch = () => {
    resetAll();
    onNewSearch?.();
  };

  if (!checkout.roomType || !checkout.selectedRatePlan) {
    return null;
  }

  const addonsTotal = checkout.selectedAddons.reduce(
    (sum, addon) => sum + addon.price * addon.quantity,
    0
  );
  const grandTotal = checkout.totalPrice + addonsTotal;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Success Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Booking Confirmed!</h1>
        <p className="text-stone-600">
          Thank you, {checkout.guestInfo.firstName}! Your reservation has been confirmed.
        </p>
      </div>

      {/* Booking ID Card */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-stone-500 mb-1">Confirmation Number</p>
              <p className="text-2xl font-bold text-amber-800 font-mono tracking-wider">
                {bookingId}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyBookingId}
                className="border-amber-300 hover:bg-amber-100"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Details */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-stone-800">
            <Bed className="h-5 w-5 text-amber-600" />
            Reservation Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Room Info */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-32 h-24 rounded-lg bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center">
              <Bed className="h-10 w-10 text-stone-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-stone-800">{checkout.roomType.name}</h3>
              <p className="text-sm text-stone-500">{checkout.selectedRatePlan.name}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {checkout.selectedRatePlan.includesBreakfast && (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    Breakfast Included
                  </Badge>
                )}
                {checkout.selectedRatePlan.isRefundable ? (
                  <Badge variant="outline" className="border-green-200 text-green-700">
                    Free Cancellation
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-stone-300 text-stone-600">
                    Non-refundable
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator className="bg-stone-100" />

          {/* Stay Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">Check-in</p>
                  <p className="font-medium text-stone-800">
                    {checkout.arrivalDate && format(checkout.arrivalDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-stone-500">After 3:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">Check-out</p>
                  <p className="font-medium text-stone-800">
                    {checkout.departureDate && format(checkout.departureDate, 'EEEE, MMMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-stone-500">Before 11:00 AM</p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">Guests</p>
                  <p className="font-medium text-stone-800">
                    {checkout.adults} Adult{checkout.adults !== 1 ? 's' : ''}
                    {checkout.children > 0 && `, ${checkout.children} Child${checkout.children !== 1 ? 'ren' : ''}`}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm text-stone-500">Duration</p>
                  <p className="font-medium text-stone-800">
                    {checkout.los} Night{checkout.los !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-stone-100" />

          {/* Guest Info */}
          <div>
            <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              Primary Guest
            </h4>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div>
                <span className="text-stone-500">Name:</span>{' '}
                <span className="text-stone-700">{checkout.guestInfo.firstName} {checkout.guestInfo.lastName}</span>
              </div>
              <div>
                <span className="text-stone-500">Email:</span>{' '}
                <span className="text-stone-700">{checkout.guestInfo.email}</span>
              </div>
              {checkout.guestInfo.phone && (
                <div>
                  <span className="text-stone-500">Phone:</span>{' '}
                  <span className="text-stone-700">{checkout.guestInfo.phone}</span>
                </div>
              )}
              {checkout.guestInfo.country && (
                <div>
                  <span className="text-stone-500">Country:</span>{' '}
                  <span className="text-stone-700">{checkout.guestInfo.country}</span>
                </div>
              )}
            </div>
          </div>

          {/* Add-ons */}
          {checkout.selectedAddons.length > 0 && (
            <>
              <Separator className="bg-stone-100" />
              <div>
                <h4 className="font-medium text-stone-800 mb-3">Add-ons</h4>
                <div className="space-y-2">
                  {checkout.selectedAddons.map((addon) => (
                    <div key={addon.code} className="flex justify-between text-sm">
                      <span className="text-stone-600">
                        {addon.code} x {addon.quantity}
                      </span>
                      <span className="text-stone-700">
                        ${(addon.price * addon.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator className="bg-stone-100" />

          {/* Payment Summary */}
          <div>
            <h4 className="font-medium text-stone-800 mb-3 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-amber-600" />
              Payment Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-stone-500">
                  Room (${checkout.pricePerNight.toFixed(0)} x {checkout.los} nights)
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
              <Separator className="bg-stone-100 my-2" />
              <div className="flex justify-between text-lg font-bold">
                <span className="text-stone-800">Total Paid</span>
                <span className="text-amber-700">${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Alert className={cn(
        "border",
        checkout.selectedRatePlan.isRefundable
          ? "border-green-200 bg-green-50"
          : "border-amber-200 bg-amber-50"
      )}>
        {checkout.selectedRatePlan.isRefundable ? (
          <>
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Cancellation Policy</AlertTitle>
            <AlertDescription className="text-green-700">
              Free cancellation until{' '}
              <strong>{checkout.selectedRatePlan.cancellationDeadline || '24 hours before check-in'}</strong>.
              After this time, the first night&apos;s room rate will be charged.
            </AlertDescription>
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Non-Refundable Booking</AlertTitle>
            <AlertDescription className="text-amber-700">
              This booking is non-refundable. No changes or cancellations are permitted.
              The full amount has been charged to your card.
            </AlertDescription>
          </>
        )}
      </Alert>

      {/* Important Information */}
      <Card className="border-stone-200">
        <CardHeader>
          <CardTitle className="text-lg text-stone-800">Important Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-stone-600">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p>Property address will be included in your confirmation email.</p>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p>A confirmation email has been sent to <strong>{checkout.guestInfo.email}</strong></p>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p>Early check-in and late check-out may be available upon request (subject to availability).</p>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          className="flex-1 border-stone-300 hover:bg-stone-100"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4 mr-2" />
          Print Confirmation
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-stone-300 hover:bg-stone-100"
          onClick={handleEmailConfirmation}
          disabled={emailSent}
        >
          {emailSent ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Email Sent
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Resend Email
            </>
          )}
        </Button>
      </div>

      {/* New Search Button */}
      <div className="text-center pt-4">
        <Button
          onClick={handleNewSearch}
          className="bg-amber-600 hover:bg-amber-700 text-white"
        >
          Book Another Stay
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
