'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  XCircle, 
  CheckCircle,
  Clock,
  Calendar,
  Users,
  DollarSign,
  BedDouble,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { format, addDays } from 'date-fns';

// Mock booking data
const generateBookings = () => {
  const statuses = ['confirmed', 'checked_in', 'cancelled', 'pending'];
  const channels = ['direct', 'booking_com', 'expedia', 'corporate'];
  const roomTypes = ['STD', 'DLX', 'STE'];
  const roomNames: Record<string, string> = {
    'STD': 'Standard Garden View',
    'DLX': 'Deluxe Ocean View',
    'STE': 'Presidential Suite',
  };
  const firstNames = ['James', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'John', 'Emily', 'Robert', 'Jennifer', 'William', 'Anna'];
  const lastNames = ['Wilson', 'Chen', 'Smith', 'Johnson', 'Lee', 'Brown', 'Davis', 'Miller', 'Taylor', 'Anderson'];
  const countries = ['AU', 'SG', 'JP', 'KR', 'CN', 'UK', 'US', 'DE', 'FR', 'NL'];
  
  const bookings = [];
  const today = new Date();
  
  for (let i = 0; i < 50; i++) {
    const arrivalDate = addDays(today, Math.floor(Math.random() * 60) - 15);
    const los = Math.floor(Math.random() * 7) + 1;
    const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
    const basePrice = roomType === 'STD' ? 195 : roomType === 'DLX' ? 275 : 450;
    const grossRevenue = basePrice * los;
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const commissionRate = channel === 'direct' ? 0 : channel === 'corporate' ? 0.10 : 0.18;
    
    bookings.push({
      id: `BK-${format(arrivalDate, 'yyyy')}-${String(i + 1).padStart(6, '0')}`,
      guestName: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
      email: `guest${i}@example.com`,
      phone: `+61${Math.floor(Math.random() * 900000000) + 100000000}`,
      country: countries[Math.floor(Math.random() * countries.length)],
      arrivalDate,
      departureDate: addDays(arrivalDate, los),
      los,
      roomType,
      roomName: roomNames[roomType],
      adults: Math.floor(Math.random() * 2) + 1,
      children: Math.random() < 0.3 ? Math.floor(Math.random() * 2) : 0,
      grossRevenue,
      netRevenue: grossRevenue * (1 - commissionRate),
      channel,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: addDays(arrivalDate, -Math.floor(Math.random() * 45) - 7),
    });
  }
  
  return bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

const mockBookings = generateBookings();

export function BookingsList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<typeof mockBookings[0] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter bookings
  const filteredBookings = mockBookings.filter(booking => {
    const matchesSearch = 
      booking.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || booking.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      confirmed: { variant: 'default', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
      checked_in: { variant: 'default', className: 'bg-teal-100 text-teal-800 hover:bg-teal-100' },
      cancelled: { variant: 'destructive', className: '' },
      pending: { variant: 'secondary', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
    };
    const config = variants[status] || { variant: 'outline', className: '' };
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getChannelBadge = (channel: string) => {
    const channelNames: Record<string, string> = {
      direct: 'Direct',
      booking_com: 'Booking.com',
      expedia: 'Expedia',
      corporate: 'Corporate',
    };
    const colors: Record<string, string> = {
      direct: 'bg-teal-100 text-teal-800',
      booking_com: 'bg-blue-100 text-blue-800',
      expedia: 'bg-yellow-100 text-yellow-800',
      corporate: 'bg-purple-100 text-purple-800',
    };
    return (
      <Badge variant="outline" className={colors[channel]}>
        {channelNames[channel]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Bookings</h2>
          <p className="text-stone-500">Manage and track all reservations</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBookings.filter(b => b.status === 'confirmed').length}</p>
                <p className="text-xs text-stone-500">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <BedDouble className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBookings.filter(b => b.status === 'checked_in').length}</p>
                <p className="text-xs text-stone-500">Checked In</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBookings.filter(b => b.status === 'pending').length}</p>
                <p className="text-xs text-stone-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBookings.filter(b => b.status === 'cancelled').length}</p>
                <p className="text-xs text-stone-500">Cancelled</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search by guest name, booking ID, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="booking_com">Booking.com</SelectItem>
                <SelectItem value="expedia">Expedia</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-sm">{booking.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.guestName}</p>
                        <p className="text-xs text-stone-500">{booking.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{format(booking.arrivalDate, 'MMM d, yyyy')}</p>
                        <p className="text-xs text-stone-500">{booking.los} nights</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.roomType}</p>
                        <p className="text-xs text-stone-500">{booking.adults + booking.children} guests</p>
                      </div>
                    </TableCell>
                    <TableCell>{getChannelBadge(booking.channel)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${booking.grossRevenue.toFixed(0)}</p>
                        <p className="text-xs text-stone-500">Net: ${booking.netRevenue.toFixed(0)}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(booking.status)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                            <DialogDescription>
                              {booking.id}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-4">
                              <h4 className="font-semibold text-stone-800">Guest Information</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-stone-400" />
                                  {booking.guestName}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Mail className="h-4 w-4 text-stone-400" />
                                  {booking.email}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-stone-400" />
                                  {booking.phone}
                                </p>
                                <p className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-stone-400" />
                                  {booking.country}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-4">
                              <h4 className="font-semibold text-stone-800">Stay Details</h4>
                              <div className="space-y-2 text-sm">
                                <p className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-stone-400" />
                                  {format(booking.arrivalDate, 'MMM d')} - {format(booking.departureDate, 'MMM d, yyyy')}
                                </p>
                                <p className="flex items-center gap-2">
                                  <BedDouble className="h-4 w-4 text-stone-400" />
                                  {booking.roomName} ({booking.roomType})
                                </p>
                                <p className="flex items-center gap-2">
                                  <Users className="h-4 w-4 text-stone-400" />
                                  {booking.adults} adults, {booking.children} children
                                </p>
                                <p className="flex items-center gap-2">
                                  <DollarSign className="h-4 w-4 text-stone-400" />
                                  ${booking.grossRevenue.toFixed(0)} total
                                </p>
                              </div>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex justify-between items-center">
                            <div className="flex gap-2">
                              {getStatusBadge(booking.status)}
                              {getChannelBadge(booking.channel)}
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Send Message
                              </Button>
                              {booking.status === 'confirmed' && (
                                <Button variant="destructive" size="sm">
                                  Cancel Booking
                                </Button>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-stone-500">
          Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
