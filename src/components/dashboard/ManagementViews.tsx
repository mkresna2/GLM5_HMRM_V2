'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
} from 'recharts';
import { 
  Users, 
  CreditCard, 
  FileText, 
  Settings, 
  BedDouble,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Link,
  Unlink,
  Check,
  X,
  Globe,
  TrendingUp,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { useState } from 'react';

// Mock channel data
const channels = [
  { id: 'direct', name: 'Direct Website', status: 'active', bookings: 156, revenue: 42800, commission: 0 },
  { id: 'booking_com', name: 'Booking.com', status: 'active', bookings: 98, revenue: 28500, commission: 15 },
  { id: 'expedia', name: 'Expedia', status: 'active', bookings: 67, revenue: 18300, commission: 18 },
  { id: 'agoda', name: 'Agoda', status: 'inactive', bookings: 0, revenue: 0, commission: 12 },
  { id: 'airbnb', name: 'Airbnb', status: 'inactive', bookings: 0, revenue: 0, commission: 3 },
  { id: 'corporate', name: 'Corporate', status: 'active', bookings: 45, revenue: 12500, commission: 10 },
];

const ratePlans = [
  { id: 'BAR', name: 'Best Available Rate', type: 'public', minLos: 1, maxLos: 30, refundable: true, discount: 0, channels: ['direct', 'booking_com', 'expedia'] },
  { id: 'NON_REF', name: 'Non-Refundable', type: 'public', minLos: 1, maxLos: 30, refundable: false, discount: 12, channels: ['direct', 'booking_com'] },
  { id: 'BB', name: 'Bed & Breakfast', type: 'package', minLos: 2, maxLos: 14, refundable: true, discount: 0, channels: ['direct'] },
  { id: 'STAY4', name: 'Stay 4+ Save 15%', type: 'promotion', minLos: 4, maxLos: 30, refundable: true, discount: 15, channels: ['direct', 'booking_com', 'expedia'] },
  { id: 'CORP', name: 'Corporate Rate', type: 'private', minLos: 1, maxLos: 30, refundable: true, discount: 10, channels: ['corporate'] },
];

const inventoryData = [
  { date: 'Dec 15', std: { total: 35, available: 8 }, dlx: { total: 30, available: 5 }, ste: { total: 15, available: 2 } },
  { date: 'Dec 16', std: { total: 35, available: 10 }, dlx: { total: 30, available: 8 }, ste: { total: 15, available: 3 } },
  { date: 'Dec 17', std: { total: 35, available: 5 }, dlx: { total: 30, available: 3 }, ste: { total: 15, available: 1 } },
  { date: 'Dec 18', std: { total: 35, available: 12 }, dlx: { total: 30, available: 10 }, ste: { total: 15, available: 4 } },
  { date: 'Dec 19', std: { total: 35, available: 15 }, dlx: { total: 30, available: 12 }, ste: { total: 15, available: 6 } },
  { date: 'Dec 20', std: { total: 35, available: 3 }, dlx: { total: 30, available: 2 }, ste: { total: 15, available: 0 } },
  { date: 'Dec 21', std: { total: 35, available: 2 }, dlx: { total: 30, available: 1 }, ste: { total: 15, available: 0 } },
];

export function ChannelsManagement() {
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Channel Management</h2>
          <p className="text-stone-500">Manage your distribution channels</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Channel
        </Button>
      </div>

      {/* Channel Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                <Globe className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{channels.filter(c => c.status === 'active').length}</p>
                <p className="text-xs text-stone-500">Active Channels</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{channels.reduce((sum, c) => sum + c.bookings, 0)}</p>
                <p className="text-xs text-stone-500">Total Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(channels.reduce((sum, c) => sum + c.revenue, 0) / 1000).toFixed(0)}K</p>
                <p className="text-xs text-stone-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">$3.2K</p>
                <p className="text-xs text-stone-500">Commission Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channels Table */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Channels</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell className="font-medium">{channel.name}</TableCell>
                  <TableCell>
                    <Badge variant={channel.status === 'active' ? 'default' : 'secondary'}
                      className={channel.status === 'active' ? 'bg-emerald-100 text-emerald-800' : ''}>
                      {channel.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{channel.bookings}</TableCell>
                  <TableCell>${channel.revenue.toLocaleString()}</TableCell>
                  <TableCell>{channel.commission}%</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        {channel.status === 'active' ? <Unlink className="h-4 w-4" /> : <Link className="h-4 w-4" />}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function RatesManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Rate Management</h2>
          <p className="text-stone-500">Configure rate plans and pricing rules</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Rate Plan
        </Button>
      </div>

      {/* Rate Plans */}
      <div className="grid gap-4">
        {ratePlans.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <Badge variant="outline">{plan.type}</Badge>
                    {plan.discount > 0 && (
                      <Badge className="bg-amber-100 text-amber-800">{plan.discount}% off</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-stone-500">
                    <span>Min LOS: {plan.minLos}</span>
                    <span>Max LOS: {plan.maxLos}</span>
                    <span className={plan.refundable ? 'text-emerald-600' : 'text-red-600'}>
                      {plan.refundable ? 'Refundable' : 'Non-refundable'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-500">Available on:</span>
                    {plan.channels.map((ch) => (
                      <Badge key={ch} variant="secondary" className="text-xs">{ch}</Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function InventoryView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Inventory Management</h2>
          <p className="text-stone-500">View and manage room availability</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync All Channels
          </Button>
        </div>
      </div>

      {/* Inventory Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Overview (Next 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis dataKey="date" stroke="#737373" fontSize={12} />
                <YAxis stroke="#737373" fontSize={12} />
                <Tooltip />
                <Bar dataKey="std.available" name="Standard" fill="#14b8a6" />
                <Bar dataKey="dlx.available" name="Deluxe" fill="#f59e0b" />
                <Bar dataKey="ste.available" name="Suite" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Standard</TableHead>
                <TableHead>Deluxe</TableHead>
                <TableHead>Suite</TableHead>
                <TableHead>Total Available</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryData.map((row) => (
                <TableRow key={row.date}>
                  <TableCell className="font-medium">{row.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{row.std.available}</span>
                      <span className="text-stone-400">/ {row.std.total}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{row.dlx.available}</span>
                      <span className="text-stone-400">/ {row.dlx.total}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{row.ste.available}</span>
                      <span className="text-stone-400">/ {row.ste.total}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {row.std.available + row.dlx.available + row.ste.available} rooms
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SettingsView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-800">Settings</h2>
        <p className="text-stone-500">Configure your property settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Property Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Property Name</Label>
                  <Input className="mt-1" defaultValue="Sakala Resort Bali" />
                </div>
                <div>
                  <Label className="text-sm font-medium">Currency</Label>
                  <Select defaultValue="USD">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="IDR">IDR (Rp)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <Select defaultValue="asia_makassar">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asia_makassar">Asia/Makassar (WITA)</SelectItem>
                      <SelectItem value="asia_jakarta">Asia/Jakarta (WIB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Rooms</Label>
                  <Input className="mt-1" type="number" defaultValue="80" />
                </div>
              </div>
              <Button className="bg-teal-600 hover:bg-teal-700">Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Engine Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Auto-Pricing Enabled</Label>
                  <p className="text-sm text-stone-500">Automatically apply recommended prices</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Risk Aversion (λ)</Label>
                  <p className="text-sm text-stone-500">Higher = more conservative pricing</p>
                </div>
                <Select defaultValue="0.25">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.10">0.10 (Low)</SelectItem>
                    <SelectItem value="0.25">0.25 (Medium)</SelectItem>
                    <SelectItem value="0.50">0.50 (High)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium">Max Price Change</Label>
                  <p className="text-sm text-stone-500">Maximum daily price adjustment</p>
                </div>
                <Select defaultValue="15">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                    <SelectItem value="20">20%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: 'New Booking Alerts', desc: 'Get notified for new bookings' },
                { label: 'Cancellation Alerts', desc: 'Get notified when bookings are cancelled' },
                { label: 'Pricing Recommendations', desc: 'Daily pricing recommendation summary' },
                { label: 'Low Inventory Alerts', desc: 'When availability drops below threshold' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2">
                  <div>
                    <Label className="font-medium">{item.label}</Label>
                    <p className="text-sm text-stone-500">{item.desc}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: 'Stripe', status: 'connected', icon: CreditCard },
                { name: 'Google Analytics', status: 'connected', icon: Globe },
                { name: 'Mailchimp', status: 'disconnected', icon: Users },
              ].map((service) => (
                <div key={service.name} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center">
                      <service.icon className="h-5 w-5 text-stone-600" />
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <Badge variant={service.status === 'connected' ? 'default' : 'secondary'}
                        className={service.status === 'connected' ? 'bg-emerald-100 text-emerald-800' : ''}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    {service.status === 'connected' ? 'Configure' : 'Connect'}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
