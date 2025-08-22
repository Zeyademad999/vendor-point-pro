import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Search, Plus, Edit, Trash2, Clock, User, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/Layout/AppLayout';

const Bookings = () => {
  const [bookings, setBookings] = useState([
    {
      id: 1,
      customerName: 'John Smith',
      customerPhone: '+1-555-0123',
      service: 'Premium Hair Cut',
      staff: 'Alex Rodriguez',
      date: '2024-01-20',
      time: '10:00 AM',
      duration: 45,
      price: 45.00,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      notes: 'Customer prefers short sides',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      customerName: 'Sarah Johnson',
      customerPhone: '+1-555-0124',
      service: 'Beard Styling',
      staff: 'James Wilson',
      date: '2024-01-20',
      time: '2:30 PM',
      duration: 30,
      price: 25.00,
      status: 'Pending',
      paymentStatus: 'Pending',
      notes: 'First-time client',
      createdAt: '2024-01-18'
    },
    {
      id: 3,
      customerName: 'Mike Wilson',
      customerPhone: '+1-555-0125',
      service: 'Hair Wash & Blow Dry',
      staff: 'Maria Silva',
      date: '2024-01-21',
      time: '9:00 AM',
      duration: 25,
      price: 20.00,
      status: 'Confirmed',
      paymentStatus: 'Paid',
      notes: 'Regular customer',
      createdAt: '2024-01-16'
    },
    {
      id: 4,
      customerName: 'Emma Davis',
      customerPhone: '+1-555-0126',
      service: 'Facial Treatment',
      staff: 'Alex Rodriguez',
      date: '2024-01-22',
      time: '2:00 PM',
      duration: 60,
      price: 65.00,
      status: 'Cancelled',
      paymentStatus: 'Refunded',
      notes: 'Schedule conflict',
      createdAt: '2024-01-14'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('2024-01-20');
  const [newBooking, setNewBooking] = useState({
    customerName: '', customerPhone: '', service: '', staff: '', date: '', time: '', notes: ''
  });
  const { toast } = useToast();

  const filteredBookings = bookings.filter(booking =>
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.staff.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const todayBookings = bookings.filter(booking => booking.date === selectedDate);
  const upcomingBookings = bookings.filter(booking => new Date(booking.date) > new Date() && booking.status !== 'Cancelled');
  const pendingBookings = bookings.filter(booking => booking.status === 'Pending');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed': return 'bg-success text-success-foreground';
      case 'Pending': return 'bg-warning text-warning-foreground';
      case 'Cancelled': return 'bg-destructive text-destructive-foreground';
      case 'Completed': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-success text-success-foreground';
      case 'Pending': return 'bg-warning text-warning-foreground';
      case 'Refunded': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const handleAddBooking = () => {
    const id = bookings.length + 1;
    const booking = {
      ...newBooking,
      id,
      duration: 45, // Default duration
      price: 45.00, // Default price
      status: 'Pending',
      paymentStatus: 'Pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setBookings([...bookings, booking]);
    setNewBooking({ customerName: '', customerPhone: '', service: '', staff: '', date: '', time: '', notes: '' });
    toast({ title: 'Booking Created', description: 'New booking has been scheduled successfully' });
  };

  const handleStatusUpdate = (bookingId: number, newStatus: string) => {
    setBookings(bookings.map(booking => 
      booking.id === bookingId ? { ...booking, status: newStatus } : booking
    ));
    toast({ title: 'Status Updated', description: `Booking status changed to ${newStatus}` });
  };

  const totalBookings = bookings.length;
  const totalRevenue = bookings.filter(b => b.paymentStatus === 'Paid').reduce((sum, b) => sum + b.price, 0);
  const confirmationRate = ((bookings.filter(b => b.status === 'Confirmed').length / totalBookings) * 100).toFixed(1);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Bookings & Appointments</h1>
            <p className="text-muted-foreground">Schedule and manage customer appointments</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>Schedule a new appointment</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer Name</Label>
                    <Input 
                      placeholder="John Smith" 
                      value={newBooking.customerName}
                      onChange={(e) => setNewBooking({...newBooking, customerName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      placeholder="+1-555-0000" 
                      value={newBooking.customerPhone}
                      onChange={(e) => setNewBooking({...newBooking, customerPhone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select value={newBooking.service} onValueChange={(value) => setNewBooking({...newBooking, service: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Premium Hair Cut">Premium Hair Cut - $45</SelectItem>
                      <SelectItem value="Beard Styling">Beard Styling - $25</SelectItem>
                      <SelectItem value="Hair Wash & Blow Dry">Hair Wash & Blow Dry - $20</SelectItem>
                      <SelectItem value="Facial Treatment">Facial Treatment - $65</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select value={newBooking.staff} onValueChange={(value) => setNewBooking({...newBooking, staff: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Alex Rodriguez">Alex Rodriguez</SelectItem>
                      <SelectItem value="Maria Silva">Maria Silva</SelectItem>
                      <SelectItem value="James Wilson">James Wilson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input 
                      type="date"
                      value={newBooking.date}
                      onChange={(e) => setNewBooking({...newBooking, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Select value={newBooking.time} onValueChange={(value) => setNewBooking({...newBooking, time: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                        <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                        <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                        <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                        <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                        <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Special requests or notes" 
                    value={newBooking.notes}
                    onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddBooking} className="w-full">Create Booking</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBookings}</div>
              <p className="text-xs text-success">All time</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayBookings.length}</div>
              <p className="text-xs text-success">Scheduled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{pendingBookings.length}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Booking Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-success">{confirmationRate}% confirmation rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Bookings Management */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Bookings</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Bookings</CardTitle>
                    <CardDescription>Complete list of customer appointments</CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
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
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.customerName}</p>
                            <p className="text-sm text-muted-foreground">{booking.customerPhone}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.service}</p>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              {booking.duration} min
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {booking.staff}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.date}</p>
                            <p className="text-sm text-muted-foreground">{booking.time}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">${booking.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPaymentStatusColor(booking.paymentStatus)}>
                            {booking.paymentStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusUpdate(booking.id, 'Confirmed')}
                              disabled={booking.status === 'Confirmed'}
                            >
                              <CheckCircle className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-3 w-3" />
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
          </TabsContent>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Appointments scheduled for {selectedDate}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayBookings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No appointments scheduled for today</p>
                    </div>
                  ) : (
                    todayBookings.map((booking) => (
                      <Card key={booking.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <p className="font-bold text-lg">{booking.time}</p>
                              <p className="text-xs text-muted-foreground">{booking.duration}m</p>
                            </div>
                            <div>
                              <p className="font-medium">{booking.customerName}</p>
                              <p className="text-sm text-muted-foreground">{booking.service}</p>
                              <p className="text-sm text-muted-foreground">with {booking.staff}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                            <span className="font-medium">${booking.price}</span>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>Future scheduled appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <Card key={booking.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-sm text-muted-foreground">{booking.service} with {booking.staff}</p>
                          <p className="text-sm text-muted-foreground">{booking.date} at {booking.time}</p>
                        </div>
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Bookings awaiting confirmation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingBookings.map((booking) => (
                    <Card key={booking.id} className="p-4 border-warning">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-sm text-muted-foreground">{booking.service} with {booking.staff}</p>
                          <p className="text-sm text-muted-foreground">{booking.date} at {booking.time}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm"
                            onClick={() => handleStatusUpdate(booking.id, 'Confirmed')}
                          >
                            Confirm
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusUpdate(booking.id, 'Cancelled')}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Bookings;