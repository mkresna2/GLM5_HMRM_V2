import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

interface HoldRequest {
  property_id: string;
  search_id: string;
  room_type: string;
  rate_plan_code: string;
  arrival_date: string;
  departure_date: string;
  adults: number;
  children: number;
  session_id: string;
}

const HOLD_DURATION_MINUTES = 15;

export async function POST(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const body: HoldRequest = await request.json();
    const { 
      property_id, 
      search_id, 
      room_type, 
      rate_plan_code, 
      arrival_date, 
      departure_date, 
      adults, 
      children, 
      session_id 
    } = body;
    
    // Validate required fields
    if (!property_id || !room_type || !rate_plan_code || !arrival_date || !departure_date || !session_id) {
      return NextResponse.json(
        { error: 'Missing required fields', traceId },
        { status: 400 }
      );
    }
    
    // Parse dates
    const arrivalDate = new Date(arrival_date);
    const departureDate = new Date(departure_date);
    
    // Validate dates
    if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format', traceId },
        { status: 400 }
      );
    }
    
    // Calculate LOS
    const los = Math.ceil((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Get property
    const property = await db.property.findFirst({
      where: { propertyId: property_id },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', traceId },
        { status: 404 }
      );
    }
    
    // Get room type
    const roomType = await db.roomType.findFirst({
      where: {
        propertyId: property.id,
        roomTypeCode: room_type,
      },
      include: {
        roomAmenities: {
          include: { amenity: true },
        },
      },
    });
    
    if (!roomType) {
      return NextResponse.json(
        { error: 'Room type not found', traceId },
        { status: 404 }
      );
    }
    
    // Get rate plan
    const ratePlan = await db.ratePlan.findFirst({
      where: {
        propertyId: property.id,
        ratePlanCode: rate_plan_code,
      },
    });
    
    if (!ratePlan) {
      return NextResponse.json(
        { error: 'Rate plan not found', traceId },
        { status: 404 }
      );
    }
    
    // Check LOS constraints
    if (los < ratePlan.minLos || los > ratePlan.maxLos) {
      return NextResponse.json(
        { error: `Length of stay must be between ${ratePlan.minLos} and ${ratePlan.maxLos} nights`, traceId },
        { status: 400 }
      );
    }
    
    // Check availability for all nights
    const inventory = await db.inventoryDaily.findMany({
      where: {
        propertyId: property.id,
        roomTypeId: roomType.id,
        arrivalDate: {
          gte: arrivalDate,
          lt: departureDate,
        },
      },
    });
    
    // Verify availability for each night
    for (const inv of inventory) {
      if (inv.available - inv.held < 1) {
        return NextResponse.json(
          { error: 'Room no longer available for selected dates', traceId },
          { status: 409 }
        );
      }
    }
    
    // Calculate price
    const basePrice = roomType.currentPrice || roomType.defaultPrice;
    const discountMultiplier = 1 - (ratePlan.discountPct / 100);
    const pricePerNight = Math.round(basePrice * discountMultiplier);
    const totalPrice = pricePerNight * los;
    
    // Create hold expiration
    const expiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60 * 1000);
    const holdId = `hold_${Date.now()}_${randomUUID().slice(0, 8)}`;
    
    // Create hold in transaction
    const hold = await db.$transaction(async (tx) => {
      // Create room hold
      const newHold = await tx.roomHold.create({
        data: {
          holdId,
          propertyId: property.id,
          roomTypeId: roomType.id,
          ratePlanId: ratePlan.id,
          sessionId: session_id,
          searchId: search_id,
          arrivalDate,
          departureDate,
          los,
          adults: adults || 2,
          children: children || 0,
          pricePerNight,
          totalPrice,
          expiresAt,
        },
      });
      
      // Update inventory held count for each night
      for (const inv of inventory) {
        await tx.inventoryDaily.update({
          where: { id: inv.id },
          data: { held: { increment: 1 } },
        });
      }
      
      return newHold;
    });
    
    // Get available addons
    const addons = await db.addon.findMany({
      where: { propertyId: property.id },
    });
    
    // Track hold event
    await db.bookingEvent.create({
      data: {
        eventId: `evt_${randomUUID()}`,
        eventType: 'hold_created',
        propertyId: property.id,
        arrivalDate,
        sessionId: session_id,
        payload: {
          holdId: hold.holdId,
          roomType: room_type,
          ratePlan: rate_plan_code,
          pricePerNight,
          totalPrice,
          expiresAt,
        },
      },
    });
    
    return NextResponse.json({
      holdId: hold.holdId,
      expiresAt: hold.expiresAt.toISOString(),
      roomType: roomType.roomTypeCode,
      roomName: roomType.name,
      pricePerNight,
      totalPrice,
      addonsAvailable: addons.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        description: a.description,
        pricePerNight: a.pricePerNight,
        price: a.price,
      })),
      traceId,
    });
    
  } catch (error) {
    console.error('Hold API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
