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
import { Search, Plus, Edit, Trash2, Users, Calendar, DollarSign, TrendingUp, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/Layout/AppLayout';

const Customers = () => {
  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0123',
      birthday: '1985-06-15',
      totalSpent: 456.78,
      visits: 12,
      lastVisit: '2024-01-15',
      birthdayGreeting: true,
      notes: 'Prefers morning appointments',
      status: 'Active',
      joinDate: '2023-08-22'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1-555-0124',
      birthday: '1992-03-08',
      totalSpent: 723.45,
      visits: 18,
      lastVisit: '2024-01-12',
      birthdayGreeting: true,
      notes: 'Allergic to certain hair products',
      status: 'VIP',
      joinDate: '2023-05-10'
    },
    {
      id: 3,
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      phone: '+1-555-0125',
      birthday: '1988-11-22',
      totalSpent: 234.12,
      visits: 8,
      lastVisit: '2024-01-08',
      birthdayGreeting: false,
      notes: 'Always books beard trim with haircut',
      status: 'Active',
      joinDate: '2023-10-05'
    },
    {
      id: 4,
      name: 'Emma Davis',
      email: 'emma.davis@email.com',
      phone: '+1-555-0126',
      birthday: '1990-07-19',
      totalSpent: 1205.67,
      visits: 25,
      lastVisit: '2024-01-10',
      birthdayGreeting: true,
      notes: 'Premium service client, very loyal',
      status: 'VIP',
      joinDate: '2023-03-18'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState({
    name: '', email: '', phone: '', birthday: '', notes: '', birthdayGreeting: true
  });
  const { toast } = useToast();

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VIP': return 'bg-primary text-primary-foreground';
      case 'Active': return 'bg-success text-success-foreground';
      case 'Inactive': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getLifetimeValue = (customer: any) => {
    if (customer.totalSpent > 1000) return 'High';
    if (customer.totalSpent > 500) return 'Medium';
    return 'Low';
  };

  const getARPU = () => {
    const totalSpent = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    return (totalSpent / customers.length).toFixed(2);
  };

  const handleAddCustomer = () => {
    const id = customers.length + 1;
    const customer = {
      ...newCustomer,
      id,
      totalSpent: 0,
      visits: 0,
      lastVisit: new Date().toISOString().split('T')[0],
      status: 'Active',
      joinDate: new Date().toISOString().split('T')[0]
    };
    setCustomers([...customers, customer]);
    setNewCustomer({ name: '', email: '', phone: '', birthday: '', notes: '', birthdayGreeting: true });
    toast({ title: 'Customer Added', description: 'New customer has been added successfully' });
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Management</h1>
            <p className="text-muted-foreground">Manage customer relationships and track loyalty</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>Create a new customer profile</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="Customer name" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      placeholder="customer@email.com" 
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      placeholder="+1-555-0000" 
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Birthday</Label>
                  <Input 
                    type="date"
                    value={newCustomer.birthday}
                    onChange={(e) => setNewCustomer({...newCustomer, birthday: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Customer preferences, allergies, etc." 
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newCustomer.birthdayGreeting}
                    onCheckedChange={(checked) => setNewCustomer({...newCustomer, birthdayGreeting: checked})}
                  />
                  <Label>Enable birthday greetings</Label>
                </div>
                <Button onClick={handleAddCustomer} className="w-full">Add Customer</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
              <p className="text-xs text-success">+12% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Revenue Per User</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${getARPU()}</div>
              <p className="text-xs text-success">+8% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">VIP Customers</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {customers.filter(c => c.status === 'VIP').length}
              </div>
              <p className="text-xs text-muted-foreground">High-value clients</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Birthday This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Send greetings</p>
            </CardContent>
          </Card>
        </div>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Customer Database</CardTitle>
                <CardDescription>Track customer relationships and purchase history</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
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
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Visits</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Birthday</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          LTV: {getLifetimeValue(customer)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-2" />
                          {customer.email}
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="h-3 w-3 mr-2" />
                          {customer.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">${customer.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>{customer.visits}</TableCell>
                    <TableCell>{customer.lastVisit}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{customer.birthday}</span>
                        {customer.birthdayGreeting && (
                          <Badge variant="secondary" className="text-xs">Auto</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="h-3 w-3" />
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

export default Customers;