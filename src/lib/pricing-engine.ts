/**
 * HMRM Pricing Engine (Simplified)
 * 
 * This is a simplified version of the Hybrid Monte Carlo Revenue Management engine.
 * In production, this would use ML models and Monte Carlo simulation for demand forecasting.
 */

import type { RoomType, InventoryDaily, FeatureStore } from '@/types';

// Price ladder constraints
const PRICE_LADDER: number[] = [50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 175, 200, 225, 250, 300, 350, 400, 500];

export interface PricingEngineParams {
  propertyId: string;
  arrivalDate: Date;
  roomTypes: RoomType[];
  inventory: InventoryDaily[];
  features: FeatureStore | null;
  mode: 'ml_only' | 'hybrid' | 'full_mc';
  riskAversionLambda?: number;
}

export interface PricingRecommendation {
  roomTypeCode: string;
  currentPrice: number;
  recommendedPrice: number;
  priceChange: number;
  priceChangePercent: number;
  demandFactor: number;
  expectedDemand: number;
  confidence: number;
  reasoning: string[];
}

export interface PricingEngineResult {
  recommendedPrices: Record<string, number>;
  pricingRecommendations: PricingRecommendation[];
  expectedNetRevenue: number;
  revenueVariance: number;
  confidenceInterval: [number, number];
  optimizationModeUsed: string;
  computationTimeMs: number;
  traceId: string;
}

// Generate a trace ID for logging
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Round to nearest price ladder step
function roundToPriceLadder(price: number, minPrice: number, maxPrice: number): number {
  // Ensure price is within bounds
  const boundedPrice = Math.max(minPrice, Math.min(maxPrice, price));
  
  // Find nearest price on ladder
  let nearestPrice = PRICE_LADDER[0];
  let minDiff = Math.abs(boundedPrice - PRICE_LADDER[0]);
  
  for (const ladderPrice of PRICE_LADDER) {
    const diff = Math.abs(boundedPrice - ladderPrice);
    if (diff < minDiff && ladderPrice >= minPrice && ladderPrice <= maxPrice) {
      minDiff = diff;
      nearestPrice = ladderPrice;
    }
  }
  
  // If no valid ladder price found, return the bounded price
  if (nearestPrice < minPrice || nearestPrice > maxPrice) {
    return Math.round(boundedPrice);
  }
  
  return nearestPrice;
}

// Calculate demand factor from feature signals
function calculateDemandFactor(features: FeatureStore | null): number {
  if (!features) return 1.0;
  
  // Weighted combination of signals
  const weights = {
    searchIntensity: 0.25,
    geoDemand: 0.20,
    pickupPace: 0.15,
    competitorPrice: 0.20,
    cancellationVelocity: -0.10,
    conversionProb: 0.20,
  };
  
  const demandFactor = 
    features.searchIntensityIndex * weights.searchIntensity +
    features.geoDemandSpikeIndex * weights.geoDemand +
    features.pickupPaceIndex * weights.pickupPace +
    features.competitorPriceIndex * weights.competitorPrice +
    (1 / features.cancellationVelocityIndex) * weights.cancellationVelocity +
    (features.conversionProbability * 10) * weights.conversionProb;
  
  return Math.max(0.5, Math.min(2.0, demandFactor));
}

// Calculate occupancy factor from inventory
function calculateOccupancyFactor(inventory: InventoryDaily[], roomTypeId: string): number {
  const relevantInventory = inventory.filter(i => i.roomTypeId === roomTypeId);
  
  if (relevantInventory.length === 0) return 0.5;
  
  const avgOccupancy = relevantInventory.reduce((sum, i) => {
    const occupancyRate = i.otb / i.total;
    return sum + occupancyRate;
  }, 0) / relevantInventory.length;
  
  // Higher occupancy -> higher price
  // Low occupancy (0-30%): discount
  // Medium occupancy (30-70%): neutral
  // High occupancy (70-100%): premium
  if (avgOccupancy < 0.3) return 0.85 + (avgOccupancy * 0.5);
  if (avgOccupancy < 0.7) return 1.0 + ((avgOccupancy - 0.3) * 0.25);
  return 1.1 + ((avgOccupancy - 0.7) * 0.75);
}

// Simulate demand using simplified Monte Carlo
function simulateDemand(
  basePrice: number,
  demandFactor: number,
  occupancyFactor: number,
  mode: 'ml_only' | 'hybrid' | 'full_mc',
  iterations: number = 1000
): { expectedDemand: number; variance: number; confidence: number } {
  
  const samples: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Simplified demand model
    // D = base_demand * demand_factor * occupancy_factor * price_elasticity * noise
    
    const baseDemand = 0.3; // Base booking probability
    const priceElasticity = -0.02 * (basePrice / 100); // Higher price = lower demand
    
    // Add random noise based on mode
    const noiseStd = mode === 'ml_only' ? 0.05 : mode === 'hybrid' ? 0.1 : 0.15;
    const noise = (Math.random() - 0.5) * 2 * noiseStd;
    
    const sample = Math.max(0, Math.min(1,
      baseDemand * demandFactor * occupancyFactor * (1 + priceElasticity) + noise
    ));
    
    samples.push(sample);
  }
  
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
  
  // Sort for confidence interval
  samples.sort((a, b) => a - b);
  const confidence: number = samples[Math.floor(iterations * 0.95)];
  
  return { expectedDemand: mean, variance, confidence };
}

// Main pricing engine function
export async function calculateOptimalPrices(
  params: PricingEngineParams
): Promise<PricingEngineResult> {
  const startTime = Date.now();
  const traceId = generateTraceId();
  
  const { roomTypes, inventory, features, mode, riskAversionLambda = 0.25 } = params;

  // --- MICROSERVICES INTEGRATION ---
  // Try to call the Python Pricing Gateway
  try {
    const PRICING_GATEWAY_URL = process.env.PRICING_GATEWAY_URL || 'http://localhost:8001';
    
    // Map internal types to PRD microservice types
    const roomInventory: Record<string, number> = {};
    const otb: Record<string, number> = {};
    
    roomTypes.forEach(rt => {
      const inv = inventory.find(i => i.roomTypeId === rt.id);
      roomInventory[rt.roomTypeCode] = rt.totalInventory;
      otb[rt.roomTypeCode] = inv?.otb || 0;
    });

    const payload = {
      property_id: params.propertyId,
      arrival_date: params.arrivalDate.toISOString().split('T')[0],
      los: 1, // Simplified for Phase 1
      currency: 'USD',
      room_inventory: roomInventory,
      otb: otb,
      real_time_signals: {
        search_intensity_index: features?.searchIntensityIndex || 1.0,
        conversion_probability: features?.conversionProbability || 0.1,
        competitor_price_index: features?.competitorPriceIndex || 1.0,
        cancellation_velocity_index: features?.cancellationVelocityIndex || 1.0,
        pickup_pace_index: features?.pickupPaceIndex || 1.0,
        geo_demand_spike_index: features?.geoDemandSpikeIndex || 1.0,
      },
      mode: mode,
      risk_aversion_lambda: riskAversionLambda
    };

    const response = await fetch(`${PRICING_GATEWAY_URL}/internal/pricing/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Map back to our internal result format
      const recommendations: PricingRecommendation[] = roomTypes.map(rt => {
        const recommendedPrice = data.recommended_prices[rt.roomTypeCode] || rt.defaultPrice;
        const currentPrice = rt.currentPrice || rt.defaultPrice;
        
        return {
          roomTypeCode: rt.roomTypeCode,
          currentPrice: currentPrice,
          recommendedPrice: recommendedPrice,
          priceChange: recommendedPrice - currentPrice,
          priceChangePercent: ((recommendedPrice - currentPrice) / currentPrice) * 100,
          demandFactor: features?.searchIntensityIndex || 1.0,
          expectedDemand: 0.5, // Mock from gateway response if available
          confidence: 0.8,
          reasoning: [
            `Optimized via HMRM ${data.optimization_mode_used}`,
            `Risk adjustment applied with lambda=${riskAversionLambda}`
          ]
        };
      });

      return {
        recommendedPrices: data.recommended_prices,
        pricingRecommendations: recommendations,
        expectedNetRevenue: data.expected_net_revenue,
        revenueVariance: data.revenue_variance,
        confidenceInterval: data.confidence_interval,
        optimizationModeUsed: data.optimization_mode_used,
        computationTimeMs: Date.now() - startTime,
        traceId: data.trace_id || traceId,
      };
    }
    
    console.warn('Pricing Gateway returned non-OK response, falling back to local engine');
  } catch (error) {
    console.error('Failed to call Pricing Gateway, falling back to local engine:', error);
  }

  // --- LOCAL FALLBACK LOGIC (Original) ---
  const demandFactor = calculateDemandFactor(features);
  
  const recommendations: PricingRecommendation[] = [];
  const recommendedPrices: Record<string, number> = {};
  
  // Determine simulation iterations based on mode
  const iterations = mode === 'ml_only' ? 100 : mode === 'hybrid' ? 500 : 1000;
  
  for (const roomType of roomTypes) {
    const occupancyFactor = calculateOccupancyFactor(inventory, roomType.id);
    
    // Base price from current or default
    const basePrice = roomType.currentPrice || roomType.defaultPrice;
    
    // Run simulation
    const { expectedDemand, variance, confidence } = simulateDemand(
      basePrice,
      demandFactor,
      occupancyFactor,
      mode,
      iterations
    );
    
    // Calculate optimal price
    // Simplified: adjust based on demand signals and constraints
    let optimalPrice = basePrice * demandFactor * occupancyFactor;
    
    // Apply risk aversion adjustment
    const riskAdjustment = 1 - (riskAversionLambda * variance * 0.5);
    optimalPrice *= riskAdjustment;
    
    // Round to price ladder and apply constraints
    const finalPrice = roundToPriceLadder(optimalPrice, roomType.minPrice, roomType.maxPrice);
    
    // Generate reasoning
    const reasoning: string[] = [];
    if (features) {
      if (features.searchIntensityIndex > 1.2) {
        reasoning.push(`High search intensity (${features.searchIntensityIndex.toFixed(2)}) suggests strong demand`);
      }
      if (features.competitorPriceIndex > 1.1) {
        reasoning.push(`Competitor prices are higher, room for price increase`);
      }
      if (occupancyFactor > 1.1) {
        reasoning.push(`High occupancy rate supports premium pricing`);
      }
    }
    if (expectedDemand < 0.2) {
      reasoning.push(`Low expected demand, consider promotional pricing`);
    }
    
    recommendations.push({
      roomTypeCode: roomType.roomTypeCode,
      currentPrice: basePrice,
      recommendedPrice: finalPrice,
      priceChange: finalPrice - basePrice,
      priceChangePercent: ((finalPrice - basePrice) / basePrice) * 100,
      demandFactor: demandFactor * occupancyFactor,
      expectedDemand,
      confidence,
      reasoning,
    });
    
    recommendedPrices[roomType.roomTypeCode] = finalPrice;
  }
  
  // Calculate expected revenue
  let totalExpectedRevenue = 0;
  const revenueSamples: number[] = [];
  
  for (let i = 0; i < 100; i++) {
    let sampleRevenue = 0;
    for (const rec of recommendations) {
      const roomType = roomTypes.find(r => r.roomTypeCode === rec.roomTypeCode);
      if (roomType) {
        const inventoryData = inventory.filter(inv => inv.roomTypeId === roomType.id);
        const availableRooms = inventoryData.reduce((sum, inv) => sum + inv.available, 0) / Math.max(1, inventoryData.length);
        const expectedBookings = rec.expectedDemand * availableRooms * (0.8 + Math.random() * 0.4);
        sampleRevenue += expectedBookings * rec.recommendedPrice;
      }
    }
    revenueSamples.push(sampleRevenue);
  }
  
  totalExpectedRevenue = revenueSamples.reduce((a, b) => a + b, 0) / revenueSamples.length;
  const revenueVariance = revenueSamples.reduce((a, b) => a + Math.pow(b - totalExpectedRevenue, 2), 0) / revenueSamples.length;
  
  // Sort for confidence interval
  revenueSamples.sort((a, b) => a - b);
  const confidenceInterval: [number, number] = [
    revenueSamples[Math.floor(revenueSamples.length * 0.05)],
    revenueSamples[Math.floor(revenueSamples.length * 0.95)],
  ];
  
  const computationTimeMs = Date.now() - startTime;
  
  return {
    recommendedPrices,
    pricingRecommendations: recommendations,
    expectedNetRevenue: totalExpectedRevenue,
    revenueVariance,
    confidenceInterval,
    optimizationModeUsed: mode.toUpperCase() === 'ML_ONLY' ? 'ML_ONLY' : 
                          mode.toUpperCase() === 'HYBRID' ? 'ML_CONTROL_VARIATE' : 'FULL_MC',
    computationTimeMs,
    traceId,
  };
}

// Calculate dynamic price adjustment for booking search
export function calculateDynamicAdjustment(features: FeatureStore | null): number {
  if (!features) return 0;
  
  // Dynamic pricing surcharge based on real-time signals
  let adjustment = 0;
  
  // Search intensity surge pricing
  if (features.searchIntensityIndex > 1.5) {
    adjustment += 0.10; // 10% surge
  } else if (features.searchIntensityIndex > 1.2) {
    adjustment += 0.05; // 5% surge
  }
  
  // High conversion probability = willingness to pay
  if (features.conversionProbability > 0.3) {
    adjustment += 0.05;
  }
  
  return Math.min(0.25, adjustment); // Cap at 25% increase
}

// Generate urgency badge based on inventory and signals
export function generateUrgencyBadge(
  availableRooms: number,
  totalRooms: number,
  searchIntensityIndex: number
): string | null {
  const occupancyRate = 1 - (availableRooms / totalRooms);
  
  if (occupancyRate >= 0.9) {
    return 'only_x_left';
  }
  if (occupancyRate >= 0.75 && searchIntensityIndex > 1.3) {
    return 'high_demand';
  }
  if (searchIntensityIndex > 1.5) {
    return 'trending';
  }
  
  return null;
}
