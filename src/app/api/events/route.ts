import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

interface EventRequest {
  event_type: string;
  payload: Record<string, unknown>;
  session_id?: string;
  property_id?: string;
  arrival_date?: string;
  booking_id?: string;
  correlation_id?: string;
}

export async function POST(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const body: EventRequest = await request.json();
    const { 
      event_type, 
      payload, 
      session_id, 
      property_id, 
      arrival_date,
      booking_id,
      correlation_id,
    } = body;
    
    if (!event_type) {
      return NextResponse.json(
        { error: 'Event type is required', traceId },
        { status: 400 }
      );
    }
    
    // Valid event types
    const validEventTypes = [
      'search',
      'price_view',
      'room_view',
      'add_to_cart',
      'checkout_start',
      'hold_created',
      'hold_expired',
      'booking_confirmed',
      'booking_cancelled',
      'promo_applied',
      'filter_used',
      'date_changed',
      'booking_engine_viewed',
      'room_selected',
      'addon_added',
      'addon_removed',
      'guest_info_entered',
      'payment_initiated',
      'page_view',
      'search_initiated',
      'search_complete',
    ];
    
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event type. Valid types: ${validEventTypes.join(', ')}`, traceId },
        { status: 400 }
      );
    }
    
    // Get property ID if provided
    let propertyId: string | null = null;
    if (property_id) {
      const property = await db.property.findFirst({
        where: { propertyId: property_id },
      });
      propertyId = property?.id || null;
    }
    
    // Parse arrival date
    const arrivalDate = arrival_date ? new Date(arrival_date) : null;
    
    // Get booking ID if provided
    let bookingId: string | null = null;
    if (booking_id) {
      const booking = await db.booking.findFirst({
        where: { bookingId: booking_id },
      });
      bookingId = booking?.id || null;
    }
    
    // Create event
    const event = await db.bookingEvent.create({
      data: {
        eventId: `evt_${randomUUID()}`,
        eventType: event_type,
        propertyId,
        arrivalDate,
        sessionId: session_id || null,
        correlationId: correlation_id || null,
        payload: payload || {},
        bookingId,
      },
    });
    
    // Update session score if session_id provided
    if (session_id) {
      await updateSessionScore(session_id, event_type, payload, propertyId, arrivalDate);
    }
    
    return NextResponse.json({
      success: true,
      eventId: event.eventId,
      traceId,
    });
    
  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}

// Update session score based on events
async function updateSessionScore(
  sessionId: string,
  eventType: string,
  payload: Record<string, unknown>,
  propertyId: string | null,
  arrivalDate: Date | null
): Promise<void> {
  try {
    // Get or create session score
    const existing = await db.sessionScore.findUnique({
      where: { sessionId },
    });
    
    if (existing) {
      // Update based on event type
      const updates: Record<string, unknown> = {};
      
      switch (eventType) {
        case 'search':
          updates.searchDepth = { increment: 1 };
          break;
        case 'price_view':
          updates.priceViews = { increment: 1 };
          break;
        case 'room_view':
          updates.timeOnPageSeconds = (existing.timeOnPageSeconds || 0) + 30;
          break;
        case 'add_to_cart':
          updates.intentTier = 'high';
          updates.conversionProbability = Math.min(0.8, existing.conversionProbability + 0.2);
          break;
        case 'checkout_start':
          updates.intentTier = 'high';
          updates.conversionProbability = Math.min(0.9, existing.conversionProbability + 0.1);
          break;
        case 'booking_confirmed':
          updates.conversionProbability = 1.0;
          updates.intentTier = 'converted';
          break;
        case 'promo_applied':
          updates.hasPromoCode = true;
          break;
      }
      
      if (Object.keys(updates).length > 0) {
        await db.sessionScore.update({
          where: { sessionId },
          data: updates,
        });
      }
    } else {
      // Create new session score
      await db.sessionScore.create({
        data: {
          sessionId,
          propertyId,
          arrivalDate,
          searchDepth: eventType === 'search' ? 1 : 0,
          priceViews: eventType === 'price_view' ? 1 : 0,
          timeOnPageSeconds: eventType === 'room_view' ? 30 : 0,
          hasPromoCode: eventType === 'promo_applied',
          intentTier: eventType === 'add_to_cart' ? 'high' : 'low',
          conversionProbability: eventType === 'checkout_start' ? 0.5 : 0.1,
        },
      });
    }
  } catch (error) {
    console.error('Failed to update session score:', error);
    // Don't throw - event tracking should not fail the request
  }
}
