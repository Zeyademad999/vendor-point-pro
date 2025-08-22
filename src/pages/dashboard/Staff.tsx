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
import { Search, Plus, Edit, Trash2, Users, DollarSign, TrendingUp, Clock, Star, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/Layout/AppLayout';

const Staff = () => {
  const [staff, setStaff] = useState([
    {
      id: 1,
      name: 'Alex Rodriguez',
      email: 'alex@luxesalon.com',
      phone: '+1-555-0201',
      role: 'Senior Stylist',
      baseSalary: 3500,
      commission: 15,
      workingHours: 'Mon-Fri 9AM-6PM',
      joinDate: '2023-03-15',
      services: ['Hair Cut', 'Hair Styling', 'Color Treatment'],
      monthlySales: 12450,
      servicesCompleted: 89,
      rating: 4.9,
      status: 'Active',
      notes: 'Specialized in color treatments'
    },
    {
      id: 2,
      name: 'Maria Silva',
      email: 'maria@luxesalon.com',
      phone: '+1-555-0202',
      role: 'Hair Stylist',
      baseSalary: 2800,
      commission: 12,
      workingHours: 'Tue-Sat 10AM-7PM',
      joinDate: '2023-07-08',
      services: ['Hair Cut', 'Beard Trim', 'Facial'],
      monthlySales: 8920,
      servicesCompleted: 67,
      rating: 4.7,
      status: 'Active',
      notes: 'Great with beard styling'
    },
    {
      id: 3,
      name: 'James Wilson',
      email: 'james@luxesalon.com',
      phone: '+1-555-0203',
      role: 'Barber',
      baseSalary: 2500,
      commission: 10,
      workingHours: 'Wed-Sun 9AM-5PM',
      joinDate: '2023-09-20',
      services: ['Hair Cut', 'Beard Trim', 'Hot Towel Shave'],
      monthlySales: 6780,
      servicesCompleted: 78,
      rating: 4.8,
      status: 'Active',
      notes: 'Traditional barbering expert'
    },
    {
      id: 4,
      name: 'Sophie Chen',
      email: 'sophie@luxesalon.com',
      phone: '+1-555-0204',
      role: 'Receptionist',
      baseSalary: 2200,
      commission: 0,
      workingHours: 'Mon-Fri 8AM-6PM',
      joinDate: '2023-05-12',
      services: [],
      monthlySales: 0,
      servicesCompleted: 0,
      rating: 4.6,
      status: 'Active',
      notes: 'Handles appointments and customer service'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '', email: '', phone: '', role: '', baseSalary: '', commission: '', workingHours: '', notes: ''
  });
  const { toast } = useToast();

  const filteredStaff = staff.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Senior Stylist': return 'bg-primary text-primary-foreground';
      case 'Hair Stylist': return 'bg-secondary text-secondary-foreground';
      case 'Barber': return 'bg-accent text-accent-foreground';
      case 'Receptionist': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  const getPerformanceLevel = (rating: number) => {
    if (rating >= 4.8) return { level: 'Excellent', color: 'text-success' };
    if (rating >= 4.5) return { level: 'Good', color: 'text-primary' };
    if (rating >= 4.0) return { level: 'Average', color: 'text-warning' };
    return { level: 'Needs Improvement', color: 'text-destructive' };
  };

  const handleAddStaff = () => {
    const id = staff.length + 1;
    const staffMember = {
      ...newStaff,
      id,
      baseSalary: parseInt(newStaff.baseSalary),
      commission: parseInt(newStaff.commission),
      joinDate: new Date().toISOString().split('T')[0],
      services: [],
      monthlySales: 0,
      servicesCompleted: 0,
      rating: 5.0,
      status: 'Active'
    };
    setStaff([...staff, staffMember]);
    setNewStaff({ name: '', email: '', phone: '', role: '', baseSalary: '', commission: '', workingHours: '', notes: '' });
    toast({ title: 'Staff Added', description: 'New staff member has been added successfully' });
  };

  const totalMonthlySalary = staff.reduce((sum, s) => sum + s.baseSalary, 0);
  const totalMonthlySales = staff.reduce((sum, s) => sum + s.monthlySales, 0);
  const avgRating = (staff.reduce((sum, s) => sum + s.rating, 0) / staff.length).toFixed(1);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Staff Management</h1>
            <p className="text-muted-foreground">Manage team members and track performance</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Staff Member</DialogTitle>
                <DialogDescription>Create a new staff profile</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="Staff member name" 
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      placeholder="staff@email.com" 
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input 
                      placeholder="+1-555-0000" 
                      value={newStaff.phone}
                      onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Senior Stylist">Senior Stylist</SelectItem>
                      <SelectItem value="Hair Stylist">Hair Stylist</SelectItem>
                      <SelectItem value="Barber">Barber</SelectItem>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Salary ($)</Label>
                    <Input 
                      type="number"
                      placeholder="2500" 
                      value={newStaff.baseSalary}
                      onChange={(e) => setNewStaff({...newStaff, baseSalary: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission (%)</Label>
                    <Input 
                      type="number"
                      placeholder="10" 
                      value={newStaff.commission}
                      onChange={(e) => setNewStaff({...newStaff, commission: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Working Hours</Label>
                  <Input 
                    placeholder="Mon-Fri 9AM-6PM" 
                    value={newStaff.workingHours}
                    onChange={(e) => setNewStaff({...newStaff, workingHours: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea 
                    placeholder="Skills, specializations, etc." 
                    value={newStaff.notes}
                    onChange={(e) => setNewStaff({...newStaff, notes: e.target.value})}
                  />
                </div>
                <Button onClick={handleAddStaff} className="w-full">Add Staff Member</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{staff.length}</div>
              <p className="text-xs text-success">Active team members</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Salary Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalMonthlySalary.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Base salaries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalMonthlySales.toLocaleString()}</div>
              <p className="text-xs text-success">This month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating}</div>
              <p className="text-xs text-success">Team performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>Manage staff profiles and track performance</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
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
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Salary & Commission</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Monthly Sales</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((member) => {
                  const performance = getPerformanceLevel(member.rating);
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="text-sm text-muted-foreground">{member.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          {member.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">${member.baseSalary.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">{member.commission}% commission</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className={`font-medium ${performance.color}`}>{performance.level}</p>
                          <p className="text-sm text-muted-foreground">{member.servicesCompleted} services</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${member.monthlySales.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 fill-current text-yellow-400" />
                          <span className="font-medium">{member.rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{member.workingHours}</span>
                        </div>
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
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Staff;