'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStore } from '@/store/booking-store';
import { getPricingDecisions, applyPricing } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, isToday, isTomorrow, isWeekend } from 'date-fns';
import { ArrowUp, ArrowDown, Minus, Check, X, RefreshCw, Clock, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import type { PricingDecision } from '@/types';
import { toast } from 'sonner';

interface PricingRowData {
  date: Date;
  dayOfWeek: string;
  occupancy: number;
  currentPrices: { STD: number; DLX: number; STE: number };
  recommendedPrices: { STD: number; DLX: number; STE: number };
  expectedRevenue: number;
  confidence: { low: number; high: number };
  pricingMode: string;
  hasDecision: boolean;
  decisionId?: string;
}

function generateMockPricingData(): PricingRowData[] {
  const today = new Date();
  const roomTypes = ['STD', 'DLX', 'STE'];
  const modes = ['ML_ONLY', 'ML_CONTROL_VARIATE', 'FULL_MC'];
  
  return Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, i);
    const occupancy = Math.floor(Math.random() * 40 + 40);
    const currentPrices = {
      STD: Math.floor(80 + Math.random() * 40),
      DLX: Math.floor(120 + Math.random() * 50),
      STE: Math.floor(200 + Math.random() * 80),
    };
    const recommendedPrices = {
      STD: currentPrices.STD + Math.floor(Math.random() * 30 - 15),
      DLX: currentPrices.DLX + Math.floor(Math.random() * 40 - 20),
      STE: currentPrices.STE + Math.floor(Math.random() * 60 - 30),
    };
    
    return {
      date,
      dayOfWeek: format(date, 'EEE'),
      occupancy,
      currentPrices,
      recommendedPrices,
      expectedRevenue: Math.floor(Math.random() * 5000 + 3000),
      confidence: {
        low: Math.floor(Math.random() * 500 + 2800),
        high: Math.floor(Math.random() * 500 + 4500),
      },
      pricingMode: modes[Math.floor(Math.random() * modes.length)],
      hasDecision: Math.random() > 0.3,
      decisionId: Math.random() > 0.3 ? `decision-${i}` : undefined,
    };
  });
}

function PriceChangeIndicator({ current, recommended }: { current: number; recommended: number }) {
  const diff = recommended - current;
  const pctChange = ((diff / current) * 100).toFixed(1);
  
  if (diff > 0) {
    return (
      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
        <ArrowUp className="h-3 w-3" />
        <span className="text-xs">{pctChange}%</span>
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
        <ArrowDown className="h-3 w-3" />
        <span className="text-xs">{pctChange}%</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-slate-400">
      <Minus className="h-3 w-3" />
      <span className="text-xs">0%</span>
    </span>
  );
}

function PriceCell({ 
  current, 
  recommended, 
  showRecommendation = true 
}: { 
  current: number; 
  recommended: number; 
  showRecommendation?: boolean;
}) {
  const diff = recommended - current;
  const bgColor = diff > 0 
    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
    : diff < 0 
    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';
  
  if (!showRecommendation || diff === 0) {
    return (
      <div className="text-center">
        <span className="font-mono text-sm">${current}</span>
      </div>
    );
  }
  
  return (
    <div className={`text-center p-1 rounded border ${bgColor}`}>
      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-sm line-through text-slate-400">${current}</span>
      </div>
      <div className="flex items-center justify-center gap-1">
        <span className="font-mono text-sm font-semibold">${recommended}</span>
        <PriceChangeIndicator current={current} recommended={recommended} />
      </div>
    </div>
  );
}

function PricingModeBadge({ mode }: { mode: string }) {
  const colors: Record<string, string> = {
    ML_ONLY: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    ML_CONTROL_VARIATE: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    FULL_MC: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };
  
  return (
    <Badge variant="outline" className={`text-xs ${colors[mode] || 'bg-slate-100 text-slate-700'}`}>
      {mode.replace('_', ' ')}
    </Badge>
  );
}

export function PricingGrid() {
  const { selectedPropertyId, pricingMode } = useDashboardStore();
  const queryClient = useQueryClient();
  const [applyingId, setApplyingId] = useState<string | null>(null);
  
  const { data: decisions, isLoading, error } = useQuery({
    queryKey: ['pricing-decisions', selectedPropertyId],
    queryFn: () => getPricingDecisions(selectedPropertyId),
  });
  
  const applyMutation = useMutation({
    mutationFn: applyPricing,
    onSuccess: () => {
      toast.success('Pricing applied successfully');
      queryClient.invalidateQueries({ queryKey: ['pricing-decisions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply pricing: ${error.message}`);
    },
    onSettled: () => {
      setApplyingId(null);
    },
  });
  
  const handleApply = (row: PricingRowData) => {
    if (!row.decisionId) return;
    setApplyingId(row.decisionId);
    applyMutation.mutate({
      propertyId: selectedPropertyId,
      arrivalDate: format(row.date, 'yyyy-MM-dd'),
      prices: row.recommendedPrices,
    });
  };
  
  const handleReject = (row: PricingRowData) => {
    toast.info(`Rejected pricing recommendation for ${format(row.date, 'MMM d')}`);
  };
  
  if (error) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardContent className="pt-6">
          <p className="text-red-600 dark:text-red-400 text-center">Failed to load pricing data</p>
        </CardContent>
      </Card>
    );
  }
  
  const pricingData = generateMockPricingData();
  
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Pricing Recommendations
          </CardTitle>
          <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
            Next 14 Days
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Updated 5 min ago
          </Badge>
          <Button variant="outline" size="sm" className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <th className="text-left p-3 font-medium text-slate-600 dark:text-slate-400">Date</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">Occ%</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">STD</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">DLX</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">STE</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">Expected Rev</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">Confidence</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">Mode</th>
                <th className="text-center p-3 font-medium text-slate-600 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="p-3">
                        <Skeleton className="h-5 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                pricingData.map((row, i) => {
                  const isTodayOrTomorrow = isToday(row.date) || isTomorrow(row.date);
                  const isWeekendDay = isWeekend(row.date);
                  
                  return (
                    <tr 
                      key={i} 
                      className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                        isTodayOrTomorrow ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {format(row.date, 'MMM d')}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            {row.dayOfWeek}
                            {isToday(row.date) && <Badge variant="outline" className="h-4 text-xs px-1">Today</Badge>}
                            {isTomorrow(row.date) && <Badge variant="outline" className="h-4 text-xs px-1">Tomorrow</Badge>}
                            {isWeekendDay && <Badge variant="outline" className="h-4 text-xs px-1 bg-amber-50 dark:bg-amber-900/30">Weekend</Badge>}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className={`font-medium ${
                            row.occupancy >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                            row.occupancy >= 60 ? 'text-amber-600 dark:text-amber-400' :
                            'text-slate-600 dark:text-slate-400'
                          }`}>
                            {row.occupancy}%
                          </span>
                          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1">
                            <div 
                              className={`h-full rounded-full ${
                                row.occupancy >= 80 ? 'bg-emerald-500' :
                                row.occupancy >= 60 ? 'bg-amber-500' :
                                'bg-slate-400'
                              }`}
                              style={{ width: `${row.occupancy}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <PriceCell 
                          current={row.currentPrices.STD} 
                          recommended={row.recommendedPrices.STD} 
                        />
                      </td>
                      <td className="p-2">
                        <PriceCell 
                          current={row.currentPrices.DLX} 
                          recommended={row.recommendedPrices.DLX} 
                        />
                      </td>
                      <td className="p-2">
                        <PriceCell 
                          current={row.currentPrices.STE} 
                          recommended={row.recommendedPrices.STE} 
                        />
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <TrendingUp className="h-3 w-3 text-teal-500" />
                          <span className="font-mono font-medium">${row.expectedRevenue.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          ${row.confidence.low.toLocaleString()} - ${row.confidence.high.toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <PricingModeBadge mode={row.pricingMode} />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          {row.hasDecision ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                                onClick={() => handleApply(row)}
                                disabled={applyingId === row.decisionId}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                                onClick={() => handleReject(row)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400">No changes</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500">
          <span className="font-medium">Legend:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700" />
            Price increase recommended
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700" />
            Price decrease recommended
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
            No change
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
