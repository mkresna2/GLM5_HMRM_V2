import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface CustomReportRequest {
  metrics: string[];
  dimensions: string[];
  filters: { field: string; operator: string; value: string }[];
  startDate: string;
  endDate: string;
  propertyId: string;
}

async function getPropertyByExternalId(externalId: string) {
  return db.property.findFirst({
    where: { propertyId: externalId },
  });
}

function getDateRange(startStr: string, endStr: string): { start: Date; end: Date } {
  const start = new Date(startStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endStr);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function applyFilters(
  bookings: Awaited<ReturnType<typeof db.booking.findMany>>,
  filters: { field: string; operator: string; value: string }[]
) {
  return bookings.filter(booking => {
    for (const filter of filters) {
      const fieldValue = getFieldValue(booking, filter.field);
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'equals':
          if (fieldValue !== filterValue) return false;
          break;
        case 'not_equals':
          if (fieldValue === filterValue) return false;
          break;
        case 'greater_than':
          if (typeof fieldValue === 'number' && fieldValue <= parseFloat(filterValue)) return false;
          break;
        case 'less_than':
          if (typeof fieldValue === 'number' && fieldValue >= parseFloat(filterValue)) return false;
          break;
      }
    }
    return true;
  });
}

function getFieldValue(booking: Record<string, unknown>, field: string): string | number {
  switch (field) {
    case 'channel':
      return (booking.channel as string) || 'direct';
    case 'roomType':
      return (booking.roomType as { roomTypeCode: string })?.roomTypeCode || 'Unknown';
    case 'status':
      return (booking.status as string) || 'confirmed';
    case 'revenue':
      return booking.grossRevenue as number;
    case 'los':
      return booking.los as number;
    default:
      return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CustomReportRequest = await request.json();
    const { metrics, dimensions, filters, startDate, endDate, propertyId } = body;

    // Get the property
    const property = await getPropertyByExternalId(propertyId);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const { start, end } = getDateRange(startDate, endDate);

    // Fetch bookings with related data
    const bookings = await db.booking.findMany({
      where: {
        propertyId: property.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        roomType: true,
        ratePlan: true,
      },
    });

    // Apply filters
    const filteredBookings = applyFilters(bookings, filters);

    // Group data based on dimensions
    const groupedData = groupData(filteredBookings, dimensions, metrics);

    return NextResponse.json({
      success: true,
      data: groupedData,
      generatedAt: new Date().toISOString(),
      totalRecords: groupedData.length,
    });
  } catch (error) {
    console.error('Error generating custom report:', error);
    return NextResponse.json({ error: 'Failed to generate custom report' }, { status: 500 });
  }
}

function groupData(
  bookings: Awaited<ReturnType<typeof db.booking.findMany>>,
  dimensions: string[],
  metrics: string[]
): Record<string, unknown>[] {
  // If no dimensions, return aggregate metrics
  if (dimensions.length === 0) {
    return [calculateMetrics(bookings, metrics)];
  }

  // Group by dimensions
  const groups: Record<string, Record<string, unknown>[]> = {};

  bookings.forEach(booking => {
    const key = dimensions.map(d => getDimensionValue(booking, d)).join('_');
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(booking);
  });

  // Calculate metrics for each group
  const result: Record<string, unknown>[] = [];

  Object.entries(groups).forEach(([key, groupBookings]) => {
    const row: Record<string, unknown> = {};

    // Add dimension values
    const keyParts = key.split('_');
    dimensions.forEach((dim, i) => {
      row[dim] = keyParts[i];
    });

    // Calculate metrics
    const calculatedMetrics = calculateMetrics(groupBookings, metrics);
    Object.assign(row, calculatedMetrics);

    result.push(row);
  });

  return result;
}

function getDimensionValue(
  booking: Record<string, unknown>,
  dimension: string
): string {
  switch (dimension) {
    case 'date':
      return format(booking.createdAt as Date, 'yyyy-MM-dd');
    case 'channel':
      return (booking.channel as string) || 'direct';
    case 'roomType':
      return (booking.roomType as { roomTypeCode: string })?.roomTypeCode || 'Unknown';
    case 'country':
      return (booking.guestCountry as string) || 'Unknown';
    case 'status':
      return (booking.status as string) || 'confirmed';
    default:
      return 'Unknown';
  }
}

function calculateMetrics(
  bookings: Record<string, unknown>[],
  metrics: string[]
): Record<string, number> {
  const result: Record<string, number> = {};

  metrics.forEach(metric => {
    switch (metric) {
      case 'revenue':
        result.revenue = bookings.reduce((sum, b) => sum + ((b.grossRevenue as number) || 0), 0);
        break;
      case 'bookings':
        result.bookings = bookings.length;
        break;
      case 'occupancy':
        // Calculate average occupancy from the bookings
        result.occupancy = bookings.length > 0
          ? bookings.reduce((sum, b) => sum + ((b.los as number) || 0), 0) / bookings.length / 10
          : 0;
        break;
      case 'adr':
        const totalRevenue = bookings.reduce((sum, b) => sum + ((b.grossRevenue as number) || 0), 0);
        const totalNights = bookings.reduce((sum, b) => sum + ((b.los as number) || 0), 0);
        result.adr = totalNights > 0 ? totalRevenue / totalNights : 0;
        break;
      case 'guests':
        result.guests = bookings.reduce(
          (sum, b) => sum + ((b.adults as number) || 0) + ((b.children as number) || 0),
          0
        );
        break;
      case 'los':
        result.los = bookings.length > 0
          ? bookings.reduce((sum, b) => sum + ((b.los as number) || 0), 0) / bookings.length
          : 0;
        break;
      case 'commission':
        result.commission = bookings.reduce((sum, b) => sum + ((b.commissionAmount as number) || 0), 0);
        break;
      case 'cancellation':
        result.cancellations = bookings.filter(b => b.status === 'cancelled').length;
        break;
    }
  });

  return result;
}
