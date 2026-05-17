import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

interface CancelRequest {
  reason: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const { id } = await params;
    const body: CancelRequest = await request.json();
    const { reason } = body;
    
    // Find booking
    const booking = await db.booking.findFirst({
      where: { bookingId: id },
      include: {
        ratePlan: true,
        property: true,
      },
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found', traceId },
        { status: 404 }
      );
    }
    
    // Check if already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled', traceId },
        { status: 400 }
      );
    }
    
    // Check if check-in has passed
    if (booking.arrivalDate < new Date()) {
      return NextResponse.json(
        { error: 'Cannot cancel booking after check-in date', traceId },
        { status: 400 }
      );
    }
    
    // Calculate refund
    let refundAmount = 0;
    let isRefundable = booking.isRefundable;
    
    if (isRefundable) {
      // Check cancellation deadline
      const deadline = new Date(booking.arrivalDate);
      deadline.setHours(deadline.getHours() - booking.ratePlan.cancelDeadlineHours);
      
      if (new Date() > deadline) {
        // Past deadline - partial or no refund
        refundAmount = 0;
        isRefundable = false;
      } else {
        // Within deadline - full refund
        refundAmount = booking.grossRevenue;
      }
    }
    
    // Cancel booking in transaction
    await db.$transaction(async (tx) => {
      // Update booking status
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Guest requested cancellation',
          refundAmount,
        },
      });
      
      // Update inventory
      const inventory = await tx.inventoryDaily.findMany({
        where: {
          propertyId: booking.propertyId,
          roomTypeId: booking.roomTypeId,
          arrivalDate: {
            gte: booking.arrivalDate,
            lt: booking.departureDate,
          },
        },
      });
      
      for (const inv of inventory) {
        await tx.inventoryDaily.update({
          where: { id: inv.id },
          data: {
            otb: { decrement: 1 },
          },
        });
      }
    });
    
    // Create cancellation event
    await db.bookingEvent.create({
      data: {
        eventId: `evt_${randomUUID()}`,
        eventType: 'booking_cancelled',
        bookingId: booking.id,
        propertyId: booking.propertyId,
        arrivalDate: booking.arrivalDate,
        payload: {
          reason: reason || 'Guest requested cancellation',
          refundAmount,
          originalGrossRevenue: booking.grossRevenue,
        },
      },
    });
    
    return NextResponse.json({
      bookingId: booking.bookingId,
      status: 'cancelled',
      refundAmount,
      refundStatus: refundAmount > 0 ? 'processing' : 'no_refund',
      message: refundAmount > 0 
        ? `Refund of ${booking.property.currency} ${refundAmount.toFixed(2)} will be processed within 5-7 business days`
        : 'No refund available based on cancellation policy',
      cancellationPolicy: booking.cancellationPolicy,
      traceId,
    });
    
  } catch (error) {
    console.error('Cancel booking API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
