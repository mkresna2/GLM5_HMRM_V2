import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

interface ApplyRequest {
  propertyId: string;
  arrivalDate: string;
  prices: Record<string, number>;
  triggerReason?: string;
}

export async function POST(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const body: ApplyRequest = await request.json();
    const { propertyId, arrivalDate, prices, triggerReason } = body;
    
    if (!propertyId || !arrivalDate || !prices) {
      return NextResponse.json(
        { error: 'Property ID, arrival date, and prices are required', traceId },
        { status: 400 }
      );
    }
    
    // Get property
    const property = await db.property.findFirst({
      where: { propertyId },
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Property not found', traceId },
        { status: 404 }
      );
    }
    
    const targetDate = new Date(arrivalDate);
    const startTime = Date.now();
    
    // Get room types
    const roomTypes = await db.roomType.findMany({
      where: { propertyId: property.id },
    });
    
    // Validate prices are within constraints
    for (const roomType of roomTypes) {
      const newPrice = prices[roomType.roomTypeCode];
      if (newPrice !== undefined) {
        if (newPrice < roomType.minPrice || newPrice > roomType.maxPrice) {
          return NextResponse.json(
            { 
              error: `Price for ${roomType.roomTypeCode} must be between ${roomType.minPrice} and ${roomType.maxPrice}`,
              traceId 
            },
            { status: 400 }
          );
        }
      }
    }
    
    // Get feature store for decision record
    const featureStore = await db.featureStore.findUnique({
      where: {
        propertyId_arrivalDate: {
          propertyId: property.id,
          arrivalDate: targetDate,
        },
      },
    });
    
    // Get current prices
    const pricesBefore: Record<string, number> = {};
    for (const rt of roomTypes) {
      pricesBefore[rt.roomTypeCode] = rt.currentPrice || rt.defaultPrice;
    }
    
    // Apply prices in transaction
    await db.$transaction(async (tx) => {
      // Update room type prices
      for (const roomType of roomTypes) {
        const newPrice = prices[roomType.roomTypeCode];
        if (newPrice !== undefined) {
          await tx.roomType.update({
            where: { id: roomType.id },
            data: { currentPrice: newPrice },
          });
        }
      }
      
      // Create pricing decision record
      await tx.pricingDecision.create({
        data: {
          propertyId: property.id,
          arrivalDate: targetDate,
          decisionTime: new Date(),
          pricingMode: 'ML_ONLY',
          pricesBefore,
          pricesAfter: prices,
          expectedNetRevenue: 0, // Would be calculated in production
          revenueVariance: null,
          confidenceLow: null,
          confidenceHigh: null,
          triggerReason: triggerReason || 'manual_update',
          computationMs: Date.now() - startTime,
          searchIntensityIndex: featureStore?.searchIntensityIndex,
          conversionProbability: featureStore?.conversionProbability,
        },
      });
    });
    
    return NextResponse.json({
      success: true,
      message: 'Prices updated successfully',
      updatedPrices: prices,
      traceId,
    });
    
  } catch (error) {
    console.error('Pricing apply API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
