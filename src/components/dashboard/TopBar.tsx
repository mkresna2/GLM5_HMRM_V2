'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useDashboardStore, useBookingStore } from '@/store/booking-store';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  Building2, 
  Bell, 
  Search, 
  Moon, 
  Sun, 
  Menu,
  ChevronDown,
  RefreshCw,
  Download,
  LayoutDashboard,
  ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';

const properties = [
  { id: 'H001', name: 'Grand Resort Bali', rooms: 150 },
  { id: 'H002', name: 'City Hotel Jakarta', rooms: 85 },
  { id: 'H003', name: 'Beach Villa Lombok', rooms: 42 },
];

export function TopBar() {
  const { selectedPropertyId, setSelectedPropertyId, dateRange, setDateRange } = useDashboardStore();
  const { currentView, setCurrentView } = useBookingStore();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  
  const handleDateSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({ start: range.from, end: range.to });
      setIsCalendarOpen(false);
    }
  };
  
  return (
    <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
      {/* Left side */}
      <div className="flex items-center gap-4">
        {/* Property Selector */}
        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
          <SelectTrigger className="w-[220px] bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <Building2 className="h-4 w-4 mr-2 text-slate-500" />
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                <div className="flex items-center gap-2">
                  <span>{property.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {property.rooms} rooms
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* Date Range Picker */}
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-[200px] justify-start bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CalendarIcon className="h-4 w-4 mr-2 text-slate-500" />
              {dateRange.start && dateRange.end ? (
                <span className="text-sm">
                  {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                </span>
              ) : (
                <span className="text-slate-500">Select date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{
                from: dateRange.start || undefined,
                to: dateRange.end || undefined,
              }}
              onSelect={handleDateSelect}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        
        {/* View Toggle */}
        <ToggleGroup 
          type="single" 
          value={currentView} 
          onValueChange={(value: 'booking' | 'dashboard') => value && setCurrentView(value)}
          className="border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <ToggleGroupItem 
            value="booking" 
            className="text-xs px-3 data-[state=on]:bg-teal-50 data-[state=on]:text-teal-700 dark:data-[state=on]:bg-teal-900/30 dark:data-[state=on]:text-teal-300"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Booking
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="dashboard" 
            className="text-xs px-3 data-[state=on]:bg-teal-50 data-[state=on]:text-teal-700 dark:data-[state=on]:bg-teal-900/30 dark:data-[state=on]:text-teal-300"
          >
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <Search className="h-4 w-4" />
        </Button>
        
        {/* Refresh */}
        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        {/* Export */}
        <Button variant="outline" size="sm" className="gap-1 border-slate-200 dark:border-slate-700">
          <Download className="h-3 w-3" />
          Export
        </Button>
        
        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
            3
          </span>
        </Button>
        
        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-medium text-sm">
            RM
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Revenue Manager</div>
            <div className="text-xs text-slate-500">{selectedProperty?.name}</div>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
}
