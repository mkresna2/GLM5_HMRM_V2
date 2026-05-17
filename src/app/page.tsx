'use client';

import { useBookingStore } from '@/store/booking-store';
import { RevenueDashboard } from '@/components/dashboard/RevenueDashboard';
import { BookingEngine } from '@/components/booking/BookingEngine';
import { Button } from '@/components/ui/button';
import { Sparkles, BarChart3, BedDouble } from 'lucide-react';

export default function Home() {
  const { currentView, setCurrentView } = useBookingStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-xl text-stone-800">Sakala Resort Bali</h1>
                <p className="text-xs text-stone-500">Premium Beachfront Resort</p>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-stone-100 p-1 rounded-lg">
              <Button
                variant={currentView === 'booking' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('booking')}
                className={`gap-2 ${currentView === 'booking' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-600 hover:text-stone-800'}`}
              >
                <BedDouble className="h-4 w-4" />
                <span className="hidden sm:inline">Booking</span>
              </Button>
              <Button
                variant={currentView === 'dashboard' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCurrentView('dashboard')}
                className={`gap-2 ${currentView === 'dashboard' ? 'bg-white shadow-sm text-stone-800' : 'text-stone-600 hover:text-stone-800'}`}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Revenue Manager</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {currentView === 'dashboard' ? (
          <RevenueDashboard />
        ) : (
          <BookingEngine onToggleView={() => setCurrentView('dashboard')} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-stone-900 text-stone-400 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-stone-300 font-medium">HMRM Engine</span>
            </div>
            <p className="text-sm text-center md:text-right">
              © 2024 Sakala Resort Bali. Powered by Hybrid ML + Monte Carlo Revenue Management System.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
