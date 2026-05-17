-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Makassar',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "totalRooms" INTEGER NOT NULL,
    "overbookingTolerance" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "riskLambda" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalInventory" INTEGER NOT NULL,
    "minPrice" DOUBLE PRECISION NOT NULL,
    "maxPrice" DOUBLE PRECISION NOT NULL,
    "defaultPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "upgradeFrom" TEXT,
    "upgradeProb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RatePlan" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ratePlanCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isRefundable" BOOLEAN NOT NULL DEFAULT true,
    "cancelDeadlineHours" INTEGER NOT NULL DEFAULT 48,
    "minLos" INTEGER NOT NULL DEFAULT 1,
    "maxLos" INTEGER NOT NULL DEFAULT 30,
    "discountPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "includesBreakfast" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RatePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAmenity" (
    "id" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,

    CONSTRAINT "RoomAmenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Addon" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricePerNight" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Addon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'direct',
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "los" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "grossRevenue" DOUBLE PRECISION NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netRevenue" DOUBLE PRECISION NOT NULL,
    "addonsTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "leadTimeDays" INTEGER,
    "isRefundable" BOOLEAN NOT NULL DEFAULT true,
    "cancellationPolicy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "guestFirstName" TEXT NOT NULL,
    "guestLastName" TEXT NOT NULL,
    "guestEmail" TEXT NOT NULL,
    "guestPhone" TEXT,
    "guestCountry" TEXT,
    "specialRequests" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "refundAmount" DOUBLE PRECISION,
    "sessionId" TEXT,
    "searchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddon" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BookingAddon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryDaily" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "otb" INTEGER NOT NULL DEFAULT 0,
    "available" INTEGER NOT NULL,
    "held" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingDecision" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "decisionTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pricingMode" TEXT NOT NULL,
    "pricesBefore" JSONB,
    "pricesAfter" JSONB,
    "expectedNetRevenue" DOUBLE PRECISION NOT NULL,
    "revenueVariance" DOUBLE PRECISION,
    "confidenceLow" DOUBLE PRECISION,
    "confidenceHigh" DOUBLE PRECISION,
    "triggerReason" TEXT,
    "computationMs" INTEGER,
    "searchIntensityIndex" DOUBLE PRECISION,
    "conversionProbability" DOUBLE PRECISION,

    CONSTRAINT "PricingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomHold" (
    "id" TEXT NOT NULL,
    "holdId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "roomTypeId" TEXT NOT NULL,
    "ratePlanId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "searchId" TEXT,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "los" INTEGER NOT NULL,
    "adults" INTEGER NOT NULL DEFAULT 2,
    "children" INTEGER NOT NULL DEFAULT 0,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "propertyId" TEXT,
    "arrivalDate" TIMESTAMP(3),
    "sessionId" TEXT,
    "correlationId" TEXT,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT,

    CONSTRAINT "BookingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeatureStore" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "searchIntensityIndex" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "priceCheckFrequency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "geoDemandSpikeIndex" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "cartAbandonmentRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "cancellationVelocityIndex" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "pickupPaceIndex" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "competitorPriceIndex" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "conversionProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeatureStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionScore" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "propertyId" TEXT,
    "arrivalDate" TIMESTAMP(3),
    "roomType" TEXT,
    "deviceType" TEXT,
    "geoCountry" TEXT,
    "priceOffered" DOUBLE PRECISION,
    "searchDepth" INTEGER NOT NULL DEFAULT 0,
    "priceViews" INTEGER NOT NULL DEFAULT 0,
    "timeOnPageSeconds" INTEGER NOT NULL DEFAULT 0,
    "referrer" TEXT,
    "hasPromoCode" BOOLEAN NOT NULL DEFAULT false,
    "conversionProbability" DOUBLE PRECISION NOT NULL DEFAULT 0.1,
    "intentTier" TEXT NOT NULL DEFAULT 'low',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_propertyId_key" ON "Property"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomType_propertyId_roomTypeCode_key" ON "RoomType"("propertyId", "roomTypeCode");

-- CreateIndex
CREATE UNIQUE INDEX "RatePlan_propertyId_ratePlanCode_key" ON "RatePlan"("propertyId", "ratePlanCode");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_propertyId_code_key" ON "Amenity"("propertyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "RoomAmenity_roomTypeId_amenityId_key" ON "RoomAmenity"("roomTypeId", "amenityId");

-- CreateIndex
CREATE UNIQUE INDEX "Addon_propertyId_code_key" ON "Addon"("propertyId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingId_key" ON "Booking"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingAddon_bookingId_addonId_key" ON "BookingAddon"("bookingId", "addonId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryDaily_propertyId_arrivalDate_roomTypeId_key" ON "InventoryDaily"("propertyId", "arrivalDate", "roomTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomHold_holdId_key" ON "RoomHold"("holdId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingEvent_eventId_key" ON "BookingEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "FeatureStore_propertyId_arrivalDate_key" ON "FeatureStore"("propertyId", "arrivalDate");

-- CreateIndex
CREATE UNIQUE INDEX "SessionScore_sessionId_key" ON "SessionScore"("sessionId");

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RatePlan" ADD CONSTRAINT "RatePlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amenity" ADD CONSTRAINT "Amenity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAmenity" ADD CONSTRAINT "RoomAmenity_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAmenity" ADD CONSTRAINT "RoomAmenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "Amenity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Addon" ADD CONSTRAINT "Addon_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_ratePlanId_fkey" FOREIGN KEY ("ratePlanId") REFERENCES "RatePlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddon" ADD CONSTRAINT "BookingAddon_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDaily" ADD CONSTRAINT "InventoryDaily_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryDaily" ADD CONSTRAINT "InventoryDaily_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingDecision" ADD CONSTRAINT "PricingDecision_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingEvent" ADD CONSTRAINT "BookingEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;
