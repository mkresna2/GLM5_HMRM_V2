'use client';

import { KPICards } from './KPICards';
import { PricingGrid } from './PricingGrid';
import { PricingChart } from './PricingChart';
import { ChannelMixChart } from './ChannelMixChart';
import { OccupancyForecast } from './OccupancyForecast';
import { RevenueOverview } from './RevenueOverview';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BookingsList } from './BookingsList';
import { AnalyticsRevenue, AnalyticsOccupancy, AnalyticsChannels } from './AnalyticsViews';
import { ChannelsManagement, RatesManagement, InventoryView, SettingsView } from './ManagementViews';
import { ReportsView } from './ReportsView';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore } from '@/store/booking-store';
import { 
  LayoutDashboard, 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

function QuickActions() {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
        <Clock className="h-4 w-4" />
        <span>Last sync: 2 minutes ago</span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3" />
          All systems operational
        </Badge>
        <Badge variant="outline" className="gap-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-3 w-3" />
          3 pending approvals
        </Badge>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { pricingMode } = useDashboardStore();
  
  return (
    <>
      {/* Quick Actions / Status Bar */}
      <QuickActions />
      
      {/* KPI Cards */}
      <KPICards />
      
      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="overview" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Pricing
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="forecast" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecast
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-0">
          {/* Top Row: Revenue Overview and Channel Mix */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueOverview />
            </div>
            <div>
              <ChannelMixChart />
            </div>
          </div>
          
          {/* Bottom Row: Occupancy Forecast */}
          <OccupancyForecast />
          
          {/* Pricing Grid */}
          <PricingGrid />
        </TabsContent>
        
        <TabsContent value="pricing" className="space-y-6 mt-0">
          {/* Pricing Chart */}
          <PricingChart />
          
          {/* Pricing Grid */}
          <PricingGrid />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueOverview />
            <ChannelMixChart />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <OccupancyForecast />
            <PricingChart />
          </div>
        </TabsContent>
        
        <TabsContent value="forecast" className="space-y-6 mt-0">
          <OccupancyForecast />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueOverview />
            <PricingChart />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function Footer() {
  const { pricingMode } = useDashboardStore();
  
  return (
    <div className="flex items-center justify-between py-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4">
        <span>Revenue Manager Dashboard v2.0</span>
        <Badge variant="outline" className="text-xs">
          Mode: {pricingMode.replace('_', ' ')}
        </Badge>
      </div>
      <div className="flex items-center gap-4">
        <span>Data refreshed every 5 minutes</span>
        <a href="#" className="text-teal-600 dark:text-teal-400 hover:underline">
          Documentation
        </a>
        <a href="#" className="text-teal-600 dark:text-teal-400 hover:underline">
          Support
        </a>
      </div>
    </div>
  );
}

export function RevenueDashboard() {
  const { activeNavSection } = useDashboardStore();
  
  // Render content based on active navigation section
  const renderContent = () => {
    switch (activeNavSection) {
      case 'bookings':
        return <BookingsList />;
      case 'analytics-revenue':
        return <AnalyticsRevenue />;
      case 'analytics-occupancy':
        return <AnalyticsOccupancy />;
      case 'analytics-channels':
        return <AnalyticsChannels />;
      case 'channels':
        return <ChannelsManagement />;
      case 'rates':
        return <RatesManagement />;
      case 'reports':
        return <ReportsView />;
      case 'inventory':
        return <InventoryView />;
      case 'settings':
        return <SettingsView />;
      case 'dashboard':
      default:
        return <DashboardContent />;
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-64px)] bg-slate-100 dark:bg-slate-950">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Top Bar */}
        <TopBar />
        
        {/* Dashboard Content - Using overflow-y-auto for proper scrolling */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6 min-h-full">
            {renderContent()}
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
}
