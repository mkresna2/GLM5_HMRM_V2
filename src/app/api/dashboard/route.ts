import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  const traceId = `trace_${Date.now()}_${randomUUID().slice(0, 8)}`;
  
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    
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
    
    // Date range for calculations (last 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    // Get bookings in the period
    const bookings = await db.booking.findMany({
      where: {
        propertyId: property.id,
        createdAt: {
          gte: thirtyDaysAgo,
          lte: now,
        },
      },
      include: {
        roomType: true,
        ratePlan: true,
      },
    });
    
    // Get inventory data
    const inventory = await db.inventoryDaily.findMany({
      where: {
        propertyId: property.id,
        arrivalDate: {
          gte: thirtyDaysAgo,
          lte: thirtyDaysFromNow,
        },
      },
    });
    
    // Calculate KPIs
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
    
    // Total revenue
    const totalNetRevenue = confirmedBookings.reduce((sum, b) => sum + b.netRevenue, 0);
    const totalGrossRevenue = confirmedBookings.reduce((sum, b) => sum + b.grossRevenue, 0);
    
    // ADR (Average Daily Rate)
    const totalRoomNights = confirmedBookings.reduce((sum, b) => sum + b.los, 0);
    const adr = totalRoomNights > 0 ? totalGrossRevenue / totalRoomNights : 0;
    
    // Occupancy rate
    const totalInventoryNights = inventory.reduce((sum, i) => sum + i.total, 0);
    const totalBookedNights = inventory.reduce((sum, i) => sum + i.otb, 0);
    const occupancyRate = totalInventoryNights > 0 ? (totalBookedNights / totalInventoryNights) * 100 : 0;
    
    // RevPAR (Revenue Per Available Room)
    const revpar = totalInventoryNights > 0 ? totalNetRevenue / totalInventoryNights : 0;
    
    // Direct booking share
    const directBookings = confirmedBookings.filter(b => b.channel === 'direct');
    const directShare = confirmedBookings.length > 0 
      ? (directBookings.length / confirmedBookings.length) * 100 
      : 0;
    
    // Cancellation rate
    const totalBookingsCount = bookings.length;
    const cancellationRate = totalBookingsCount > 0 
      ? (cancelledBookings.length / totalBookingsCount) * 100 
      : 0;
    
    // Average LOS
    const avgLos = confirmedBookings.length > 0 
      ? confirmedBookings.reduce((sum, b) => sum + b.los, 0) / confirmedBookings.length 
      : 0;
    
    // Revenue by channel
    const revenueByChannel: { channel: string; revenue: number; bookings: number }[] = [];
    const channelMap = new Map<string, { revenue: number; bookings: number }>();
    
    for (const booking of confirmedBookings) {
      const existing = channelMap.get(booking.channel) || { revenue: 0, bookings: 0 };
      existing.revenue += booking.netRevenue;
      existing.bookings += 1;
      channelMap.set(booking.channel, existing);
    }
    
    for (const [channel, data] of channelMap) {
      revenueByChannel.push({
        channel,
        revenue: data.revenue,
        bookings: data.bookings,
      });
    }
    
    revenueByChannel.sort((a, b) => b.revenue - a.revenue);
    
    // Occupancy by date (next 14 days)
    const occupancyByDate: { date: string; occupancy: number }[] = [];
    const next14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      date.setHours(0, 0, 0, 0);
      return date;
    });
    
    for (const date of next14Days) {
      const dateStr = date.toISOString().split('T')[0];
      const dayInventory = inventory.filter(
        i => i.arrivalDate.toISOString().split('T')[0] === dateStr
      );
      
      if (dayInventory.length > 0) {
        const totalRooms = dayInventory.reduce((sum, i) => sum + i.total, 0);
        const bookedRooms = dayInventory.reduce((sum, i) => sum + i.otb, 0);
        const occupancy = totalRooms > 0 ? (bookedRooms / totalRooms) * 100 : 0;
        
        occupancyByDate.push({
          date: dateStr,
          occupancy: Math.round(occupancy * 10) / 10,
        });
      }
    }
    
    // Recent bookings (last 10)
    const recentBookings = confirmedBookings
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(b => ({
        bookingId: b.bookingId,
        guestName: `${b.guestFirstName} ${b.guestLastName}`,
        roomType: b.roomType.roomTypeCode,
        arrivalDate: b.arrivalDate.toISOString().split('T')[0],
        departureDate: b.departureDate.toISOString().split('T')[0],
        grossRevenue: b.grossRevenue,
        channel: b.channel,
        status: b.status,
        createdAt: b.createdAt.toISOString(),
      }));
    
    // Pricing recommendations
    const pricingDecisions = await db.pricingDecision.findMany({
      where: {
        propertyId: property.id,
        decisionTime: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { decisionTime: 'desc' },
      take: 5,
    });
    
    return NextResponse.json({
      kpis: {
        revpar: Math.round(revpar * 100) / 100,
        adr: Math.round(adr * 100) / 100,
        occupancy: Math.round(occupancyRate * 10) / 10,
        netRevenue: Math.round(totalNetRevenue * 100) / 100,
        directShare: Math.round(directShare * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        totalBookings: confirmedBookings.length,
        avgLos: Math.round(avgLos * 10) / 10,
      },
      revenueByChannel,
      occupancyByDate,
      recentBookings,
      pricingDecisions: pricingDecisions.map(pd => ({
        id: pd.id,
        arrivalDate: pd.arrivalDate.toISOString().split('T')[0],
        decisionTime: pd.decisionTime.toISOString(),
        pricingMode: pd.pricingMode,
        pricesBefore: pd.pricesBefore,
        pricesAfter: pd.pricesAfter,
        expectedNetRevenue: pd.expectedNetRevenue,
        triggerReason: pd.triggerReason,
      })),
      currency: property.currency,
      traceId,
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', traceId },
      { status: 500 }
    );
  }
}
