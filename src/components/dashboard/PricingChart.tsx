'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { useDashboardStore } from '@/store/booking-store';
import { getPricingDecisions } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { format, addDays } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';
import { useState } from 'react';
import { TrendingUp, Layers } from 'lucide-react';

type ChartView = 'current' | 'recommended' | 'both';

const chartConfig = {
  stdCurrent: {
    label: 'STD Current',
    color: '#14b8a6',
  },
  stdRecommended: {
    label: 'STD Recommended',
    color: '#0d9488',
  },
  dlxCurrent: {
    label: 'DLX Current',
    color: '#f59e0b',
  },
  dlxRecommended: {
    label: 'DLX Recommended',
    color: '#d97706',
  },
  steCurrent: {
    label: 'STE Current',
    color: '#8b5cf6',
  },
  steRecommended: {
    label: 'STE Recommended',
    color: '#7c3aed',
  },
};

function generateChartData() {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const date = addDays(today, i);
    const stdCurrent = Math.floor(80 + Math.random() * 40);
    const dlxCurrent = Math.floor(120 + Math.random() * 50);
    const steCurrent = Math.floor(200 + Math.random() * 80);
    
    return {
      date: format(date, 'MMM d'),
      dateFull: date,
      stdCurrent,
      stdRecommended: stdCurrent + Math.floor(Math.random() * 30 - 15),
      dlxCurrent,
      dlxRecommended: dlxCurrent + Math.floor(Math.random() * 40 - 20),
      steCurrent,
      steRecommended: steCurrent + Math.floor(Math.random() * 60 - 30),
    };
  });
}

export function PricingChart() {
  const { selectedPropertyId } = useDashboardStore();
  const [chartView, setChartView] = useState<ChartView>('both');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['pricing-decisions', selectedPropertyId],
    queryFn: () => getPricingDecisions(selectedPropertyId),
  });
  
  const chartData = generateChartData();
  
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-teal-500" />
            Pricing Trends
          </CardTitle>
          <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
            14 Days
          </Badge>
        </div>
        <ToggleGroup type="single" value={chartView} onValueChange={(value: ChartView) => value && setChartView(value)} className="border rounded-lg">
          <ToggleGroupItem value="current" className="text-xs px-3">
            Current
          </ToggleGroupItem>
          <ToggleGroupItem value="recommended" className="text-xs px-3">
            Recommended
          </ToggleGroupItem>
          <ToggleGroupItem value="both" className="text-xs px-3">
            Both
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value}`}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value, name) => (
                    <span className="font-mono">${value}</span>
                  )}
                />
              }
            />
            
            {/* STD Lines */}
            {(chartView === 'current' || chartView === 'both') && (
              <Line 
                type="monotone" 
                dataKey="stdCurrent" 
                name="stdCurrent"
                stroke="#14b8a6" 
                strokeWidth={2}
                dot={false}
                strokeDasharray={chartView === 'both' ? '5 5' : '0'}
              />
            )}
            {(chartView === 'recommended' || chartView === 'both') && (
              <Line 
                type="monotone" 
                dataKey="stdRecommended" 
                name="stdRecommended"
                stroke="#0d9488" 
                strokeWidth={2}
                dot={false}
              />
            )}
            
            {/* DLX Lines */}
            {(chartView === 'current' || chartView === 'both') && (
              <Line 
                type="monotone" 
                dataKey="dlxCurrent" 
                name="dlxCurrent"
                stroke="#f59e0b" 
                strokeWidth={2}
                dot={false}
                strokeDasharray={chartView === 'both' ? '5 5' : '0'}
              />
            )}
            {(chartView === 'recommended' || chartView === 'both') && (
              <Line 
                type="monotone" 
                dataKey="dlxRecommended" 
                name="dlxRecommended"
                stroke="#d97706" 
                strokeWidth={2}
                dot={false}
              />
            )}
            
            {/* STE Lines */}
            {(chartView === 'current' || chartView === 'both') && (
              <Line 
                type="monotone" 
                dataKey="steCurrent" 
                name="steCurrent"
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={false}
                strokeDasharray={chartView === 'both' ? '5 5' : '0'}
              />
            )}
            {(chartView === 'recommended' || chartView === 'both') && (
              <Line 
                type="monotone" 
                dataKey="steRecommended" 
                name="steRecommended"
                stroke="#7c3aed" 
                strokeWidth={2}
                dot={false}
              />
            )}
            
            <ChartLegend content={<ChartLegendContent />} />
          </LineChart>
        </ChartContainer>
        
        {/* Legend info */}
        <div className="flex items-center gap-6 mt-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-current" style={{ borderStyle: 'dashed' }}></span>
            Current Prices
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-current"></span>
            Recommended Prices
          </span>
          <div className="flex items-center gap-4 ml-auto">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-teal-500"></span>
              STD
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-500"></span>
              DLX
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-violet-500"></span>
              STE
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
