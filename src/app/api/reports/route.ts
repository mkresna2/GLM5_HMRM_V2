import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface ReportFilters {
  propertyId: string;
  dateRange: string;
  startDate?: Date;
  endDate?: Date;
}

async function getDateRange(range: string): Promise<{ start: Date; end: Date }> {
  const now = new Date();
  
  // Check if it's a custom date range (format: startDate,endDate)
  if (range.includes(',')) {
    const [startStr, endStr] = range.split(',');
    const start = new Date(startStr);
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  
  switch (range) {
    case '7d':
      return { start: subDays(now, 7), end: now };
    case '30d':
      return { start: subDays(now, 30), end: now };
    case '90d':
      return { start: subDays(now, 90), end: now };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last_month':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    default:
      return { start: subDays(now, 30), end: now };
  }
}

async function generateRevenueReport(filters: ReportFilters) {
  const { start, end } = await getDateRange(filters.dateRange);
  
  // Convert dates to ISO strings for proper comparison with SQLite
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  
  const bookings = await db.booking.findMany({
    where: {
      propertyId: filters.propertyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      roomType: true,
      ratePlan: true,
    },
  });

  const dailyRevenue: Record<string, { date: string; grossRevenue: number; netRevenue: number; bookings: number; avgRate: number }> = {};
  
  bookings.forEach(booking => {
    const dateKey = format(booking.createdAt, 'yyyy-MM-dd');
    if (!dailyRevenue[dateKey]) {
      dailyRevenue[dateKey] = { date: dateKey, grossRevenue: 0, netRevenue: 0, bookings: 0, avgRate: 0 };
    }
    dailyRevenue[dateKey].grossRevenue += booking.grossRevenue;
    dailyRevenue[dateKey].netRevenue += booking.netRevenue;
    dailyRevenue[dateKey].bookings += 1;
  });

  // Calculate average rates
  Object.values(dailyRevenue).forEach(day => {
    day.avgRate = day.bookings > 0 ? day.grossRevenue / day.bookings : 0;
  });

  const roomTypeRevenue: Record<string, { roomType: string; revenue: number; bookings: number; avgRate: number }> = {};
  
  bookings.forEach(booking => {
    const roomType = booking.roomType?.roomTypeCode || 'Unknown';
    if (!roomTypeRevenue[roomType]) {
      roomTypeRevenue[roomType] = { roomType, revenue: 0, bookings: 0, avgRate: 0 };
    }
    roomTypeRevenue[roomType].revenue += booking.grossRevenue;
    roomTypeRevenue[roomType].bookings += 1;
  });

  Object.values(roomTypeRevenue).forEach(rt => {
    rt.avgRate = rt.bookings > 0 ? rt.revenue / rt.bookings : 0;
  });

  const channelRevenue: Record<string, { channel: string; revenue: number; bookings: number; commission: number }> = {};
  
  bookings.forEach(booking => {
    const channel = booking.channel;
    if (!channelRevenue[channel]) {
      channelRevenue[channel] = { channel, revenue: 0, bookings: 0, commission: 0 };
    }
    channelRevenue[channel].revenue += booking.grossRevenue;
    channelRevenue[channel].bookings += 1;
    channelRevenue[channel].commission += booking.commissionAmount;
  });

  return {
    summary: {
      totalGrossRevenue: bookings.reduce((sum, b) => sum + b.grossRevenue, 0),
      totalNetRevenue: bookings.reduce((sum, b) => sum + b.netRevenue, 0),
      totalBookings: bookings.length,
      avgDailyRate: bookings.length > 0 ? bookings.reduce((sum, b) => sum + b.grossRevenue, 0) / bookings.length : 0,
      totalCommission: bookings.reduce((sum, b) => sum + b.commissionAmount, 0),
    },
    daily: Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date)),
    byRoomType: Object.values(roomTypeRevenue),
    byChannel: Object.values(channelRevenue),
    bookings: bookings.map(b => ({
      bookingId: b.bookingId,
      guestName: `${b.guestFirstName} ${b.guestLastName}`,
      arrivalDate: format(b.arrivalDate, 'yyyy-MM-dd'),
      departureDate: format(b.departureDate, 'yyyy-MM-dd'),
      roomType: b.roomType?.roomTypeCode,
      channel: b.channel,
      grossRevenue: b.grossRevenue,
      netRevenue: b.netRevenue,
      status: b.status,
    })),
  };
}

async function generateOccupancyReport(filters: ReportFilters) {
  const { start, end } = await getDateRange(filters.dateRange);
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  
  const inventory = await db.inventoryDaily.findMany({
    where: {
      propertyId: filters.propertyId,
      arrivalDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      roomType: true,
    },
  });

  const dailyOccupancy: Record<string, { date: string; totalRooms: number; bookedRooms: number; availableRooms: number; occupancy: number }> = {};
  
  inventory.forEach(inv => {
    const dateKey = format(inv.arrivalDate, 'yyyy-MM-dd');
    if (!dailyOccupancy[dateKey]) {
      dailyOccupancy[dateKey] = { date: dateKey, totalRooms: 0, bookedRooms: 0, availableRooms: 0, occupancy: 0 };
    }
    dailyOccupancy[dateKey].totalRooms += inv.total;
    dailyOccupancy[dateKey].bookedRooms += inv.otb;
    dailyOccupancy[dateKey].availableRooms += inv.available;
  });

  Object.values(dailyOccupancy).forEach(day => {
    day.occupancy = day.totalRooms > 0 ? day.bookedRooms / day.totalRooms : 0;
  });

  const roomTypeOccupancy: Record<string, { roomType: string; totalRooms: number; avgOccupancy: number; days: number }> = {};
  
  inventory.forEach(inv => {
    const roomType = inv.roomType?.roomTypeCode || 'Unknown';
    if (!roomTypeOccupancy[roomType]) {
      roomTypeOccupancy[roomType] = { roomType, totalRooms: 0, avgOccupancy: 0, days: 0 };
    }
    roomTypeOccupancy[roomType].totalRooms += inv.otb;
    roomTypeOccupancy[roomType].days += 1;
  });

  const totalDays = Object.keys(dailyOccupancy).length || 1;
  Object.values(roomTypeOccupancy).forEach(rt => {
    rt.avgOccupancy = rt.days > 0 ? (rt.totalRooms / rt.days) / (80 / 3) : 0; // Assuming 80 total rooms split
  });

  return {
    summary: {
      avgOccupancy: Object.values(dailyOccupancy).reduce((sum, d) => sum + d.occupancy, 0) / (Object.keys(dailyOccupancy).length || 1),
      peakOccupancy: Math.max(...Object.values(dailyOccupancy).map(d => d.occupancy), 0),
      lowOccupancy: Math.min(...Object.values(dailyOccupancy).map(d => d.occupancy), 1),
      totalRoomNights: Object.values(dailyOccupancy).reduce((sum, d) => sum + d.bookedRooms, 0),
    },
    daily: Object.values(dailyOccupancy).sort((a, b) => a.date.localeCompare(b.date)),
    byRoomType: Object.values(roomTypeOccupancy),
  };
}

async function generateChannelReport(filters: ReportFilters) {
  const { start, end } = await getDateRange(filters.dateRange);
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  
  const bookings = await db.booking.findMany({
    where: {
      propertyId: filters.propertyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const channelStats: Record<string, { channel: string; bookings: number; grossRevenue: number; netRevenue: number; commission: number; cancelledBookings: number }> = {};
  
  bookings.forEach(booking => {
    const channel = booking.channel;
    if (!channelStats[channel]) {
      channelStats[channel] = { channel, bookings: 0, grossRevenue: 0, netRevenue: 0, commission: 0, cancelledBookings: 0 };
    }
    channelStats[channel].bookings += 1;
    channelStats[channel].grossRevenue += booking.grossRevenue;
    channelStats[channel].netRevenue += booking.netRevenue;
    channelStats[channel].commission += booking.commissionAmount;
    if (booking.status === 'cancelled') {
      channelStats[channel].cancelledBookings += 1;
    }
  });

  const totalRevenue = Object.values(channelStats).reduce((sum, c) => sum + c.grossRevenue, 0);

  return {
    summary: {
      totalChannels: Object.keys(channelStats).length,
      totalBookings: bookings.length,
      totalRevenue,
      avgCommissionRate: bookings.length > 0 ? bookings.reduce((sum, b) => sum + b.commissionRate, 0) / bookings.length : 0,
    },
    channels: Object.values(channelStats).map(c => ({
      ...c,
      revenueShare: totalRevenue > 0 ? (c.grossRevenue / totalRevenue) : 0,
      cancellationRate: c.bookings > 0 ? c.cancelledBookings / c.bookings : 0,
    })),
    period: {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    },
  };
}

async function generateGuestReport(filters: ReportFilters) {
  const { start, end } = await getDateRange(filters.dateRange);
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  
  const bookings = await db.booking.findMany({
    where: {
      propertyId: filters.propertyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const countryStats: Record<string, { country: string; bookings: number; revenue: number; avgLos: number; totalLos: number }> = {};
  
  bookings.forEach(booking => {
    const country = booking.guestCountry || 'Unknown';
    if (!countryStats[country]) {
      countryStats[country] = { country, bookings: 0, revenue: 0, avgLos: 0, totalLos: 0 };
    }
    countryStats[country].bookings += 1;
    countryStats[country].revenue += booking.grossRevenue;
    countryStats[country].totalLos += booking.los;
  });

  Object.values(countryStats).forEach(c => {
    c.avgLos = c.bookings > 0 ? c.totalLos / c.bookings : 0;
  });

  const leadTimeDistribution = {
    sameDay: 0,
    oneToThreeDays: 0,
    fourToSevenDays: 0,
    oneToTwoWeeks: 0,
    twoToFourWeeks: 0,
    overFourWeeks: 0,
  };

  bookings.forEach(booking => {
    if (booking.leadTimeDays <= 0) leadTimeDistribution.sameDay++;
    else if (booking.leadTimeDays <= 3) leadTimeDistribution.oneToThreeDays++;
    else if (booking.leadTimeDays <= 7) leadTimeDistribution.fourToSevenDays++;
    else if (booking.leadTimeDays <= 14) leadTimeDistribution.oneToTwoWeeks++;
    else if (booking.leadTimeDays <= 28) leadTimeDistribution.twoToFourWeeks++;
    else leadTimeDistribution.overFourWeeks++;
  });

  const losDistribution: Record<number, number> = {};
  bookings.forEach(booking => {
    losDistribution[booking.los] = (losDistribution[booking.los] || 0) + 1;
  });

  return {
    summary: {
      totalGuests: bookings.length,
      uniqueCountries: Object.keys(countryStats).length,
      avgLeadTime: bookings.length > 0 ? bookings.reduce((sum, b) => sum + b.leadTimeDays, 0) / bookings.length : 0,
      avgLos: bookings.length > 0 ? bookings.reduce((sum, b) => sum + b.los, 0) / bookings.length : 0,
      repeatGuestRate: 0, // Would need guest tracking for this
    },
    byCountry: Object.values(countryStats).sort((a, b) => b.bookings - a.bookings),
    leadTimeDistribution,
    losDistribution: Object.entries(losDistribution).map(([los, count]) => ({ los: parseInt(los), count })),
    period: {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    },
  };
}

async function generateCancellationReport(filters: ReportFilters) {
  const { start, end } = await getDateRange(filters.dateRange);
  
  const startDate = new Date(start);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(23, 59, 59, 999);
  
  const bookings = await db.booking.findMany({
    where: {
      propertyId: filters.propertyId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');
  const cancelledWithReason = cancelledBookings.filter(b => b.cancellationReason);

  const reasonDistribution: Record<string, number> = {};
  cancelledWithReason.forEach(booking => {
    const reason = booking.cancellationReason || 'Unknown';
    reasonDistribution[reason] = (reasonDistribution[reason] || 0) + 1;
  });

  const channelCancellation: Record<string, { channel: string; total: number; cancelled: number }> = {};
  bookings.forEach(booking => {
    const channel = booking.channel;
    if (!channelCancellation[channel]) {
      channelCancellation[channel] = { channel, total: 0, cancelled: 0 };
    }
    channelCancellation[channel].total += 1;
    if (booking.status === 'cancelled') {
      channelCancellation[channel].cancelled += 1;
    }
  });

  const leadTimeCancellation: Record<string, { range: string; total: number; cancelled: number }> = {
    '0-3 days': { range: '0-3 days', total: 0, cancelled: 0 },
    '4-7 days': { range: '4-7 days', total: 0, cancelled: 0 },
    '8-14 days': { range: '8-14 days', total: 0, cancelled: 0 },
    '15-30 days': { range: '15-30 days', total: 0, cancelled: 0 },
    '30+ days': { range: '30+ days', total: 0, cancelled: 0 },
  };

  bookings.forEach(booking => {
    const lt = booking.leadTimeDays;
    let range: string;
    if (lt <= 3) range = '0-3 days';
    else if (lt <= 7) range = '4-7 days';
    else if (lt <= 14) range = '8-14 days';
    else if (lt <= 30) range = '15-30 days';
    else range = '30+ days';
    
    leadTimeCancellation[range].total += 1;
    if (booking.status === 'cancelled') {
      leadTimeCancellation[range].cancelled += 1;
    }
  });

  return {
    summary: {
      totalBookings: bookings.length,
      cancelledBookings: cancelledBookings.length,
      cancellationRate: bookings.length > 0 ? cancelledBookings.length / bookings.length : 0,
      lostRevenue: cancelledBookings.reduce((sum, b) => sum + b.grossRevenue, 0),
      avgRefundAmount: cancelledBookings.length > 0 
        ? cancelledBookings.reduce((sum, b) => sum + (b.refundAmount || 0), 0) / cancelledBookings.length 
        : 0,
    },
    byReason: Object.entries(reasonDistribution).map(([reason, count]) => ({ reason, count })),
    byChannel: Object.values(channelCancellation).map(c => ({
      ...c,
      rate: c.total > 0 ? c.cancelled / c.total : 0,
    })),
    byLeadTime: Object.values(leadTimeCancellation).map(lt => ({
      ...lt,
      rate: lt.total > 0 ? lt.cancelled / lt.total : 0,
    })),
    period: {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd'),
    },
  };
}

function formatCSV(data: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const headerRow = headers.map(h => h.label).join(',');
  const dataRows = data.map(row => 
    headers.map(h => {
      const value = row[h.key];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value ?? '';
    }).join(',')
  ).join('\n');
  
  return `${headerRow}\n${dataRows}`;
}

function formatReportAsCSV(reportType: string, data: Record<string, unknown>): string {
  switch (reportType) {
    case 'revenue': {
      const revenueData = data as { daily: Record<string, unknown>[]; bookings: Record<string, unknown>[] };
      const dailyCSV = formatCSV(revenueData.daily, [
        { key: 'date', label: 'Date' },
        { key: 'grossRevenue', label: 'Gross Revenue' },
        { key: 'netRevenue', label: 'Net Revenue' },
        { key: 'bookings', label: 'Bookings' },
        { key: 'avgRate', label: 'Avg Rate' },
      ]);
      
      const bookingsCSV = formatCSV(revenueData.bookings, [
        { key: 'bookingId', label: 'Booking ID' },
        { key: 'guestName', label: 'Guest Name' },
        { key: 'arrivalDate', label: 'Arrival Date' },
        { key: 'departureDate', label: 'Departure Date' },
        { key: 'roomType', label: 'Room Type' },
        { key: 'channel', label: 'Channel' },
        { key: 'grossRevenue', label: 'Gross Revenue' },
        { key: 'netRevenue', label: 'Net Revenue' },
        { key: 'status', label: 'Status' },
      ]);
      
      return `DAILY REVENUE\n${dailyCSV}\n\nBOOKING DETAILS\n${bookingsCSV}`;
    }
    
    case 'occupancy': {
      const occupancyData = data as { daily: Record<string, unknown>[] };
      return formatCSV(occupancyData.daily, [
        { key: 'date', label: 'Date' },
        { key: 'totalRooms', label: 'Total Rooms' },
        { key: 'bookedRooms', label: 'Booked Rooms' },
        { key: 'availableRooms', label: 'Available Rooms' },
        { key: 'occupancy', label: 'Occupancy Rate' },
      ]);
    }
    
    case 'channel': {
      const channelData = data as { channels: Record<string, unknown>[] };
      return formatCSV(channelData.channels, [
        { key: 'channel', label: 'Channel' },
        { key: 'bookings', label: 'Bookings' },
        { key: 'grossRevenue', label: 'Gross Revenue' },
        { key: 'netRevenue', label: 'Net Revenue' },
        { key: 'commission', label: 'Commission' },
        { key: 'revenueShare', label: 'Revenue Share' },
        { key: 'cancellationRate', label: 'Cancellation Rate' },
      ]);
    }
    
    case 'guest': {
      const guestData = data as { byCountry: Record<string, unknown>[]; losDistribution: Record<string, unknown>[] };
      const countryCSV = formatCSV(guestData.byCountry, [
        { key: 'country', label: 'Country' },
        { key: 'bookings', label: 'Bookings' },
        { key: 'revenue', label: 'Revenue' },
        { key: 'avgLos', label: 'Avg Length of Stay' },
      ]);
      
      const losCSV = formatCSV(guestData.losDistribution, [
        { key: 'los', label: 'Length of Stay (nights)' },
        { key: 'count', label: 'Number of Bookings' },
      ]);
      
      return `GUESTS BY COUNTRY\n${countryCSV}\n\nLENGTH OF STAY DISTRIBUTION\n${losCSV}`;
    }
    
    case 'cancellation': {
      const cancelData = data as { byChannel: Record<string, unknown>[]; byLeadTime: Record<string, unknown>[] };
      const channelCSV = formatCSV(cancelData.byChannel, [
        { key: 'channel', label: 'Channel' },
        { key: 'total', label: 'Total Bookings' },
        { key: 'cancelled', label: 'Cancelled' },
        { key: 'rate', label: 'Cancellation Rate' },
      ]);
      
      const leadTimeCSV = formatCSV(cancelData.byLeadTime, [
        { key: 'range', label: 'Lead Time Range' },
        { key: 'total', label: 'Total Bookings' },
        { key: 'cancelled', label: 'Cancelled' },
        { key: 'rate', label: 'Cancellation Rate' },
      ]);
      
      return `CANCELLATION BY CHANNEL\n${channelCSV}\n\nCANCELLATION BY LEAD TIME\n${leadTimeCSV}`;
    }
    
    default:
      return JSON.stringify(data, null, 2);
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reportType = searchParams.get('type') || 'revenue';
  const dateRange = searchParams.get('dateRange') || '30d';
  const format_type = searchParams.get('format') || 'json';
  const propertyIdParam = searchParams.get('propertyId') || 'H001';

  // Get the property first to get the internal ID
  const property = await db.property.findFirst({
    where: { propertyId: propertyIdParam },
  });

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const filters: ReportFilters = {
    propertyId: property.id, // Use internal UUID
    dateRange,
  };

  let reportData: Record<string, unknown>;

  try {
    switch (reportType) {
      case 'revenue':
        reportData = await generateRevenueReport(filters);
        break;
      case 'occupancy':
        reportData = await generateOccupancyReport(filters);
        break;
      case 'channel':
        reportData = await generateChannelReport(filters);
        break;
      case 'guest':
        reportData = await generateGuestReport(filters);
        break;
      case 'cancellation':
        reportData = await generateCancellationReport(filters);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    if (format_type === 'csv') {
      const csvContent = formatReportAsCSV(reportType, reportData);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${reportType}_report_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      reportType,
      generatedAt: new Date().toISOString(),
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
