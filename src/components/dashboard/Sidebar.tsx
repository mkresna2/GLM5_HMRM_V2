'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useDashboardStore, type DashboardNavSection } from '@/store/booking-store';
import {
  LayoutDashboard,
  DollarSign,
  Calendar,
  BedDouble,
  BarChart3,
  Users,
  CreditCard,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  Settings,
  HelpCircle,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  id: DashboardNavSection;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  children?: { id: DashboardNavSection; title: string }[];
}

const mainNavItems: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: 'pricing',
    title: 'Pricing',
    icon: <DollarSign className="h-4 w-4" />,
    badge: '3',
  },
  {
    id: 'inventory',
    title: 'Inventory',
    icon: <BedDouble className="h-4 w-4" />,
  },
  {
    id: 'bookings',
    title: 'Bookings',
    icon: <Calendar className="h-4 w-4" />,
    badge: '12',
  },
  {
    id: 'analytics-revenue',
    title: 'Analytics',
    icon: <BarChart3 className="h-4 w-4" />,
    children: [
      { id: 'analytics-revenue', title: 'Revenue' },
      { id: 'analytics-occupancy', title: 'Occupancy' },
      { id: 'analytics-channels', title: 'Channels' },
    ],
  },
];

const managementNavItems: NavItem[] = [
  {
    id: 'channels',
    title: 'Channels',
    icon: <Users className="h-4 w-4" />,
  },
  {
    id: 'rates',
    title: 'Rates',
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    id: 'reports',
    title: 'Reports',
    icon: <FileText className="h-4 w-4" />,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>('Analytics');
  
  const { pricingMode, setPricingMode, activeNavSection, setActiveNavSection } = useDashboardStore();

  const handleNavClick = (item: NavItem) => {
    if (item.children) {
      setExpandedItem(expandedItem === item.title ? null : item.title);
    } else {
      setActiveNavSection(item.id);
    }
  };

  const handleChildClick = (childId: DashboardNavSection) => {
    setActiveNavSection(childId);
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="font-semibold text-white">RevenueOS</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-6 px-3">
          {/* Main Navigation */}
          <div className="space-y-1">
            {!collapsed && (
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 mb-2 block">
                Main
              </span>
            )}
            {mainNavItems.map((item) => {
              const isActive = activeNavSection === item.id || 
                (item.children?.some(c => c.id === activeNavSection));
              
              return (
                <div key={item.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800",
                      isActive && "bg-teal-600/20 text-teal-400 hover:text-teal-300 hover:bg-teal-600/30",
                      collapsed && "justify-center px-2"
                    )}
                    onClick={() => handleNavClick(item)}
                  >
                    {item.icon}
                    {!collapsed && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="ml-auto bg-teal-600/30 text-teal-300">
                            {item.badge}
                          </Badge>
                        )}
                        {item.children && (
                          <ChevronDown className={cn(
                            "h-4 w-4 ml-auto transition-transform",
                            expandedItem === item.title && "rotate-180"
                          )} />
                        )}
                      </>
                    )}
                  </Button>
                  
                  {/* Children */}
                  {!collapsed && item.children && expandedItem === item.title && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <Button
                          key={child.id}
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "w-full justify-start",
                            activeNavSection === child.id 
                              ? "text-teal-400 bg-teal-600/10" 
                              : "text-slate-400 hover:text-white hover:bg-slate-800"
                          )}
                          onClick={() => handleChildClick(child.id)}
                        >
                          {child.title}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Management Section */}
          <div className="space-y-1">
            {!collapsed && (
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 mb-2 block">
                Management
              </span>
            )}
            {managementNavItems.map((item) => {
              const isActive = activeNavSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800",
                    isActive && "bg-teal-600/20 text-teal-400 hover:text-teal-300 hover:bg-teal-600/30",
                    collapsed && "justify-center px-2"
                  )}
                  onClick={() => setActiveNavSection(item.id)}
                >
                  {item.icon}
                  {!collapsed && <span className="ml-3">{item.title}</span>}
                </Button>
              );
            })}
          </div>
          
          {/* Pricing Mode Selector */}
          {!collapsed && (
            <div className="pt-4 border-t border-slate-800">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider px-3 mb-2 block">
                Pricing Mode
              </span>
              <div className="space-y-1">
                {['ML_ONLY', 'ML_CONTROL_VARIATE', 'FULL_MC'].map((mode) => (
                  <Button
                    key={mode}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "w-full justify-start text-xs",
                      pricingMode === mode 
                        ? "bg-teal-600/20 text-teal-400" 
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                    onClick={() => setPricingMode(mode as 'ML_ONLY' | 'ML_CONTROL_VARIATE' | 'FULL_MC')}
                  >
                    {mode.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800",
            activeNavSection === 'settings' && "bg-teal-600/20 text-teal-400",
            collapsed && "justify-center px-2"
          )}
          onClick={() => setActiveNavSection('settings')}
        >
          <Settings className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Settings</span>}
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800",
            collapsed && "justify-center px-2"
          )}
        >
          <HelpCircle className="h-4 w-4" />
          {!collapsed && <span className="ml-3">Help & Support</span>}
        </Button>
      </div>
    </div>
  );
}
