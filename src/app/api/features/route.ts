import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const arrivalDate = searchParams.get('arrivalDate');
    
    if (!propertyId || !arrivalDate) {
      return NextResponse.json(
        { error: 'Property ID and arrival date are required', traceId },
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
    
    // Get or create feature store
    let featureStore = await db.featureStore.findUnique({
      where: {
        propertyId_arrivalDate: {
          propertyId: property.id,
          arrivalDate: targetDate,
        },
      },
    });
    
    // If no feature store exists, create with default values
    if (!featureStore) {
      featureStore = await db.featureStore.create({
        data: {
          propertyId: property.id,
          arrivalDate: targetDate,
          searchIntensityIndex: 1.0,
          priceCheckFrequency: 0,
          geoDemandSpikeIndex: 1.0,
          cartAbandonmentRate: 0,
          cancellationVelocityIndex: 1.0,
          pickupPaceIndex: 1.0,
          competitorPriceIndex: 1.0,
          conversionProbability: 0.1,
        },
      });
    }
    
    return NextResponse.json({
      id: featureStore.id,
      propertyId: property.propertyId,
      arrivalDate: featureStore.arrivalDate.toISOString().split('T')[0],
      searchIntensityIndex: featureStore.searchIntensityIndex,
      priceCheckFrequency: featureStore.priceCheckFrequency,
      geoDemandSpikeIndex: featureStore.geoDemandSpikeIndex,
      cartAbandonmentRate: featureStore.cartAbandonmentRate,
      cancellationVelocityIndex: featureStore.cancellationVelocityIndex,
      pickupPaceIndex: featureStore.pickupPaceIndex,
      competitorPriceIndex: featureStore.competitorPriceIndex,
      conversionProbability: featureStore.conversionProbability,
      updatedAt: featureStore.updatedAt.toISOString(),
      traceId,
    });
    
  } catch (error) {
    console.error('Features API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
