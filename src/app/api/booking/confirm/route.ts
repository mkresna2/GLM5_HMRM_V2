import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
}

interface AddonSelection {
  code: string;
  quantity: number;
}

interface ConfirmRequest {
  hold_id: string;
  guest: GuestInfo;
  addons?: AddonSelection[];
  special_requests?: string;
  session_id?: string;
}

function generateBookingId(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `BK-${year}-${random}`;
}

export async function POST(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const body: ConfirmRequest = await request.json();
    const { hold_id, guest, addons = [], special_requests, session_id } = body;
    
    // Validate required fields
    if (!hold_id || !guest) {
      return NextResponse.json(
        { error: 'Missing required fields', traceId },
        { status: 400 }
      );
    }
    
    if (!guest.firstName || !guest.lastName || !guest.email) {
      return NextResponse.json(
        { error: 'Guest name and email are required', traceId },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guest.email)) {
      return NextResponse.json(
        { error: 'Invalid email format', traceId },
        { status: 400 }
      );
    }
    
    // Get hold
    const hold = await db.roomHold.findUnique({
      where: { holdId: hold_id },
    });
    
    if (!hold) {
      return NextResponse.json(
        { error: 'Hold not found', traceId },
        { status: 404 }
      );
    }
    
    // Check if hold is expired
    if (hold.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Hold has expired. Please search again.', traceId },
        { status: 410 }
      );
    }
    
    // Get rate plan for cancellation policy
    const ratePlan = await db.ratePlan.findUnique({
      where: { id: hold.ratePlanId },
    });
    
    if (!ratePlan) {
      return NextResponse.json(
        { error: 'Rate plan not found', traceId },
        { status: 404 }
      );
    }
    
    // Calculate addon total
    let addonsTotal = 0;
    const bookingAddons: { addonId: string; quantity: number; totalPrice: number }[] = [];
    
    for (const selection of addons) {
      const addon = await db.addon.findFirst({
        where: {
          propertyId: hold.propertyId,
          code: selection.code,
        },
      });
      
      if (addon) {
        const totalPrice = addon.pricePerNight 
          ? addon.price * selection.quantity * hold.los
          : addon.price * selection.quantity;
        
        addonsTotal += totalPrice;
        bookingAddons.push({
          addonId: addon.id,
          quantity: selection.quantity,
          totalPrice,
        });
      }
    }
    
    // Calculate lead time
    const leadTimeDays = Math.ceil(
      (hold.arrivalDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Generate booking ID
    const bookingId = generateBookingId();
    
    // Calculate gross revenue (room + addons)
    const grossRevenue = hold.totalPrice + addonsTotal;
    
    // Create booking in transaction
    const booking = await db.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          bookingId,
          propertyId: hold.propertyId,
          roomTypeId: hold.roomTypeId,
          ratePlanId: hold.ratePlanId,
          channel: 'direct',
          arrivalDate: hold.arrivalDate,
          departureDate: hold.departureDate,
          los: hold.los,
          adults: hold.adults,
          children: hold.children,
          pricePerNight: hold.pricePerNight,
          grossRevenue,
          commissionRate: 0,
          commissionAmount: 0,
          netRevenue: grossRevenue,
          addonsTotal,
          leadTimeDays,
          isRefundable: ratePlan.isRefundable,
          cancellationPolicy: ratePlan.isRefundable 
            ? `Free cancellation up to ${ratePlan.cancelDeadlineHours} hours before arrival`
            : 'Non-refundable',
          status: 'confirmed',
          guestFirstName: guest.firstName,
          guestLastName: guest.lastName,
          guestEmail: guest.email,
          guestPhone: guest.phone || null,
          guestCountry: guest.country || null,
          specialRequests: special_requests || null,
          sessionId: session_id || null,
          searchId: hold.searchId,
        },
      });
      
      // Create booking addons
      for (const ba of bookingAddons) {
        await tx.bookingAddon.create({
          data: {
            bookingId: newBooking.id,
            addonId: ba.addonId,
            quantity: ba.quantity,
            totalPrice: ba.totalPrice,
          },
        });
      }
      
      // Update inventory OTB
      const inventory = await tx.inventoryDaily.findMany({
        where: {
          propertyId: hold.propertyId,
          roomTypeId: hold.roomTypeId,
          arrivalDate: {
            gte: hold.arrivalDate,
            lt: hold.departureDate,
          },
        },
      });
      
      for (const inv of inventory) {
        await tx.inventoryDaily.update({
          where: { id: inv.id },
          data: {
            otb: { increment: 1 },
            held: { decrement: 1 },
          },
        });
      }
      
      // Delete hold
      await tx.roomHold.delete({
        where: { id: hold.id },
      });
      
      return newBooking;
    });
    
    // Get room type for response
    const roomType = await db.roomType.findUnique({
      where: { id: hold.roomTypeId },
    });
    
    // Create booking event
    await db.bookingEvent.create({
      data: {
        eventId: `evt_${randomUUID()}`,
        eventType: 'booking_confirmed',
        bookingId: booking.id,
        propertyId: hold.propertyId,
        arrivalDate: hold.arrivalDate,
        sessionId: session_id,
        payload: {
          bookingId: booking.bookingId,
          grossRevenue,
          addonsTotal,
          leadTimeDays,
        },
      },
    });
    
    // Calculate cancellation deadline
    let cancellationDeadline: string | null = null;
    if (ratePlan.isRefundable) {
      const deadline = new Date(hold.arrivalDate);
      deadline.setHours(deadline.getHours() - ratePlan.cancelDeadlineHours);
      cancellationDeadline = deadline.toISOString();
    }
    
    return NextResponse.json({
      bookingId: booking.bookingId,
      status: booking.status,
      arrivalDate: hold.arrivalDate.toISOString().split('T')[0],
      departureDate: hold.departureDate.toISOString().split('T')[0],
      roomType: roomType?.roomTypeCode,
      roomName: roomType?.name,
      ratePlan: ratePlan.name,
      pricePerNight: hold.pricePerNight,
      grossRevenue,
      addonsTotal,
      totalCharged: grossRevenue,
      cancellationDeadline,
      confirmationEmailSent: false, // Would trigger email in production
      guestName: `${guest.firstName} ${guest.lastName}`,
      traceId,
    });
    
  } catch (error) {
    console.error('Confirm API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
