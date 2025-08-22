import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, Scissors, Clock, DollarSign, Calendar, Users, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/Layout/AppLayout';

const Services = () => {
  const [services, setServices] = useState([
    {
      id: 1,
      name: 'Premium Hair Cut',
      description: 'Professional haircut with wash and styling',
      category: 'Hair Services',
      price: 45.00,
      duration: 45,
      bookingEnabled: true,
      availableSlots: ['9:00 AM', '10:00 AM', '11:00 AM', '2:00 PM', '3:00 PM', '4:00 PM'],
      assignedStaff: ['Alex Rodriguez', 'Maria Silva'],
      bookingsThisMonth: 89,
      revenue: 4005.00,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Beard Styling',
      description: 'Professional beard trim and shaping',
      category: 'Beard Services',
      price: 25.00,
      duration: 30,
      bookingEnabled: true,
      availableSlots: ['9:30 AM', '10:30 AM', '11:30 AM', '2:30 PM', '3:30 PM', '4:30 PM'],
      assignedStaff: ['James Wilson', 'Maria Silva'],
      bookingsThisMonth: 67,
      revenue: 1675.00,
      status: 'Active'
    },
    {
      id: 3,
      name: 'Hair Wash & Blow Dry',
      description: 'Deep cleansing wash with professional blow dry',
      category: 'Hair Services',
      price: 20.00,
      duration: 25,
      bookingEnabled: true,
      availableSlots: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM'],
      assignedStaff: ['Alex Rodriguez', 'Maria Silva'],
      bookingsThisMonth: 134,
      revenue: 2680.00,
      status: 'Active'
    },
    {
      id: 4,
      name: 'Facial Treatment',
      description: 'Relaxing facial treatment with premium products',
      category: 'Skincare',
      price: 65.00,
      duration: 60,
      bookingEnabled: false,
      availableSlots: ['10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'],
      assignedStaff: ['Alex Rodriguez'],
      bookingsThisMonth: 23,
      revenue: 1495.00,
      status: 'Inactive'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [newService, setNewService] = useState({
    name: '', description: '', category: '', price: '', duration: '', bookingEnabled: true, availableSlots: '', assignedStaff: []
  });
  const { toast } = useToast();

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-success text-success-foreground';
      case 'Inactive': return 'bg-muted text-muted-foreground';
      case 'Suspended': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Hair Services': return 'bg-primary text-primary-foreground';
      case 'Beard Services': return 'bg-secondary text-secondary-foreground';
      case 'Skincare': return 'bg-accent text-accent-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleAddService = () => {
    const id = services.length + 1;
    const service = {
      ...newService,
      id,
      price: parseFloat(newService.price),
      duration: parseInt(newService.duration),
      availableSlots: newService.availableSlots.split(',').map(slot => slot.trim()),
      bookingsThisMonth: 0,
      revenue: 0,
      status: 'Active'
    };
    setServices([...services, service]);
    setNewService({ name: '', description: '', category: '', price: '', duration: '', bookingEnabled: true, availableSlots: '', assignedStaff: [] });
    toast({ title: 'Service Added', description: 'New service has been created successfully' });
  };

  const totalRevenue = services.reduce((sum, s) => sum + s.revenue, 0);
  const totalBookings = services.reduce((sum, s) => sum + s.bookingsThisMonth, 0);
  const avgServicePrice = services.reduce((sum, s) => sum + s.price, 0) / services.length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Services Management</h1>
            <p className="text-muted-foreground">Manage service offerings and booking availability</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Service</DialogTitle>
                <DialogDescription>Create a new service offering</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Service Name</Label>
                  <Input 
                    placeholder="Premium Hair Cut" 
                    value={newService.name}
                    onChange={(e) => setNewService({...newService, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Professional haircut with wash and styling" 
                    value={newService.description}
                    onChange={(e) => setNewService({...newService, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={newService.category} onValueChange={(value) => setNewService({...newService, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hair Services">Hair Services</SelectItem>
                        <SelectItem value="Beard Services">Beard Services</SelectItem>
                        <SelectItem value="Skincare">Skincare</SelectItem>
                        <SelectItem value="Styling">Styling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Price ($)</Label>
                    <Input 
                      type="number"
                      placeholder="45.00" 
                      value={newService.price}
                      onChange={(e) => setNewService({...newService, price: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input 
                    type="number"
                    placeholder="45" 
                    value={newService.duration}
                    onChange={(e) => setNewService({...newService, duration: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Available Time Slots (comma-separated)</Label>
                  <Input 
                    placeholder="9:00 AM, 10:00 AM, 11:00 AM, 2:00 PM" 
                    value={newService.availableSlots}
                    onChange={(e) => setNewService({...newService, availableSlots: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newService.bookingEnabled}
                    onCheckedChange={(checked) => setNewService({...newService, bookingEnabled: checked})}
                  />
                  <Label>Enable online booking</Label>
                </div>
                <Button onClick={handleAddService} className="w-full">Create Service</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Scissors className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{services.length}</div>
              <p className="text-xs text-success">Active offerings</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-success">From services</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-success">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Service Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${avgServicePrice.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per service</p>
            </CardContent>
          </Card>
        </div>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Service Catalog</CardTitle>
                <CardDescription>Manage service offerings, pricing, and booking settings</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price & Duration</TableHead>
                  <TableHead>Booking</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(service.category)}>
                        {service.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${service.price}</p>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {service.duration} min
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant={service.bookingEnabled ? "default" : "secondary"}>
                          {service.bookingEnabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {service.availableSlots.length} slots
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{service.assignedStaff.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{service.bookingsThisMonth} bookings</p>
                        <p className="text-sm text-success">${service.revenue.toLocaleString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-3 w-3" />
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
    </AppLayout>
  );
};

export default Services;