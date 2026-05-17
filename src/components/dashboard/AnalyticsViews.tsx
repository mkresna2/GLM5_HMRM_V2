'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BedDouble, 
  Users, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
} from 'lucide-react';
import { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';

// Generate mock data
const generateRevenueData = () => {
  const data = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = subDays(today, i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    data.push({
      date: format(date, 'MMM d'),
      fullDate: format(date, 'yyyy-MM-dd'),
      grossRevenue: (isWeekend ? 15000 + Math.random() * 5000 : 12000 + Math.random() * 4000),
      netRevenue: (isWeekend ? 14000 + Math.random() * 4500 : 11000 + Math.random() * 3500),
      bookings: Math.floor((isWeekend ? 25 + Math.random() * 10 : 20 + Math.random() * 8)),
      avgRate: (isWeekend ? 280 + Math.random() * 50 : 250 + Math.random() * 40),
    });
  }
  return data;
};

const generateOccupancyData = () => {
  const data = [];
  const today = new Date();
  for (let i = 30; i >= 0; i--) {
    const date = subDays(today, i);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const baseOccupancy = isWeekend ? 0.85 : 0.65;
    data.push({
      date: format(date, 'MMM d'),
      fullDate: format(date, 'yyyy-MM-dd'),
      occupancy: Math.min(0.98, Math.max(0.3, baseOccupancy + (Math.random() - 0.5) * 0.15)),
      stdOccupancy: Math.min(0.98, Math.max(0.3, baseOccupancy * 0.9 + (Math.random() - 0.5) * 0.1)),
      dlxOccupancy: Math.min(0.98, Math.max(0.3, baseOccupancy * 1.05 + (Math.random() - 0.5) * 0.1)),
      steOccupancy: Math.min(0.98, Math.max(0.3, baseOccupancy * 1.1 + (Math.random() - 0.5) * 0.1)),
    });
  }
  return data;
};

const channelData = [
  { name: 'Direct', value: 42, revenue: 128000, bookings: 156, color: '#14b8a6' },
  { name: 'Booking.com', value: 28, revenue: 85000, bookings: 98, color: '#3b82f6' },
  { name: 'Expedia', value: 18, revenue: 55000, bookings: 67, color: '#f59e0b' },
  { name: 'Corporate', value: 12, revenue: 36000, bookings: 45, color: '#8b5cf6' },
];

const roomTypeRevenue = [
  { roomType: 'STD', revenue: 95000, bookings: 145, avgRate: 195 },
  { roomType: 'DLX', revenue: 142000, bookings: 158, avgRate: 275 },
  { roomType: 'STE', revenue: 67000, bookings: 63, avgRate: 450 },
];

const revenueData = generateRevenueData();
const occupancyData = generateOccupancyData();

export function AnalyticsRevenue() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.netRevenue, 0);
  const totalBookings = revenueData.reduce((sum, d) => sum + d.bookings, 0);
  const avgRate = totalRevenue / totalBookings;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Revenue Analytics</h2>
          <p className="text-stone-500">Track revenue performance and trends</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-stone-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setPeriod(p)}
                className={period === p ? 'bg-white shadow-sm' : ''}
              >
                {p.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Revenue</p>
                <p className="text-2xl font-bold">${(totalRevenue / 1000).toFixed(0)}K</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>+12.5% vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total Bookings</p>
                <p className="text-2xl font-bold">{totalBookings}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>+8.3% vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Average Daily Rate</p>
                <p className="text-2xl font-bold">${avgRate.toFixed(0)}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <BedDouble className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>+3.2% vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">RevPAR</p>
                <p className="text-2xl font-bold">$187</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-red-600">
              <ArrowDownRight className="h-4 w-4" />
              <span>-2.1% vs last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Daily gross and net revenue over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `$${v/1000}K`} />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toFixed(0)}`, '']}
                  labelStyle={{ color: '#1c1917' }}
                />
                <Legend />
                <Area type="monotone" dataKey="grossRevenue" stroke="#14b8a6" fill="url(#colorGross)" name="Gross Revenue" strokeWidth={2} />
                <Area type="monotone" dataKey="netRevenue" stroke="#f59e0b" fill="url(#colorNet)" name="Net Revenue" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Room Type Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Room Type</CardTitle>
            <CardDescription>Performance breakdown by room category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomTypeRevenue} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis type="number" stroke="#737373" fontSize={12} tickFormatter={(v) => `$${v/1000}K`} />
                  <YAxis dataKey="roomType" type="category" stroke="#737373" fontSize={12} />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(0)}`, '']} />
                  <Bar dataKey="revenue" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Volume by Room Type</CardTitle>
            <CardDescription>Number of bookings and average rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {roomTypeRevenue.map((room) => (
                <div key={room.roomType} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-stone-800">{room.roomType}</p>
                    <p className="text-sm text-stone-500">{room.bookings} bookings</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-stone-800">${(room.revenue / 1000).toFixed(0)}K</p>
                    <p className="text-sm text-stone-500">Avg: ${room.avgRate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AnalyticsOccupancy() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const avgOccupancy = occupancyData.reduce((sum, d) => sum + d.occupancy, 0) / occupancyData.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Occupancy Analytics</h2>
          <p className="text-stone-500">Track occupancy rates and patterns</p>
        </div>
        <div className="flex bg-stone-100 rounded-lg p-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPeriod(p)}
              className={period === p ? 'bg-white shadow-sm' : ''}
            >
              {p.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-stone-500">Avg Occupancy</p>
            <p className="text-2xl font-bold">{(avgOccupancy * 100).toFixed(1)}%</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
              <span>+5.2% vs last period</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-stone-500">Peak Occupancy</p>
            <p className="text-2xl font-bold">94.2%</p>
            <p className="text-xs text-stone-500 mt-1">Sat, Dec 14</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-stone-500">Lowest Occupancy</p>
            <p className="text-2xl font-bold">52.8%</p>
            <p className="text-xs text-stone-500 mt-1">Tue, Dec 3</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-stone-500">Weekend Avg</p>
            <p className="text-2xl font-bold">87.3%</p>
            <p className="text-xs text-stone-500 mt-1">+15% vs weekday</p>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Occupancy Trend by Room Type</CardTitle>
          <CardDescription>Daily occupancy rates over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={occupancyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 1]} />
                <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '']} />
                <Legend />
                <Line type="monotone" dataKey="steOccupancy" stroke="#14b8a6" name="Suite" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="dlxOccupancy" stroke="#f59e0b" name="Deluxe" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="stdOccupancy" stroke="#8b5cf6" name="Standard" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function AnalyticsChannels() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Channel Analytics</h2>
          <p className="text-stone-500">Analyze performance by booking channel</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Channel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={channelData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="revenue"
                    nameKey="name"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {channelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${(value / 1000).toFixed(0)}K`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Channel Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {channelData.map((channel) => (
                <div key={channel.name} className="p-4 bg-stone-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: channel.color }} 
                      />
                      <span className="font-medium">{channel.name}</span>
                    </div>
                    <Badge variant="outline">{channel.value}%</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-stone-500">Revenue</p>
                      <p className="font-semibold">${(channel.revenue / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-stone-500">Bookings</p>
                      <p className="font-semibold">{channel.bookings}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Bookings by Channel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="name" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip />
                <Bar dataKey="bookings" fill="#14b8a6" radius={[4, 4, 0, 0]}>
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
