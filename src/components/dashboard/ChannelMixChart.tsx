'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useDashboardStore } from '@/store/booking-store';
import { getDashboardData } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useState } from 'react';
import { PieChart as PieChartIcon, BarChart3, Radio } from 'lucide-react';

type ChartType = 'pie' | 'bar';

const chartConfig = {
  direct: {
    label: 'Direct',
    color: '#14b8a6',
  },
  booking_com: {
    label: 'Booking.com',
    color: '#003580',
  },
  expedia: {
    label: 'Expedia',
    color: '#ffcc00',
  },
  corporate: {
    label: 'Corporate',
    color: '#8b5cf6',
  },
  other: {
    label: 'Other',
    color: '#94a3b8',
  },
};

const COLORS = ['#14b8a6', '#003580', '#ffcc00', '#8b5cf6', '#94a3b8'];

interface ChannelData {
  name: string;
  revenue: number;
  bookings: number;
  percentage: number;
}

function generateChannelData(): ChannelData[] {
  const total = 100;
  const direct = Math.floor(Math.random() * 20 + 25);
  const bookingCom = Math.floor(Math.random() * 15 + 30);
  const expedia = Math.floor(Math.random() * 10 + 15);
  const corporate = Math.floor(Math.random() * 10 + 10);
  const other = total - direct - bookingCom - expedia - corporate;
  
  const totalRevenue = 50000 + Math.random() * 30000;
  
  return [
    { 
      name: 'Direct', 
      revenue: Math.floor(totalRevenue * direct / 100), 
      bookings: Math.floor(direct * 3.5),
      percentage: direct 
    },
    { 
      name: 'Booking.com', 
      revenue: Math.floor(totalRevenue * bookingCom / 100), 
      bookings: Math.floor(bookingCom * 2.8),
      percentage: bookingCom 
    },
    { 
      name: 'Expedia', 
      revenue: Math.floor(totalRevenue * expedia / 100), 
      bookings: Math.floor(expedia * 2.2),
      percentage: expedia 
    },
    { 
      name: 'Corporate', 
      revenue: Math.floor(totalRevenue * corporate / 100), 
      bookings: Math.floor(corporate * 4),
      percentage: corporate 
    },
    { 
      name: 'Other', 
      revenue: Math.floor(totalRevenue * other / 100), 
      bookings: Math.floor(other * 1.5),
      percentage: other 
    },
  ];
}

export function ChannelMixChart() {
  const { selectedPropertyId } = useDashboardStore();
  const [chartType, setChartType] = useState<ChartType>('pie');
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedPropertyId],
    queryFn: () => getDashboardData(selectedPropertyId),
  });
  
  const channelData = generateChannelData();
  const totalBookings = channelData.reduce((sum, ch) => sum + ch.bookings, 0);
  const totalRevenue = channelData.reduce((sum, ch) => sum + ch.revenue, 0);
  
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Radio className="h-5 w-5 text-teal-500" />
            Channel Mix
          </CardTitle>
          <Badge variant="outline" className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
            This Month
          </Badge>
        </div>
        <ToggleGroup type="single" value={chartType} onValueChange={(value: ChartType) => value && setChartType(value)} className="border rounded-lg">
          <ToggleGroupItem value="pie" className="text-xs px-3">
            <PieChartIcon className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="bar" className="text-xs px-3">
            <BarChart3 className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {chartType === 'pie' ? (
          <div className="flex items-center gap-6">
            <ChartContainer config={chartConfig} className="h-[250px] w-[250px]">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={100}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="percentage"
                  nameKey="name"
                  strokeWidth={2}
                  stroke="hsl(var(--background))"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value}%`,
                    name
                  ]}
                />
              </PieChart>
            </ChartContainer>
            
            {/* Legend with details */}
            <div className="flex-1 space-y-3">
              {channelData.map((channel, index) => (
                <div key={channel.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index] }}
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {channel.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-medium text-slate-900 dark:text-slate-100">
                      ${channel.revenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {channel.bookings} bookings
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total</span>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100">
                      ${totalRevenue.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {totalBookings} bookings
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <BarChart data={channelData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis 
                type="number" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `${label}`}
              />
              <Bar 
                dataKey="revenue" 
                radius={[0, 4, 4, 0]}
              >
                {channelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
        
        {/* Channel insights */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Top Channel</div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {channelData.sort((a, b) => b.percentage - a.percentage)[0]?.name}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Direct Share</div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {channelData.find(c => c.name === 'Direct')?.percentage}%
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">OTA Share</div>
              <div className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {(channelData.find(c => c.name === 'Booking.com')?.percentage || 0) + 
                 (channelData.find(c => c.name === 'Expedia')?.percentage || 0)}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
