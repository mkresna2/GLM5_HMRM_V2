import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const { id } = await params;
    
    // Find booking by bookingId
    const booking = await db.booking.findFirst({
      where: { bookingId: id },
      include: {
        roomType: {
          include: {
            roomAmenities: {
              include: { amenity: true },
            },
          },
        },
        ratePlan: true,
        bookingAddons: {
          include: {
            addon: true,
          },
        },
        property: true,
      },
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found', traceId },
        { status: 404 }
      );
    }
    
    // Format response
    const response = {
      bookingId: booking.bookingId,
      propertyId: booking.property.propertyId,
      propertyName: booking.property.name,
      status: booking.status,
      
      // Dates
      arrivalDate: booking.arrivalDate.toISOString().split('T')[0],
      departureDate: booking.departureDate.toISOString().split('T')[0],
      los: booking.los,
      
      // Room info
      roomType: {
        code: booking.roomType.roomTypeCode,
        name: booking.roomType.name,
        description: booking.roomType.description,
        amenities: booking.roomType.roomAmenities.map(ra => ra.amenity.name),
        imageUrl: booking.roomType.imageUrl,
      },
      
      // Rate plan
      ratePlan: {
        code: booking.ratePlan.ratePlanCode,
        name: booking.ratePlan.name,
        description: booking.ratePlan.description,
        isRefundable: booking.ratePlan.isRefundable,
        cancelDeadlineHours: booking.ratePlan.cancelDeadlineHours,
        includesBreakfast: booking.ratePlan.includesBreakfast,
      },
      
      // Pricing
      pricePerNight: booking.pricePerNight,
      grossRevenue: booking.grossRevenue,
      addonsTotal: booking.addonsTotal,
      netRevenue: booking.netRevenue,
      
      // Guests
      adults: booking.adults,
      children: booking.children,
      
      // Guest info
      guest: {
        firstName: booking.guestFirstName,
        lastName: booking.guestLastName,
        email: booking.guestEmail,
        phone: booking.guestPhone,
        country: booking.guestCountry,
      },
      
      // Addons
      addons: booking.bookingAddons.map(ba => ({
        name: ba.addon.name,
        code: ba.addon.code,
        quantity: ba.quantity,
        totalPrice: ba.totalPrice,
      })),
      
      // Cancellation info
      isRefundable: booking.isRefundable,
      cancellationPolicy: booking.cancellationPolicy,
      cancelledAt: booking.cancelledAt?.toISOString() || null,
      cancellationReason: booking.cancellationReason,
      refundAmount: booking.refundAmount,
      
      // Additional info
      specialRequests: booking.specialRequests,
      channel: booking.channel,
      createdAt: booking.createdAt.toISOString(),
      
      traceId,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Get booking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
