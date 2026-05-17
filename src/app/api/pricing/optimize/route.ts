import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';
import { calculateOptimalPrices } from '@/lib/pricing-engine';

interface OptimizeRequest {
  propertyId: string;
  arrivalDate: string;
  mode: 'ml_only' | 'hybrid' | 'full_mc';
}

export async function POST(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const body: OptimizeRequest = await request.json();
    const { propertyId, arrivalDate, mode = 'ml_only' } = body;
    
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
    
    // Get room types
    const roomTypes = await db.roomType.findMany({
      where: { propertyId: property.id },
    });
    
    // Get inventory
    const inventory = await db.inventoryDaily.findMany({
      where: {
        propertyId: property.id,
        arrivalDate: targetDate,
      },
    });
    
    // Get feature store
    const featureStore = await db.featureStore.findUnique({
      where: {
        propertyId_arrivalDate: {
          propertyId: property.id,
          arrivalDate: targetDate,
        },
      },
    });
    
    // Run pricing engine
    const result = await calculateOptimalPrices({
      propertyId: property.id,
      arrivalDate: targetDate,
      roomTypes: roomTypes.map(rt => ({
        id: rt.id,
        propertyId: rt.propertyId,
        roomTypeCode: rt.roomTypeCode,
        name: rt.name,
        description: rt.description,
        totalInventory: rt.totalInventory,
        minPrice: rt.minPrice,
        maxPrice: rt.maxPrice,
        defaultPrice: rt.defaultPrice,
        currentPrice: rt.currentPrice,
        upgradeFrom: rt.upgradeFrom,
        upgradeProb: rt.upgradeProb,
        imageUrl: rt.imageUrl,
      })),
      inventory: inventory.map(i => ({
        id: i.id,
        propertyId: i.propertyId,
        arrivalDate: i.arrivalDate,
        roomTypeId: i.roomTypeId,
        total: i.total,
        otb: i.otb,
        available: i.available,
        held: i.held,
        updatedAt: i.updatedAt,
      })),
      features: featureStore ? {
        id: featureStore.id,
        propertyId: featureStore.propertyId,
        arrivalDate: featureStore.arrivalDate,
        searchIntensityIndex: featureStore.searchIntensityIndex,
        priceCheckFrequency: featureStore.priceCheckFrequency,
        geoDemandSpikeIndex: featureStore.geoDemandSpikeIndex,
        cartAbandonmentRate: featureStore.cartAbandonmentRate,
        cancellationVelocityIndex: featureStore.cancellationVelocityIndex,
        pickupPaceIndex: featureStore.pickupPaceIndex,
        competitorPriceIndex: featureStore.competitorPriceIndex,
        conversionProbability: featureStore.conversionProbability,
        updatedAt: featureStore.updatedAt,
      } : null,
      mode,
      riskAversionLambda: property.riskLambda,
    });
    
    return NextResponse.json({
      recommendedPrices: result.recommendedPrices,
      pricingRecommendations: result.pricingRecommendations.map(r => ({
        roomTypeCode: r.roomTypeCode,
        currentPrice: r.currentPrice,
        recommendedPrice: r.recommendedPrice,
        priceChange: r.priceChange,
        priceChangePercent: r.priceChangePercent,
        demandFactor: r.demandFactor,
        expectedDemand: r.expectedDemand,
        confidence: r.confidence,
        reasoning: r.reasoning,
      })),
      expectedNetRevenue: result.expectedNetRevenue,
      revenueVariance: result.revenueVariance,
      confidenceInterval: result.confidenceInterval,
      optimizationModeUsed: result.optimizationModeUsed,
      computationTimeMs: result.computationTimeMs,
      traceId: result.traceId,
      serviceVersion: '1.0.0',
    });
    
  } catch (error) {
    console.error('Pricing optimize API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
