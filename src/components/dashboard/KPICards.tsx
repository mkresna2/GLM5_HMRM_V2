'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardStore } from '@/store/booking-store';
import { getDashboardData } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus, DollarSign, Percent, Users, Calendar, Target, BarChart3 } from 'lucide-react';
import type { KPIStats } from '@/types';
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts';

interface KPICardProps {
  title: string;
  value: string | number;
  trend: number;
  target: string | number;
  icon: React.ReactNode;
  sparklineData?: number[];
  format?: 'currency' | 'percent' | 'number';
}

function KPICard({ title, value, trend, target, icon, sparklineData, format = 'number' }: KPICardProps) {
  const isPositive = trend > 0;
  const isNeutral = trend === 0;
  
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `$${Number(val).toLocaleString()}`;
    }
    if (format === 'percent') {
      return `${Number(val).toFixed(1)}%`;
    }
    return Number(val).toLocaleString();
  };

  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{formatValue(value)}</div>
            <div className="flex items-center gap-2 text-xs">
              <span className={`flex items-center gap-0.5 ${
                isPositive ? 'text-emerald-600 dark:text-emerald-400' : 
                isNeutral ? 'text-slate-500' : 'text-red-600 dark:text-red-400'
              }`}>
                {isPositive ? <TrendingUp className="h-3 w-3" /> : 
                 isNeutral ? <Minus className="h-3 w-3" /> : 
                 <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-slate-400">vs target: {formatValue(target)}</span>
            </div>
          </div>
          {sparklineData && sparklineData.length > 0 && (
            <div className="h-12 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData.map((v, i) => ({ value: v }))}>
                  <defs>
                    <linearGradient id={`gradient-${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis domain={['auto', 'auto']} hide />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke={isPositive ? '#10b981' : '#ef4444'} 
                    strokeWidth={1.5}
                    fill={`url(#gradient-${title.replace(/\s/g, '')})`} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function KPICardSkeleton() {
  return (
    <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-7 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </CardContent>
    </Card>
  );
}

function generateSparklineData(): number[] {
  return Array.from({ length: 7 }, () => Math.random() * 100 + 50);
}

export function KPICards() {
  const { selectedPropertyId } = useDashboardStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', selectedPropertyId],
    queryFn: () => getDashboardData(selectedPropertyId),
  });

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="col-span-full bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400 text-center">Failed to load KPI data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <KPICardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const kpis: KPIStats = data.kpis;
  
  const kpiCards: KPICardProps[] = [
    {
      title: 'RevPAR',
      value: kpis.revpar.toFixed(2),
      trend: (kpis.revpar / 85 - 1) * 100,
      target: 85,
      icon: <DollarSign className="h-4 w-4" />,
      sparklineData: generateSparklineData(),
      format: 'currency',
    },
    {
      title: 'ADR',
      value: kpis.adr.toFixed(2),
      trend: (kpis.adr / 120 - 1) * 100,
      target: 120,
      icon: <BarChart3 className="h-4 w-4" />,
      sparklineData: generateSparklineData(),
      format: 'currency',
    },
    {
      title: 'Occupancy',
      value: kpis.occupancy.toFixed(1),
      trend: kpis.occupancy - 70,
      target: 70,
      icon: <Percent className="h-4 w-4" />,
      sparklineData: generateSparklineData(),
      format: 'percent',
    },
    {
      title: 'Net Revenue',
      value: kpis.netRevenue,
      trend: (kpis.netRevenue / 50000 - 1) * 100,
      target: 50000,
      icon: <DollarSign className="h-4 w-4" />,
      sparklineData: generateSparklineData(),
      format: 'currency',
    },
    {
      title: 'Direct Share',
      value: kpis.directShare.toFixed(1),
      trend: kpis.directShare - 35,
      target: 35,
      icon: <Users className="h-4 w-4" />,
      sparklineData: generateSparklineData(),
      format: 'percent',
    },
    {
      title: 'Cancellation',
      value: kpis.cancellationRate.toFixed(1),
      trend: 15 - kpis.cancellationRate,
      target: 15,
      icon: <Calendar className="h-4 w-4" />,
      sparklineData: generateSparklineData(),
      format: 'percent',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiCards.map((kpi) => (
        <KPICard key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
