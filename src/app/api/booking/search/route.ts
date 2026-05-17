import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { calculateDynamicAdjustment, generateUrgencyBadge } from '@/lib/pricing-engine';

// Room search API endpoint - fixed variable naming conflict

interface SearchRequest {
  property_id: string;
  arrival_date: string;
  departure_date: string;
  adults: number;
  children: number;
  rooms: number;
  promo_code?: string;
  session_id?: string;
}

interface RoomSearchResult {
  roomType: string;
  name: string;
  description: string | null;
  availableCount: number;
  imageUrl: string | null;
  amenities: string[];
  ratePlans: RatePlanResult[];
}

interface RatePlanResult {
  ratePlanCode: string;
  name: string;
  description: string | null;
  pricePerNight: number;
  totalPrice: number;
  isRefundable: boolean;
  cancellationDeadline: string | null;
  includesBreakfast: boolean;
  discountPct: number;
  urgencyBadge: string | null;
  minLos: number;
  maxLos: number;
}

export async function POST(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const body: SearchRequest = await request.json();
    const { 
      property_id, 
      arrival_date, 
      departure_date, 
      adults, 
      children, 
      rooms: requestedRooms,
      promo_code,
      session_id 
    } = body;
    
    // Validate required fields
    if (!property_id || !arrival_date || !departure_date) {
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
    
    if (arrivalDate >= departureDate) {
      return NextResponse.json(
        { error: 'Departure date must be after arrival date', traceId },
        { status: 400 }
      );
    }
    
    if (arrivalDate < new Date()) {
      return NextResponse.json(
        { error: 'Arrival date cannot be in the past', traceId },
        { status: 400 }
      );
    }
    
    // Calculate length of stay
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
    
    // Get room types with amenities
    const roomTypes = await db.roomType.findMany({
      where: { propertyId: property.id },
      include: {
        roomAmenities: {
          include: {
            amenity: true,
          },
        },
      },
    });
    
    // Get rate plans
    const ratePlans = await db.ratePlan.findMany({
      where: { propertyId: property.id },
    });
    
    // Get inventory for the date range
    const inventory = await db.inventoryDaily.findMany({
      where: {
        propertyId: property.id,
        arrivalDate: {
          gte: arrivalDate,
          lt: departureDate,
        },
      },
    });
    
    // Get feature store for dynamic pricing
    const featureStore = await db.featureStore.findUnique({
      where: {
        propertyId_arrivalDate: {
          propertyId: property.id,
          arrivalDate,
        },
      },
    });
    
    // Calculate dynamic adjustment
    const dynamicAdjustment = calculateDynamicAdjustment(featureStore);
    
    // Track search event
    if (session_id) {
      await db.bookingEvent.create({
        data: {
          eventId: `evt_${randomUUID()}`,
          eventType: 'search',
          propertyId: property.id,
          arrivalDate,
          sessionId: session_id,
          payload: {
            los,
            adults,
            children,
            rooms: requestedRooms,
            promo_code,
          },
        },
      });
      
      // Update session score
      await db.sessionScore.upsert({
        where: { sessionId: session_id },
        create: {
          sessionId: session_id,
          propertyId: property.id,
          arrivalDate,
          searchDepth: 1,
        },
        update: {
          searchDepth: { increment: 1 },
          propertyId: property.id,
          arrivalDate,
        },
      });
    }
    
    // Build search results
    const searchId = `search_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const roomResults: RoomSearchResult[] = [];
    
    for (const roomType of roomTypes) {
      // Calculate minimum available rooms across all nights
      let minAvailable = roomType.totalInventory;
      
      for (const inv of inventory.filter(i => i.roomTypeId === roomType.id)) {
        const available = inv.available - inv.held;
        minAvailable = Math.min(minAvailable, available);
      }
      
      // Skip if not enough rooms
      if (minAvailable < requestedRooms) continue;
      
      // Get amenities
      const amenities = roomType.roomAmenities.map(ra => ra.amenity.name);
      
      // Build rate plans for this room
      const applicableRatePlans: RatePlanResult[] = [];
      
      for (const ratePlan of ratePlans) {
        // Check LOS constraints
        if (los < ratePlan.minLos || los > ratePlan.maxLos) continue;
        
        // Calculate price
        const basePrice = roomType.currentPrice || roomType.defaultPrice;
        const adjustedPrice = basePrice * (1 + dynamicAdjustment);
        const discountMultiplier = 1 - (ratePlan.discountPct / 100);
        const pricePerNight = Math.round(adjustedPrice * discountMultiplier);
        const totalPrice = pricePerNight * los;
        
        // Calculate cancellation deadline
        let cancellationDeadline: string | null = null;
        if (ratePlan.isRefundable) {
          const deadline = new Date(arrivalDate);
          deadline.setHours(deadline.getHours() - ratePlan.cancelDeadlineHours);
          cancellationDeadline = deadline.toISOString();
        }
        
        // Generate urgency badge
        const urgencyBadge = generateUrgencyBadge(
          minAvailable,
          roomType.totalInventory,
          featureStore?.searchIntensityIndex || 1
        );
        
        applicableRatePlans.push({
          ratePlanCode: ratePlan.ratePlanCode,
          name: ratePlan.name,
          description: ratePlan.description,
          pricePerNight,
          totalPrice,
          isRefundable: ratePlan.isRefundable,
          cancellationDeadline,
          includesBreakfast: ratePlan.includesBreakfast,
          discountPct: ratePlan.discountPct,
          urgencyBadge,
          minLos: ratePlan.minLos,
          maxLos: ratePlan.maxLos,
        });
      }
      
      // Sort rate plans by price
      applicableRatePlans.sort((a, b) => a.totalPrice - b.totalPrice);
      
      roomResults.push({
        roomType: roomType.roomTypeCode,
        name: roomType.name,
        description: roomType.description,
        availableCount: minAvailable,
        imageUrl: roomType.imageUrl,
        amenities,
        ratePlans: applicableRatePlans,
      });
    }
    
    // Sort rooms by lowest available rate plan price
    roomResults.sort((a, b) => {
      const aMinPrice = a.ratePlans[0]?.totalPrice || Infinity;
      const bMinPrice = b.ratePlans[0]?.totalPrice || Infinity;
      return aMinPrice - bMinPrice;
    });
    
    return NextResponse.json({
      propertyId: property.propertyId,
      arrivalDate: arrival_date,
      departureDate: departure_date,
      los,
      currency: property.currency,
      rooms: roomResults,
      pricingNote: dynamicAdjustment > 0 
        ? `Prices include ${Math.round(dynamicAdjustment * 100)}% dynamic adjustment based on current demand`
        : null,
      searchId,
      traceId,
    });
    
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
