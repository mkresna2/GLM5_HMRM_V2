'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useDashboardStore } from '@/store/booking-store';
import { getDashboardData } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, subMonths } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, Tooltip, ComposedChart, Line } from 'recharts';
import { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

type Period = '7d' | '30d' | '90d';

const chartConfig = {
  grossRevenue: {
    label: 'Gross Revenue',
    color: '#14b8a6',
  },
  netRevenue: {
    label: 'Net Revenue',
    color: '#0d9488',
  },
  bookings: {
    label: 'Bookings',
    color: '#f59e0b',
  },
};

interface RevenueData {
  date: string;
  grossRevenue: number;
  netRevenue: number;
  bookings: number;
}

function generateRevenueData(period: Period): RevenueData[] {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const today = new Date();
  
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(today, days - i - 1);
    const baseRevenue = 3000 + Math.random() * 4000;
    const commission = Math.random() * 0.15;
    
    return {
      date: format(date, period === '7d' ? 'EEE d' : 'MMM d'),
      grossRevenue: Math.floor(baseRevenue),
      netRevenue: Math.floor(baseRevenue * (1 - commission)),
      bookings: Math.floor(Math.random() * 15 + 5),
    };
  });
}

interface MetricCardProps {
  title: string;
  value: number;
  change: number;
  format: 'currency' | 'number' | 'percent';
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'neutral';
}

function MetricCard({ title, value, change, format, icon, trend }: MetricCardProps) {
  const formatValue = (val: number) => {
    if (format === 'currency') return `$${val.toLocaleString()}`;
    if (format === 'percent') return `${val.toFixed(1)}%`;
    return val.toLocaleString();
  };
  
  const trendColor = trend === 'up' 
    ? 'text-emerald-600 dark:text-emerald-400' 
    : trend === 'down' 
    ? 'text-red-600 dark:text-red-400' 
    : 'text-slate-500';
  
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : TrendingUp;
  
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-500 dark:text-slate-400">{title}</span>
        {icon}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
        {formatValue(value)}
      </div>
      <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor}`}>
        <TrendIcon className="h-3 w-3" />
        <span>{Math.abs(change).toFixed(1)}% vs prev</span>
      </div>
    </div>
  );
}

export function RevenueOverview() {
  const { selectedPropertyId } = useDashboardStore();
  const [period, setPeriod] = useState<Period>('30d');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedPropertyId],
    queryFn: () => getDashboardData(selectedPropertyId),
  });
  
  const chartData = generateRevenueData(period);
  
  const totalGross = chartData.reduce((sum, d) => sum + d.grossRevenue, 0);
  const totalNet = chartData.reduce((sum, d) => sum + d.netRevenue, 0);
  const totalBookings = chartData.reduce((sum, d) => sum + d.bookings, 0);
  const avgDailyRate = totalGross / totalBookings;
  const commissionRate = ((totalGross - totalNet) / totalGross) * 100;
  
  // Calculate comparison period metrics
  const comparisonMultiplier = period === '7d' ? 1 : period === '30d' ? 4 : 12;
  
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-teal-500" />
            Revenue Overview
          </CardTitle>
        </div>
        <ToggleGroup type="single" value={period} onValueChange={(value: Period) => value && setPeriod(value)} className="border rounded-lg">
          <ToggleGroupItem value="7d" className="text-xs px-3">
            7D
          </ToggleGroupItem>
          <ToggleGroupItem value="30d" className="text-xs px-3">
            30D
          </ToggleGroupItem>
          <ToggleGroupItem value="90d" className="text-xs px-3">
            90D
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <MetricCard 
            title="Total Gross Revenue" 
            value={totalGross} 
            change={12.5} 
            format="currency"
            icon={<DollarSign className="h-4 w-4 text-teal-500" />}
            trend="up"
          />
          <MetricCard 
            title="Net Revenue" 
            value={totalNet} 
            change={8.3} 
            format="currency"
            icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            trend="up"
          />
          <MetricCard 
            title="Total Bookings" 
            value={totalBookings} 
            change={-2.1} 
            format="number"
            icon={<Calendar className="h-4 w-4 text-amber-500" />}
            trend="down"
          />
          <MetricCard 
            title="Avg Commission" 
            value={commissionRate} 
            change={-5.2} 
            format="percent"
            icon={<TrendingDown className="h-4 w-4 text-emerald-500" />}
            trend="down"
          />
        </div>
        
        {/* Revenue trend chart */}
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorGrossRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorNetRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              interval={period === '90d' ? 6 : period === '30d' ? 2 : 0}
            />
            <YAxis 
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload as RevenueData;
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">{label}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600 dark:text-slate-400">Gross Revenue</span>
                        <span className="font-mono font-medium text-teal-600 dark:text-teal-400">
                          ${data.grossRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600 dark:text-slate-400">Net Revenue</span>
                        <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                          ${data.netRevenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600 dark:text-slate-400">Bookings</span>
                        <span className="font-mono font-medium text-amber-600 dark:text-amber-400">
                          {data.bookings}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            
            {/* Gross revenue area */}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="grossRevenue"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#colorGrossRevenue)"
              fillOpacity={1}
            />
            
            {/* Net revenue line */}
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="netRevenue"
              stroke="#0d9488"
              strokeWidth={2}
              dot={false}
              strokeDasharray="5 5"
            />
            
            {/* Bookings bars */}
            <Bar
              yAxisId="right"
              dataKey="bookings"
              fill="#f59e0b"
              fillOpacity={0.3}
              barSize={period === '7d' ? 16 : period === '30d' ? 8 : 4}
            />
          </ComposedChart>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-teal-500" />
            Gross Revenue
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4 h-0 border-t-2 border-dashed border-emerald-600"></span>
            Net Revenue
          </span>
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500 opacity-50" />
            Bookings
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
