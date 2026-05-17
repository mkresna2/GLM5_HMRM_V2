'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Users, 
  CreditCard, 
  FileText, 
  BedDouble,
  Download,
  Globe,
  TrendingUp,
  Calendar,
  DollarSign,
  XCircle,
  Loader2,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Plus,
  Trash2,
  Settings,
  Clock,
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { format as formatDate, subDays } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

const COLORS = ['#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#10b981'];

interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  hoverColor: string;
}

const reportConfigs: ReportConfig[] = [
  { id: 'revenue', name: 'Revenue Report', description: 'Daily, weekly, monthly revenue', icon: DollarSign, color: 'text-teal-600', bgColor: 'bg-teal-100', hoverColor: 'hover:border-teal-300' },
  { id: 'occupancy', name: 'Occupancy Report', description: 'Room utilization metrics', icon: BedDouble, color: 'text-amber-600', bgColor: 'bg-amber-100', hoverColor: 'hover:border-amber-300' },
  { id: 'guest', name: 'Guest Report', description: 'Guest demographics & behavior', icon: Users, color: 'text-purple-600', bgColor: 'bg-purple-100', hoverColor: 'hover:border-purple-300' },
  { id: 'channel', name: 'Channel Report', description: 'Channel performance analysis', icon: Globe, color: 'text-emerald-600', bgColor: 'bg-emerald-100', hoverColor: 'hover:border-emerald-300' },
  { id: 'cancellation', name: 'Cancellation Report', description: 'Cancellation patterns', icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', hoverColor: 'hover:border-red-300' },
  { id: 'custom', name: 'Custom Report', description: 'Build your own report', icon: FileText, color: 'text-stone-600', bgColor: 'bg-stone-100', hoverColor: 'hover:border-stone-400' },
];

interface ReportData {
  success: boolean;
  reportType: string;
  generatedAt: string;
  data: Record<string, unknown>;
}

export function ReportsView() {
  const [selectedReport, setSelectedReport] = useState<string>('revenue');
  const [dateRange, setDateRange] = useState('30d');
  const [format, setFormat] = useState('csv');
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ReportData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState(formatDate(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState(formatDate(new Date(), 'yyyy-MM-dd'));
  
  // Custom report builder state
  const [customMetrics, setCustomMetrics] = useState<string[]>(['revenue', 'bookings']);
  const [customDimensions, setCustomDimensions] = useState<string[]>(['date']);
  const [customFilters, setCustomFilters] = useState<{field: string; operator: string; value: string}[]>([]);
  const [customPreviewLoading, setCustomPreviewLoading] = useState(false);
  const [customPreviewData, setCustomPreviewData] = useState<Record<string, unknown>[] | null>(null);

  const availableMetrics = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'occupancy', label: 'Occupancy', icon: BedDouble },
    { id: 'adr', label: 'Avg Daily Rate', icon: TrendingUp },
    { id: 'guests', label: 'Guest Count', icon: Users },
    { id: 'los', label: 'Length of Stay', icon: Clock },
    { id: 'commission', label: 'Commission', icon: CreditCard },
    { id: 'cancellation', label: 'Cancellations', icon: XCircle },
  ];

  const availableDimensions = [
    { id: 'date', label: 'Date' },
    { id: 'channel', label: 'Channel' },
    { id: 'roomType', label: 'Room Type' },
    { id: 'country', label: 'Country' },
    { id: 'status', label: 'Status' },
  ];

  const filterFields = [
    { id: 'channel', label: 'Channel', operators: ['equals', 'not_equals'] },
    { id: 'roomType', label: 'Room Type', operators: ['equals', 'not_equals'] },
    { id: 'status', label: 'Status', operators: ['equals', 'not_equals'] },
    { id: 'revenue', label: 'Revenue', operators: ['greater_than', 'less_than', 'equals'] },
    { id: 'los', label: 'Length of Stay', operators: ['greater_than', 'less_than', 'equals'] },
  ];

  const addFilter = () => {
    setCustomFilters([...customFilters, { field: 'channel', operator: 'equals', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setCustomFilters(customFilters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: 'field' | 'operator' | 'value', value: string) => {
    const newFilters = [...customFilters];
    newFilters[index][key] = value;
    setCustomFilters(newFilters);
  };

  const toggleMetric = (metricId: string) => {
    setCustomMetrics(prev => 
      prev.includes(metricId) 
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const toggleDimension = (dimensionId: string) => {
    setCustomDimensions(prev => 
      prev.includes(dimensionId) 
        ? prev.filter(d => d !== dimensionId)
        : [...prev, dimensionId]
    );
  };

  const generateCustomReport = async () => {
    setCustomPreviewLoading(true);
    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: customMetrics,
          dimensions: customDimensions,
          filters: customFilters,
          startDate: customStartDate,
          endDate: customEndDate,
          propertyId: 'H001',
        }),
      });
      const data = await response.json();
      if (data.success) {
        setCustomPreviewData(data.data);
      }
    } catch (error) {
      console.error('Failed to generate custom report:', error);
      // Fallback to mock data
      setCustomPreviewData(generateMockCustomData());
    } finally {
      setCustomPreviewLoading(false);
    }
  };

  const generateMockCustomData = () => {
    const data = [];
    const channels = ['direct', 'booking', 'expedia'];
    const roomTypes = ['STD', 'DLX', 'STE'];
    const countries = ['AU', 'SG', 'JP', 'KR', 'CN', 'UK', 'US'];
    const statuses = ['confirmed', 'checked_in', 'cancelled'];
    
    const baseDate = new Date(customStartDate);
    const endDate = new Date(customEndDate);
    const daysDiff = Math.ceil((endDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // If grouping by channel, generate data per channel
    if (customDimensions.includes('channel') && !customDimensions.includes('date')) {
      channels.forEach(channel => {
        const row: Record<string, unknown> = { channel };
        
        if (customDimensions.includes('roomType')) {
          roomTypes.forEach(roomType => {
            const subRow = { ...row, roomType };
            addMetricsToRow(subRow);
            data.push(subRow);
          });
        } else {
          addMetricsToRow(row);
          data.push(row);
        }
      });
      return data;
    }
    
    // If grouping by date
    for (let i = 0; i <= Math.min(daysDiff, 30); i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      
      // If grouping by channel and date, create a row for each channel per date
      if (customDimensions.includes('channel')) {
        channels.forEach(channel => {
          const row: Record<string, unknown> = {};
          
          if (customDimensions.includes('date')) {
            row.date = formatDate(date, 'yyyy-MM-dd');
          }
          row.channel = channel;
          
          if (customDimensions.includes('roomType')) {
            row.roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          }
          if (customDimensions.includes('country')) {
            row.country = countries[Math.floor(Math.random() * countries.length)];
          }
          if (customDimensions.includes('status')) {
            row.status = statuses[Math.floor(Math.random() * statuses.length)];
          }
          
          addMetricsToRow(row);
          data.push(row);
        });
      } else {
        const row: Record<string, unknown> = {};
        
        if (customDimensions.includes('date')) {
          row.date = formatDate(date, 'yyyy-MM-dd');
        }
        if (customDimensions.includes('roomType')) {
          row.roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
        }
        if (customDimensions.includes('country')) {
          row.country = countries[Math.floor(Math.random() * countries.length)];
        }
        if (customDimensions.includes('status')) {
          row.status = statuses[Math.floor(Math.random() * statuses.length)];
        }
        
        addMetricsToRow(row);
        data.push(row);
      }
    }
    return data;
    
    function addMetricsToRow(row: Record<string, unknown>) {
      if (customMetrics.includes('revenue')) {
        row.revenue = Math.round(3000 + Math.random() * 5000);
      }
      if (customMetrics.includes('bookings')) {
        row.bookings = Math.floor(5 + Math.random() * 10);
      }
      if (customMetrics.includes('occupancy')) {
        row.occupancy = (0.5 + Math.random() * 0.4).toFixed(2);
      }
      if (customMetrics.includes('adr')) {
        row.adr = Math.round(200 + Math.random() * 150);
      }
      if (customMetrics.includes('guests')) {
        row.guests = Math.floor(8 + Math.random() * 15);
      }
      if (customMetrics.includes('los')) {
        row.los = (2 + Math.random() * 3).toFixed(1);
      }
      if (customMetrics.includes('commission')) {
        row.commission = Math.round(200 + Math.random() * 400);
      }
      if (customMetrics.includes('cancellation')) {
        row.cancellations = Math.floor(Math.random() * 2);
      }
    }
  };

  const downloadCustomReport = () => {
    if (!customPreviewData) return;
    
    const headers = [...customDimensions, ...customMetrics];
    const csvContent = [
      headers.join(','),
      ...customPreviewData.map(row => 
        headers.map(h => {
          const val = row[h];
          if (typeof val === 'string' && val.includes(',')) return `"${val}"`;
          return val ?? '';
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `custom_report_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Generate preview when custom report is selected
  useEffect(() => {
    if (selectedReport === 'custom' && customMetrics.length > 0) {
      generateCustomReport();
    }
  }, [selectedReport, customMetrics, customDimensions, customStartDate, customEndDate]);

  const getDateRangeParam = useCallback(() => {
    if (dateRange === 'custom') {
      return `${customStartDate},${customEndDate}`;
    }
    return dateRange;
  }, [dateRange, customStartDate, customEndDate]);

  const fetchReportPreview = useCallback(async (reportType: string) => {
    setPreviewLoading(true);
    try {
      const rangeParam = getDateRangeParam();
      const response = await fetch(`/api/reports?type=${reportType}&dateRange=${rangeParam}&format=json&propertyId=H001`);
      const data = await response.json();
      if (data.success) {
        setPreviewData(data);
      }
    } catch (error) {
      console.error('Failed to fetch report preview:', error);
    } finally {
      setPreviewLoading(false);
    }
  }, [getDateRangeParam]);

  // Fetch preview when date range changes
  useEffect(() => {
    if (selectedReport !== 'custom') {
      fetchReportPreview(selectedReport);
    }
  }, [dateRange, customStartDate, customEndDate, selectedReport, fetchReportPreview]);

  const handleReportSelect = (reportId: string) => {
    setSelectedReport(reportId);
    if (reportId !== 'custom') {
      fetchReportPreview(reportId);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const rangeParam = getDateRangeParam();
      const response = await fetch(`/api/reports?type=${selectedReport}&dateRange=${rangeParam}&format=${format}&propertyId=H001`);
      
      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        // For JSON, download as file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderReportPreview = () => {
    if (!previewData) return null;
    
    const { data } = previewData;
    const summary = data.summary as Record<string, number> | undefined;
    const daily = data.daily as Array<Record<string, number | string>> | undefined;

    switch (selectedReport) {
      case 'revenue':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Gross Revenue</p>
                  <p className="text-2xl font-bold">${((summary?.totalGrossRevenue || 0) / 1000).toFixed(1)}K</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Net Revenue</p>
                  <p className="text-2xl font-bold">${((summary?.totalNetRevenue || 0) / 1000).toFixed(1)}K</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Bookings</p>
                  <p className="text-2xl font-bold">{summary?.totalBookings || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Avg Daily Rate</p>
                  <p className="text-2xl font-bold">${(summary?.avgDailyRate || 0).toFixed(0)}</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Revenue Chart */}
            {daily && daily.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={daily.slice(-14)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="date" stroke="#737373" fontSize={12} tickFormatter={(v) => v.slice(5)} />
                        <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `$${v/1000}K`} />
                        <Tooltip formatter={(value: number) => [`$${value.toFixed(0)}`, '']} />
                        <Bar dataKey="grossRevenue" fill="#14b8a6" name="Gross Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'occupancy':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Avg Occupancy</p>
                  <p className="text-2xl font-bold">{((summary?.avgOccupancy || 0) * 100).toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Peak Occupancy</p>
                  <p className="text-2xl font-bold">{((summary?.peakOccupancy || 0) * 100).toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Low Occupancy</p>
                  <p className="text-2xl font-bold">{((summary?.lowOccupancy || 0) * 100).toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Room Nights</p>
                  <p className="text-2xl font-bold">{summary?.totalRoomNights || 0}</p>
                </CardContent>
              </Card>
            </div>
            
            {daily && daily.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Daily Occupancy Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={daily.slice(-14)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                        <XAxis dataKey="date" stroke="#737373" fontSize={12} tickFormatter={(v) => v.slice(5)} />
                        <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `${(Number(v) * 100).toFixed(0)}%`} domain={[0, 1]} />
                        <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Occupancy']} />
                        <Line type="monotone" dataKey="occupancy" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 'channel':
        const channelData = data.channels as Array<{ channel: string; bookings: number; grossRevenue: number; revenueShare: number; cancellationRate: number }>;
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Channels</p>
                  <p className="text-2xl font-bold">{summary?.totalChannels || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Bookings</p>
                  <p className="text-2xl font-bold">{summary?.totalBookings || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Revenue</p>
                  <p className="text-2xl font-bold">${((summary?.totalRevenue || 0) / 1000).toFixed(1)}K</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Avg Commission</p>
                  <p className="text-2xl font-bold">{((summary?.avgCommissionRate || 0) * 100).toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>
            
            {channelData && channelData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={channelData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            dataKey="grossRevenue"
                            nameKey="channel"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {channelData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`$${(value/1000).toFixed(1)}K`, 'Revenue']} />
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
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Share</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {channelData.map((ch, i) => (
                          <TableRow key={ch.channel}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                {ch.channel}
                              </div>
                            </TableCell>
                            <TableCell>{ch.bookings}</TableCell>
                            <TableCell>${(ch.grossRevenue / 1000).toFixed(1)}K</TableCell>
                            <TableCell>{(ch.revenueShare * 100).toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        );

      case 'guest':
        const countryData = data.byCountry as Array<{ country: string; bookings: number; revenue: number; avgLos: number }>;
        const losDist = data.losDistribution as Array<{ los: number; count: number }>;
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Guests</p>
                  <p className="text-2xl font-bold">{summary?.totalGuests || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Countries</p>
                  <p className="text-2xl font-bold">{summary?.uniqueCountries || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Avg Lead Time</p>
                  <p className="text-2xl font-bold">{(summary?.avgLeadTime || 0).toFixed(0)} days</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Avg Length of Stay</p>
                  <p className="text-2xl font-bold">{(summary?.avgLos || 0).toFixed(1)} nights</p>
                </CardContent>
              </Card>
            </div>
            
            {countryData && countryData.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Countries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Country</TableHead>
                          <TableHead>Bookings</TableHead>
                          <TableHead>Revenue</TableHead>
                          <TableHead>Avg LOS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {countryData.slice(0, 10).map((c) => (
                          <TableRow key={c.country}>
                            <TableCell className="font-medium">{c.country}</TableCell>
                            <TableCell>{c.bookings}</TableCell>
                            <TableCell>${(c.revenue / 1000).toFixed(1)}K</TableCell>
                            <TableCell>{c.avgLos.toFixed(1)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {losDist && losDist.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Length of Stay Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={losDist}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="los" stroke="#737373" fontSize={12} />
                            <YAxis stroke="#737373" fontSize={12} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8b5cf6" name="Bookings" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        );

      case 'cancellation':
        const cancelByChannel = data.byChannel as Array<{ channel: string; total: number; cancelled: number; rate: number }>;
        const cancelByLeadTime = data.byLeadTime as Array<{ range: string; total: number; cancelled: number; rate: number }>;
        
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Total Bookings</p>
                  <p className="text-2xl font-bold">{summary?.totalBookings || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{summary?.cancelledBookings || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Cancellation Rate</p>
                  <p className="text-2xl font-bold">{((summary?.cancellationRate || 0) * 100).toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-stone-500">Lost Revenue</p>
                  <p className="text-2xl font-bold text-red-600">${((summary?.lostRevenue || 0) / 1000).toFixed(1)}K</p>
                </CardContent>
              </Card>
            </div>
            
            {cancelByChannel && cancelByChannel.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cancellation by Channel</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Channel</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Cancelled</TableHead>
                          <TableHead>Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cancelByChannel.map((c) => (
                          <TableRow key={c.channel}>
                            <TableCell className="font-medium">{c.channel}</TableCell>
                            <TableCell>{c.total}</TableCell>
                            <TableCell>{c.cancelled}</TableCell>
                            <TableCell>
                              <Badge variant={c.rate > 0.2 ? 'destructive' : 'outline'}>
                                {(c.rate * 100).toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                {cancelByLeadTime && cancelByLeadTime.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Cancellation by Lead Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={cancelByLeadTime}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                            <XAxis dataKey="range" stroke="#737373" fontSize={12} />
                            <YAxis stroke="#737373" fontSize={12} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                            <Tooltip formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, 'Rate']} />
                            <Bar dataKey="rate" fill="#ef4444" name="Cancellation Rate" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-[300px] text-stone-500">
            Select a report type to preview
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Reports</h2>
          <p className="text-stone-500">Generate and download reports</p>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reportConfigs.map((config) => {
          const Icon = config.icon;
          const isSelected = selectedReport === config.id;
          return (
            <Card 
              key={config.id}
              className={`cursor-pointer transition-all ${config.hoverColor} ${isSelected ? 'ring-2 ring-teal-500 border-teal-300' : ''}`}
              onClick={() => handleReportSelect(config.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-lg ${config.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${config.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{config.name}</h3>
                      {isSelected && <CheckCircle className="h-4 w-4 text-teal-600" />}
                    </div>
                    <p className="text-sm text-stone-500">{config.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Report Generator */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Select parameters and generate your report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Report Type</Label>
              <Select value={selectedReport} onValueChange={handleReportSelect}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {reportConfigs.filter(c => c.id !== 'custom').map((config) => (
                    <SelectItem key={config.id} value={config.id}>{config.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                className="w-full bg-teal-600 hover:bg-teal-700"
                onClick={handleGenerateReport}
                disabled={loading || selectedReport === 'custom'}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Custom Date Range Inputs */}
          {dateRange === 'custom' && (
            <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
              <Label className="text-sm font-medium text-stone-700">Custom Date Range</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <Label className="text-xs text-stone-500">Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-stone-500">End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Preview */}
      {selectedReport !== 'custom' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Report Preview</CardTitle>
                <CardDescription>
                  {previewData ? `Generated at: ${new Date(previewData.generatedAt).toLocaleString()}` : 'Loading preview...'}
                </CardDescription>
              </div>
              {previewData && (
                <Badge variant="outline" className="gap-1">
                  <BarChart3 className="h-3 w-3" />
                  {reportConfigs.find(c => c.id === selectedReport)?.name}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {previewLoading ? (
              <div className="flex items-center justify-center h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : previewData ? (
              renderReportPreview()
            ) : (
              <div className="flex items-center justify-center h-[300px] text-stone-500">
                Click on a report card to see preview
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Custom Report Builder */}
      {selectedReport === 'custom' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configure Report
              </CardTitle>
              <CardDescription>Select metrics and dimensions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-stone-500">Start</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-stone-500">End</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Metrics Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Metrics</Label>
                <ScrollArea className="h-[180px] rounded-md border p-2">
                  <div className="space-y-2">
                    {availableMetrics.map((metric) => {
                      const Icon = metric.icon;
                      const isSelected = customMetrics.includes(metric.id);
                      return (
                        <div 
                          key={metric.id}
                          className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                            isSelected ? 'bg-teal-50 border border-teal-200' : 'hover:bg-stone-50'
                          }`}
                          onClick={() => toggleMetric(metric.id)}
                        >
                          <Checkbox 
                            id={`metric-${metric.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleMetric(metric.id)}
                          />
                          <Icon className="h-4 w-4 text-stone-500" />
                          <label 
                            htmlFor={`metric-${metric.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {metric.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Dimensions Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Group By</Label>
                <ScrollArea className="h-[120px] rounded-md border p-2">
                  <div className="space-y-2">
                    {availableDimensions.map((dim) => {
                      const isSelected = customDimensions.includes(dim.id);
                      return (
                        <div 
                          key={dim.id}
                          className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors ${
                            isSelected ? 'bg-amber-50 border border-amber-200' : 'hover:bg-stone-50'
                          }`}
                          onClick={() => toggleDimension(dim.id)}
                        >
                          <Checkbox 
                            id={`dim-${dim.id}`}
                            checked={isSelected}
                            onCheckedChange={() => toggleDimension(dim.id)}
                          />
                          <label 
                            htmlFor={`dim-${dim.id}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {dim.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Filters</Label>
                  <Button variant="ghost" size="sm" onClick={addFilter} className="h-7 px-2">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {customFilters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-1 p-2 bg-stone-50 rounded-md">
                      <Select
                        value={filter.field}
                        onValueChange={(v) => updateFilter(index, 'field', v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filterFields.map(f => (
                            <SelectItem key={f.id} value={f.id} className="text-xs">{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={filter.operator}
                        onValueChange={(v) => updateFilter(index, 'operator', v)}
                      >
                        <SelectTrigger className="h-8 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals" className="text-xs">equals</SelectItem>
                          <SelectItem value="not_equals" className="text-xs">not equals</SelectItem>
                          <SelectItem value="greater_than" className="text-xs">greater than</SelectItem>
                          <SelectItem value="less_than" className="text-xs">less than</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        className="h-8 text-xs flex-1"
                        placeholder="Value"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeFilter(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {customFilters.length === 0 && (
                    <p className="text-xs text-stone-400 text-center py-2">No filters applied</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-teal-600 hover:bg-teal-700"
                  onClick={generateCustomReport}
                  disabled={customPreviewLoading || customMetrics.length === 0}
                >
                  {customPreviewLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 mr-2" />
                  )}
                  Generate
                </Button>
                <Button 
                  variant="outline"
                  onClick={downloadCustomReport}
                  disabled={!customPreviewData}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Report Preview</CardTitle>
              <CardDescription>
                {customPreviewData 
                  ? `${customPreviewData.length} rows • ${[...customDimensions, ...customMetrics].length} columns`
                  : 'Configure and generate your custom report'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customPreviewLoading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : customPreviewData ? (
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {customDimensions.map(dim => (
                          <TableHead key={dim} className="bg-stone-50 font-semibold">
                            {availableDimensions.find(d => d.id === dim)?.label || dim}
                          </TableHead>
                        ))}
                        {customMetrics.map(metric => (
                          <TableHead key={metric} className="bg-stone-50 font-semibold text-right">
                            {availableMetrics.find(m => m.id === metric)?.label || metric}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customPreviewData.slice(0, 20).map((row, i) => (
                        <TableRow key={i}>
                          {customDimensions.map(dim => (
                            <TableCell key={dim}>{String(row[dim] || '-')}</TableCell>
                          ))}
                          {customMetrics.map(metric => (
                            <TableCell key={metric} className="text-right">
                              {metric === 'revenue' || metric === 'adr' || metric === 'commission'
                                ? `$${Number(row[metric] || 0).toLocaleString()}`
                                : metric === 'occupancy'
                                ? `${Math.round(Number(row[metric] || 0) * 100)}%`
                                : String(row[metric] || '-')
                              }
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {customPreviewData.length > 20 && (
                    <div className="text-center py-4 text-sm text-stone-500">
                      Showing 20 of {customPreviewData.length} rows
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-stone-500">
                  <FileText className="h-16 w-16 mb-4 text-stone-300" />
                  <p className="font-medium">No data to preview</p>
                  <p className="text-sm">Select metrics and click Generate to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
