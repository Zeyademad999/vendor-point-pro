import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { BarChart3, DollarSign, ShoppingBag, Users, Package, Calendar, Settings, LogOut, Menu, TrendingUp, AlertCircle } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();

  const menuItems = [
    { title: "Dashboard", url: "/dashboard", icon: BarChart3 },
    { title: "POS", url: "/pos", icon: ShoppingBag },
    { title: "Products", url: "/dashboard/products", icon: Package },
    { title: "Customers", url: "/dashboard/customers", icon: Users },
    { title: "Staff", url: "/dashboard/staff", icon: Users },
    { title: "Bookings", url: "/dashboard/bookings", icon: Calendar },
    { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/settings", icon: Settings },
  ];

  const stats = [
    { title: "Today's Sales", value: "$1,247", change: "+12%", icon: DollarSign, color: "text-success" },
    { title: "Orders", value: "23", change: "+5%", icon: ShoppingBag, color: "text-primary" },
    { title: "Customers", value: "156", change: "+8%", icon: Users, color: "text-warning" },
    { title: "Products Sold", value: "89", change: "-2%", icon: Package, color: "text-destructive" },
  ];

  const recentOrders = [
    { id: "#001", customer: "John Smith", amount: "$45.00", status: "Completed", time: "2 min ago" },
    { id: "#002", customer: "Sarah Johnson", amount: "$32.50", status: "Processing", time: "5 min ago" },
    { id: "#003", customer: "Mike Wilson", amount: "$67.75", status: "Completed", time: "8 min ago" },
    { id: "#004", customer: "Emma Davis", amount: "$28.00", status: "Pending", time: "12 min ago" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-success text-success-foreground';
      case 'Processing': return 'bg-warning text-warning-foreground';
      case 'Pending': return 'bg-muted text-muted-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg">FlokiPOS</span>
            </div>
          </div>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={({isActive}) => 
                          isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <div className="mt-auto p-4 border-t">
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => navigate('/auth/login')}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <div>
                  <h1 className="text-2xl font-bold">Dashboard</h1>
                  <p className="text-muted-foreground">Welcome back! Here&apos;s your business overview.</p>
                </div>
              </div>
              <Button>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Open POS
              </Button>
            </div>
          </header>

          <div className="p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="hover-lift">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className={`text-xs ${stat.color}`}>
                      {stat.change} from yesterday
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest transactions from your store</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-8 bg-primary rounded-full"></div>
                          <div>
                            <p className="font-medium">{order.customer}</p>
                            <p className="text-sm text-muted-foreground">{order.id} • {order.time}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                          <p className="font-semibold">{order.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/pos')}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      New Sale
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/dashboard/products')}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={() => navigate('/dashboard/customers')}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </CardContent>
                </Card>

                {/* Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      <span>Alerts</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                      <p className="text-sm font-medium">Low Stock Alert</p>
                      <p className="text-xs text-muted-foreground">3 products running low</p>
                    </div>
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="text-sm font-medium">New Booking</p>
                      <p className="text-xs text-muted-foreground">Sarah booked for tomorrow</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;