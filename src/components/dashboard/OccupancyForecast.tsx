'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { useDashboardStore } from '@/store/booking-store';
import { getDashboardData } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { format, addDays, subDays, isToday } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { Activity, TrendingUp } from 'lucide-react';

const chartConfig = {
  historical: {
    label: 'Historical',
    color: '#64748b',
  },
  forecast: {
    label: 'Forecast',
    color: '#14b8a6',
  },
  confidenceHigh: {
    label: 'Upper Bound',
    color: '#99f6e4',
  },
  confidenceLow: {
    label: 'Lower Bound',
    color: '#99f6e4',
  },
};

interface OccupancyData {
  date: string;
  dateFull: Date;
  historical: number | null;
  forecast: number | null;
  confidenceHigh: number | null;
  confidenceLow: number | null;
  isHistorical: boolean;
}

function generateOccupancyData(): OccupancyData[] {
  const today = new Date();
  const data: OccupancyData[] = [];
  
  // Historical data (past 7 days)
  for (let i = 7; i >= 1; i--) {
    const date = subDays(today, i);
    const occupancy = Math.floor(Math.random() * 30 + 50);
    data.push({
      date: format(date, 'MMM d'),
      dateFull: date,
      historical: occupancy,
      forecast: null,
      confidenceHigh: null,
      confidenceLow: null,
      isHistorical: true,
    });
  }
  
  // Today
  const todayOcc = Math.floor(Math.random() * 20 + 60);
  data.push({
    date: format(today, 'MMM d'),
    dateFull: today,
    historical: todayOcc,
    forecast: todayOcc,
    confidenceHigh: todayOcc,
    confidenceLow: todayOcc,
    isHistorical: false,
  });
  
  // Forecast (next 14 days)
  for (let i = 1; i <= 14; i++) {
    const date = addDays(today, i);
    const forecast = Math.floor(Math.random() * 30 + 50);
    const confidence = Math.floor(Math.random() * 10 + 5);
    data.push({
      date: format(date, 'MMM d'),
      dateFull: date,
      historical: null,
      forecast,
      confidenceHigh: Math.min(100, forecast + confidence),
      confidenceLow: Math.max(0, forecast - confidence),
      isHistorical: false,
    });
  }
  
  return data;
}

export function OccupancyForecast() {
  const { selectedPropertyId } = useDashboardStore();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedPropertyId],
    queryFn: () => getDashboardData(selectedPropertyId),
  });
  
  const chartData = generateOccupancyData();
  const todayIndex = chartData.findIndex(d => isToday(d.dateFull));
  
  // Calculate key metrics
  const avgHistorical = chartData
    .filter(d => d.historical !== null)
    .reduce((sum, d) => sum + (d.historical || 0), 0) / 7;
  const avgForecast = chartData
    .filter(d => d.forecast !== null && !d.isHistorical)
    .reduce((sum, d) => sum + (d.forecast || 0), 0) / 14;
  const peakForecast = Math.max(...chartData.filter(d => d.forecast !== null).map(d => d.forecast || 0));
  const peakDate = chartData.find(d => d.forecast === peakForecast)?.date;
  
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="h-5 w-5 text-teal-500" />
            Occupancy Forecast
          </CardTitle>
          <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
            21 Days
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#99f6e4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#99f6e4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              domain={[0, 100]}
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const data = payload[0]?.payload as OccupancyData;
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 shadow-lg">
                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-2">{label}</div>
                    {data.isHistorical ? (
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        Occupancy: <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{data.historical}%</span>
                      </div>
                    ) : (
                      <div className="space-y-1 text-sm">
                        <div className="text-slate-600 dark:text-slate-400">
                          Forecast: <span className="font-mono font-medium text-teal-600 dark:text-teal-400">{data.forecast}%</span>
                        </div>
                        <div className="text-slate-500 dark:text-slate-500">
                          Range: <span className="font-mono">{data.confidenceLow}% - {data.confidenceHigh}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }}
            />
            
            {/* Confidence band */}
            <Area
              type="monotone"
              dataKey="confidenceHigh"
              stroke="none"
              fill="url(#colorConfidence)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="confidenceLow"
              stroke="none"
              fill="hsl(var(--background))"
              fillOpacity={1}
            />
            
            {/* Historical area */}
            <Area
              type="monotone"
              dataKey="historical"
              stroke="#64748b"
              strokeWidth={2}
              fill="url(#colorHistorical)"
              fillOpacity={1}
              dot={false}
            />
            
            {/* Forecast area */}
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#14b8a6"
              strokeWidth={2}
              fill="url(#colorForecast)"
              fillOpacity={1}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload.isHistorical) return null;
                return (
                  <circle 
                    cx={cx} 
                    cy={cy} 
                    r={3} 
                    fill="#14b8a6" 
                    stroke="hsl(var(--background))" 
                    strokeWidth={1}
                  />
                );
              }}
            />
            
            {/* Today reference line */}
            <ReferenceLine 
              x={chartData[todayIndex]?.date} 
              stroke="#14b8a6" 
              strokeDasharray="5 5"
              label={{ 
                value: 'Today', 
                position: 'top',
                fill: '#14b8a6',
                fontSize: 10,
              }}
            />
          </AreaChart>
        </ChartContainer>
        
        {/* Metrics summary */}
        <div className="mt-4 grid grid-cols-4 gap-4">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <div className="text-xs text-slate-500 dark:text-slate-400">Avg Historical</div>
            <div className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              {avgHistorical.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
            <div className="text-xs text-teal-600 dark:text-teal-400">Avg Forecast</div>
            <div className="text-lg font-semibold text-teal-700 dark:text-teal-300">
              {avgForecast.toFixed(0)}%
            </div>
          </div>
          <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
            <div className="text-xs text-emerald-600 dark:text-emerald-400">Peak Day</div>
            <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
              {peakDate}
            </div>
          </div>
          <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-xs text-amber-600 dark:text-amber-400">Peak Occupancy</div>
            <div className="text-lg font-semibold text-amber-700 dark:text-amber-300">
              {peakForecast}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
