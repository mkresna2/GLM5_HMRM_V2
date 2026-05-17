import { PrismaClient } from '@prisma/client';
import { addDays, subDays, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.sessionScore.deleteMany();
  await prisma.featureStore.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.bookingAddon.deleteMany();
  await prisma.roomHold.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.pricingDecision.deleteMany();
  await prisma.inventoryDaily.deleteMany();
  await prisma.roomAmenity.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.ratePlan.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.property.deleteMany();

  // Create Property
  const property = await prisma.property.create({
    data: {
      propertyId: 'H001',
      name: 'Sakala Resort Bali',
      timezone: 'Asia/Makassar',
      currency: 'USD',
      totalRooms: 80,
      overbookingTolerance: 0.05,
      riskLambda: 0.25,
    },
  });
  console.log('✅ Created property:', property.name);

  // Create Amenities
  const amenities = await Promise.all([
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'ocean_view', name: 'Ocean View', icon: 'waves' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'garden_view', name: 'Garden View', icon: 'tree' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'balcony', name: 'Private Balcony', icon: 'door-open' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'king_bed', name: 'King Bed', icon: 'bed-double' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'twin_bed', name: 'Twin Beds', icon: 'bed' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'bathtub', name: 'Bathtub', icon: 'bath' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'minibar', name: 'Minibar', icon: 'wine' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'wifi', name: 'Free WiFi', icon: 'wifi' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'ac', name: 'Air Conditioning', icon: 'snowflake' },
    }),
    prisma.amenity.create({
      data: { propertyId: property.id, code: 'safe', name: 'In-room Safe', icon: 'lock' },
    }),
  ]);
  console.log('✅ Created amenities:', amenities.length);

  // Create Room Types
  const roomTypes = await Promise.all([
    prisma.roomType.create({
      data: {
        propertyId: property.id,
        roomTypeCode: 'STD',
        name: 'Standard Garden View',
        description: 'Comfortable room with garden views, featuring a king bed and modern amenities. Perfect for budget-conscious travelers seeking a peaceful retreat.',
        totalInventory: 35,
        minPrice: 150,
        maxPrice: 280,
        defaultPrice: 195,
        currentPrice: 195,
        upgradeFrom: null,
        upgradeProb: 0,
        imageUrl: '/images/rooms/standard.jpg',
      },
    }),
    prisma.roomType.create({
      data: {
        propertyId: property.id,
        roomTypeCode: 'DLX',
        name: 'Deluxe Ocean View',
        description: 'Spacious room with stunning ocean views, featuring a private balcony, king bed, and luxurious bathtub. Ideal for romantic getaways.',
        totalInventory: 30,
        minPrice: 230,
        maxPrice: 450,
        defaultPrice: 275,
        currentPrice: 275,
        upgradeFrom: 'STD',
        upgradeProb: 0.15,
        imageUrl: '/images/rooms/deluxe.jpg',
      },
    }),
    prisma.roomType.create({
      data: {
        propertyId: property.id,
        roomTypeCode: 'STE',
        name: 'Presidential Suite',
        description: 'Our most luxurious accommodation featuring a separate living area, panoramic ocean views, private jacuzzi, and personalized butler service.',
        totalInventory: 15,
        minPrice: 380,
        maxPrice: 750,
        defaultPrice: 450,
        currentPrice: 450,
        upgradeFrom: 'DLX',
        upgradeProb: 0.10,
        imageUrl: '/images/rooms/suite.jpg',
      },
    }),
  ]);
  console.log('✅ Created room types:', roomTypes.length);

  // Create Room Amenity mappings
  const amenityMap = Object.fromEntries(amenities.map((a) => [a.code, a.id]));
  
  // STD amenities
  await prisma.roomAmenity.createMany({
    data: [
      { roomTypeId: roomTypes[0].id, amenityId: amenityMap['garden_view'] },
      { roomTypeId: roomTypes[0].id, amenityId: amenityMap['king_bed'] },
      { roomTypeId: roomTypes[0].id, amenityId: amenityMap['wifi'] },
      { roomTypeId: roomTypes[0].id, amenityId: amenityMap['ac'] },
      { roomTypeId: roomTypes[0].id, amenityId: amenityMap['safe'] },
    ],
  });

  // DLX amenities
  await prisma.roomAmenity.createMany({
    data: [
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['ocean_view'] },
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['balcony'] },
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['king_bed'] },
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['bathtub'] },
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['minibar'] },
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['wifi'] },
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['ac'] },
      { roomTypeId: roomTypes[1].id, amenityId: amenityMap['safe'] },
    ],
  });

  // STE amenities
  await prisma.roomAmenity.createMany({
    data: [
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['ocean_view'] },
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['balcony'] },
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['king_bed'] },
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['bathtub'] },
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['minibar'] },
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['wifi'] },
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['ac'] },
      { roomTypeId: roomTypes[2].id, amenityId: amenityMap['safe'] },
    ],
  });
  console.log('✅ Created room amenity mappings');

  // Create Rate Plans
  const ratePlans = await Promise.all([
    prisma.ratePlan.create({
      data: {
        propertyId: property.id,
        ratePlanCode: 'BAR',
        name: 'Best Available Rate',
        description: 'Flexible rate with free cancellation up to 48 hours before arrival.',
        isRefundable: true,
        cancelDeadlineHours: 48,
        minLos: 1,
        maxLos: 30,
        discountPct: 0,
        includesBreakfast: false,
      },
    }),
    prisma.ratePlan.create({
      data: {
        propertyId: property.id,
        ratePlanCode: 'NON_REF',
        name: 'Non-Refundable Rate',
        description: 'Best value rate with 12% discount. Full payment required at booking.',
        isRefundable: false,
        cancelDeadlineHours: 0,
        minLos: 1,
        maxLos: 30,
        discountPct: 12,
        includesBreakfast: false,
      },
    }),
    prisma.ratePlan.create({
      data: {
        propertyId: property.id,
        ratePlanCode: 'BB',
        name: 'Bed & Breakfast',
        description: 'Includes daily breakfast for two guests. Free cancellation up to 48 hours.',
        isRefundable: true,
        cancelDeadlineHours: 48,
        minLos: 2,
        maxLos: 14,
        discountPct: 0,
        includesBreakfast: true,
      },
    }),
    prisma.ratePlan.create({
      data: {
        propertyId: property.id,
        ratePlanCode: 'STAY4',
        name: 'Stay 4+ Save 15%',
        description: 'Book 4 or more nights and save 15%. Free cancellation up to 72 hours.',
        isRefundable: true,
        cancelDeadlineHours: 72,
        minLos: 4,
        maxLos: 30,
        discountPct: 15,
        includesBreakfast: false,
      },
    }),
  ]);
  console.log('✅ Created rate plans:', ratePlans.length);

  // Create Addons
  const addons = await Promise.all([
    prisma.addon.create({
      data: {
        propertyId: property.id,
        code: 'BREAKFAST',
        name: 'Daily Breakfast',
        description: 'Buffet breakfast for two at our oceanfront restaurant',
        pricePerNight: true,
        price: 25,
      },
    }),
    prisma.addon.create({
      data: {
        propertyId: property.id,
        code: 'AIRPORT_TRANSFER',
        name: 'Airport Transfer',
        description: 'Private car transfer from Ngurah Rai International Airport',
        pricePerNight: false,
        price: 45,
      },
    }),
    prisma.addon.create({
      data: {
        propertyId: property.id,
        code: 'LATE_CHECKOUT',
        name: 'Late Checkout (2PM)',
        description: 'Extend your checkout time to 2PM',
        pricePerNight: false,
        price: 35,
      },
    }),
    prisma.addon.create({
      data: {
        propertyId: property.id,
        code: 'ROMANTIC_DINNER',
        name: 'Romantic Beach Dinner',
        description: 'Private candlelit dinner on the beach for two',
        pricePerNight: false,
        price: 150,
      },
    }),
    prisma.addon.create({
      data: {
        propertyId: property.id,
        code: 'SPA_COUple',
        name: 'Couples Spa Package',
        description: '90-minute spa treatment for two including massage and facial',
        pricePerNight: false,
        price: 200,
      },
    }),
  ]);
  console.log('✅ Created addons:', addons.length);

  // Create Inventory for next 90 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const inventoryData = [];
  for (let i = 0; i < 90; i++) {
    const arrivalDate = addDays(today, i);
    
    for (const roomType of roomTypes) {
      // Simulate varying occupancy based on day of week and seasonality
      const dayOfWeek = arrivalDate.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
      const baseOccupancy = isWeekend ? 0.75 : 0.55;
      
      // Add some randomness and seasonality
      const seasonality = 1 + 0.2 * Math.sin((i / 90) * Math.PI * 2);
      const randomFactor = 0.9 + Math.random() * 0.2;
      const occupancyRate = Math.min(0.95, Math.max(0.3, baseOccupancy * seasonality * randomFactor));
      
      const total = roomType.totalInventory;
      const otb = Math.round(total * occupancyRate);
      const available = total - otb;
      
      inventoryData.push({
        propertyId: property.id,
        arrivalDate,
        roomTypeId: roomType.id,
        total,
        otb,
        available,
        held: 0,
      });
    }
  }
  
  await prisma.inventoryDaily.createMany({ data: inventoryData });
  console.log('✅ Created inventory for 90 days:', inventoryData.length, 'records');

  // Create sample bookings for past dates and some future dates
  const bookingsData = [];
  let bookingCounter = 1;
  
  // Create bookings for the last 30 days (for analytics)
  for (let i = -30; i < 30; i++) {
    const arrivalDate = addDays(today, i);
    const numBookings = Math.floor(Math.random() * 5) + 2; // 2-6 bookings per day
    
    for (let j = 0; j < numBookings; j++) {
      const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const ratePlan = ratePlans[Math.floor(Math.random() * ratePlans.length)];
      const los = Math.floor(Math.random() * 5) + 1; // 1-5 nights
      
      const departureDate = addDays(arrivalDate, los);
      const pricePerNight = roomType.defaultPrice * (1 - ratePlan.discountPct / 100);
      const grossRevenue = pricePerNight * los;
      const commissionRate = Math.random() < 0.4 ? 0.18 : 0; // 40% chance of OTA
      const netRevenue = grossRevenue * (1 - commissionRate);
      
      const channel = commissionRate > 0 ? (Math.random() < 0.5 ? 'booking_com' : 'expedia') : 'direct';
      const isPast = i < 0;
      const status = isPast ? (Math.random() < 0.15 ? 'cancelled' : (Math.random() < 0.3 ? 'checked_in' : 'confirmed')) : 'confirmed';
      
      const firstName = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'John', 'Emily', 'Robert', 'Jennifer'][Math.floor(Math.random() * 10)];
      const lastName = ['Wilson', 'Chen', 'Smith', 'Johnson', 'Lee', 'Brown', 'Davis', 'Miller', 'Taylor', 'Anderson'][Math.floor(Math.random() * 10)];
      
      const bookingId = `BK-${format(arrivalDate, 'yyyy')}-${String(bookingCounter).padStart(6, '0')}`;
      bookingCounter++;
      
      bookingsData.push({
        bookingId,
        propertyId: property.id,
        roomTypeId: roomType.id,
        ratePlanId: ratePlan.id,
        channel,
        arrivalDate,
        departureDate,
        los,
        adults: Math.floor(Math.random() * 2) + 1,
        children: Math.random() < 0.3 ? Math.floor(Math.random() * 2) : 0,
        pricePerNight,
        grossRevenue,
        commissionRate,
        commissionAmount: grossRevenue * commissionRate,
        netRevenue,
        addonsTotal: 0,
        leadTimeDays: Math.floor(Math.random() * 60) + 7,
        isRefundable: ratePlan.isRefundable,
        cancellationPolicy: ratePlan.isRefundable ? 'flexible' : 'non_refundable',
        status,
        guestFirstName: firstName,
        guestLastName: lastName,
        guestEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
        guestPhone: `+61${Math.floor(Math.random() * 900000000) + 100000000}`,
        guestCountry: ['AU', 'SG', 'JP', 'KR', 'CN', 'UK', 'US'][Math.floor(Math.random() * 7)],
        cancelledAt: status === 'cancelled' ? subDays(arrivalDate, Math.floor(Math.random() * 14)) : null,
        cancellationReason: status === 'cancelled' ? 'change_of_plan' : null,
        refundAmount: status === 'cancelled' ? grossRevenue : null,
        createdAt: subDays(arrivalDate, Math.floor(Math.random() * 45) + 7),
      });
    }
  }
  
  await prisma.booking.createMany({ data: bookingsData });
  console.log('✅ Created sample bookings:', bookingsData.length, 'records');

  // Create Feature Store data for next 30 days
  const featureStoreData = [];
  for (let i = 0; i < 30; i++) {
    const arrivalDate = addDays(today, i);
    const dayOfWeek = arrivalDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    
    featureStoreData.push({
      propertyId: property.id,
      arrivalDate,
      searchIntensityIndex: 0.8 + Math.random() * 0.8 + (isWeekend ? 0.3 : 0),
      priceCheckFrequency: Math.random() * 5,
      geoDemandSpikeIndex: 0.9 + Math.random() * 0.3,
      cartAbandonmentRate: 0.2 + Math.random() * 0.3,
      cancellationVelocityIndex: 0.8 + Math.random() * 0.4,
      pickupPaceIndex: 0.9 + Math.random() * 0.4,
      competitorPriceIndex: 0.95 + Math.random() * 0.15,
      conversionProbability: 0.1 + Math.random() * 0.2,
    });
  }
  
  await prisma.featureStore.createMany({ data: featureStoreData });
  console.log('✅ Created feature store data:', featureStoreData.length, 'records');

  // Create some pricing decisions
  const pricingDecisionsData = [];
  for (let i = 0; i < 14; i++) {
    const arrivalDate = addDays(today, i + 7);
    
    pricingDecisionsData.push({
      propertyId: property.id,
      arrivalDate,
      decisionTime: subDays(arrivalDate, i),
      pricingMode: ['ML_ONLY', 'ML_CONTROL_VARIATE', 'ML_ONLY'][i % 3],
      pricesBefore: { STD: 190, DLX: 270, STE: 440 },
      pricesAfter: { STD: 195 + Math.floor(Math.random() * 20), DLX: 275 + Math.floor(Math.random() * 30), STE: 450 + Math.floor(Math.random() * 50) },
      expectedNetRevenue: 45000 + Math.random() * 15000,
      revenueVariance: 500000 + Math.random() * 500000,
      confidenceLow: 42000 + Math.random() * 5000,
      confidenceHigh: 55000 + Math.random() * 10000,
      triggerReason: ['scheduled', 'search_surge', 'otb_change', 'competitor_shift'][Math.floor(Math.random() * 4)],
      computationMs: Math.floor(Math.random() * 200) + 50,
      searchIntensityIndex: 1.0 + Math.random() * 0.5,
      conversionProbability: 0.1 + Math.random() * 0.15,
    });
  }
  
  await prisma.pricingDecision.createMany({ data: pricingDecisionsData });
  console.log('✅ Created pricing decisions:', pricingDecisionsData.length, 'records');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
