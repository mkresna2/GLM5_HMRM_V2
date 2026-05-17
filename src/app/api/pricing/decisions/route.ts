import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required', traceId },
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
    
    // Build date filter
    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }
    
    // Get pricing decisions
    const decisions = await db.pricingDecision.findMany({
      where: {
        propertyId: property.id,
        ...(Object.keys(dateFilter).length > 0 && { arrivalDate: dateFilter }),
      },
      orderBy: { decisionTime: 'desc' },
      take: 100,
    });
    
    return NextResponse.json(
      decisions.map(d => ({
        id: d.id,
        propertyId: property.propertyId,
        arrivalDate: d.arrivalDate.toISOString().split('T')[0],
        decisionTime: d.decisionTime.toISOString(),
        pricingMode: d.pricingMode,
        pricesBefore: d.pricesBefore,
        pricesAfter: d.pricesAfter,
        expectedNetRevenue: d.expectedNetRevenue,
        revenueVariance: d.revenueVariance,
        confidenceLow: d.confidenceLow,
        confidenceHigh: d.confidenceHigh,
        triggerReason: d.triggerReason,
        computationMs: d.computationMs,
        searchIntensityIndex: d.searchIntensityIndex,
        conversionProbability: d.conversionProbability,
      }))
    );
    
  } catch (error) {
    console.error('Pricing decisions API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
