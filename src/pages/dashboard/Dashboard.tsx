import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  AlertCircle,
  Loader2,
  Globe,
  ExternalLink,
  Settings,
  Shield,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService, DashboardData } from "@/services/dashboard";
import { clientService, ClientPortals } from "@/services/clients";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  console.log("Dashboard - isAuthenticated:", isAuthenticated);
  console.log("Dashboard - user:", user);
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [portals, setPortals] = useState<ClientPortals | null>(null);

  // Fetch dashboard data and portals
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard data
        console.log("Fetching dashboard data...");
        const dashboardResponse = await dashboardService.getDashboardData();
        console.log("Dashboard response:", dashboardResponse);
        if (dashboardResponse.success) {
          console.log("Setting dashboard data:", dashboardResponse.data);
          setDashboardData(dashboardResponse.data);
        } else {
          console.error("Dashboard API failed:", dashboardResponse);
        }

        // Fetch portals for clients
        if (user && user.role === "client") {
          const portalsResponse = await clientService.getClientPortals();
          if (portalsResponse.success) {
            setPortals(portalsResponse.data);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, user, toast]);

  // Create stats array from real data
  console.log("Creating stats array, dashboardData:", dashboardData);
  console.log("Dashboard stats breakdown:", {
    totalSales: dashboardData?.stats.totalSales,
    totalTransactions: dashboardData?.stats.totalTransactions,
    totalWebsiteOrders: dashboardData?.stats.totalWebsiteOrders,
    totalCustomers: dashboardData?.stats.totalCustomers,
    totalProducts: dashboardData?.stats.totalProducts,
    totalServices: dashboardData?.stats.totalServices,
    todaySales: dashboardData?.stats.todaySales,
    todayOrders: dashboardData?.stats.todayOrders,
    salesChange: dashboardData?.stats.salesChange,
    ordersChange: dashboardData?.stats.ordersChange,
    customersChange: dashboardData?.stats.customersChange,
    productsChange: dashboardData?.stats.productsChange,
  });
  const stats = dashboardData
    ? [
        {
          title: "Total Sales",
          value: `EGP ${(dashboardData.stats.totalSales || 0).toFixed(2)}`,
          change: `${(dashboardData.stats.salesChange || 0) >= 0 ? "+" : ""}${(
            dashboardData.stats.salesChange || 0
          ).toFixed(1)}%`,
          icon: DollarSign,
          color:
            (dashboardData.stats.salesChange || 0) >= 0
              ? "text-success"
              : "text-destructive",
        },
        {
          title: "Total Transactions",
          value: (dashboardData.stats.totalTransactions || 0).toString(),
          change: `${(dashboardData.stats.ordersChange || 0) >= 0 ? "+" : ""}${(
            dashboardData.stats.ordersChange || 0
          ).toFixed(1)}%`,
          icon: ShoppingBag,
          color:
            (dashboardData.stats.ordersChange || 0) >= 0
              ? "text-success"
              : "text-destructive",
        },
        {
          title: "Website Orders",
          value: (dashboardData.stats.totalWebsiteOrders || 0).toString(),
          change: "Total",
          icon: Globe,
          color: "text-primary",
        },
        {
          title: "Today's Sales",
          value: `EGP ${(dashboardData.stats.todaySales || 0).toFixed(2)}`,
          change: "Today",
          icon: DollarSign,
          color: "text-primary",
        },
        {
          title: "Today's Orders",
          value: (dashboardData.stats.todayOrders || 0).toString(),
          change: "Today",
          icon: ShoppingBag,
          color: "text-primary",
        },
        {
          title: "Customers",
          value: (dashboardData.stats.totalCustomers || 0).toString(),
          change: `${
            (dashboardData.stats.customersChange || 0) >= 0 ? "+" : ""
          }${(dashboardData.stats.customersChange || 0).toFixed(1)}%`,
          icon: Users,
          color:
            (dashboardData.stats.customersChange || 0) >= 0
              ? "text-success"
              : "text-destructive",
        },
        {
          title: "Products",
          value: (dashboardData.stats.totalProducts || 0).toString(),
          change: `${
            (dashboardData.stats.productsChange || 0) >= 0 ? "+" : ""
          }${(dashboardData.stats.productsChange || 0).toFixed(1)}%`,
          icon: Package,
          color:
            (dashboardData.stats.productsChange || 0) >= 0
              ? "text-success"
              : "text-destructive",
        },
        {
          title: "Services",
          value: (dashboardData.stats.totalServices || 0).toString(),
          change: "Total",
          icon: Settings,
          color: "text-primary",
        },
      ]
    : [
        {
          title: "Total Sales",
          value: "EGP 0.00",
          change: "Loading...",
          icon: DollarSign,
          color: "text-muted-foreground",
        },
        {
          title: "Total Transactions",
          value: "0",
          change: "Loading...",
          icon: ShoppingBag,
          color: "text-muted-foreground",
        },
        {
          title: "Website Orders",
          value: "0",
          change: "Loading...",
          icon: Globe,
          color: "text-muted-foreground",
        },
        {
          title: "Today's Sales",
          value: "EGP 0.00",
          change: "Loading...",
          icon: DollarSign,
          color: "text-muted-foreground",
        },
        {
          title: "Today's Orders",
          value: "0",
          change: "Loading...",
          icon: ShoppingBag,
          color: "text-muted-foreground",
        },
        {
          title: "Customers",
          value: "0",
          change: "Loading...",
          icon: Users,
          color: "text-muted-foreground",
        },
        {
          title: "Products",
          value: "0",
          change: "Loading...",
          icon: Package,
          color: "text-muted-foreground",
        },
        {
          title: "Services",
          value: "0",
          change: "Loading...",
          icon: Settings,
          color: "text-muted-foreground",
        },
      ];

  const recentOrders = dashboardData?.recentTransactions || [];

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "paid":
        return "bg-success text-success-foreground";
      case "processing":
      case "confirmed":
        return "bg-warning text-warning-foreground";
      case "pending":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const handlePortalClick = (portal: any) => {
    if (portal.id === "customer") {
      // Open customer website in new tab
      window.open(portal.url, "_blank");
    } else {
      // Navigate to internal portal
      window.location.href = portal.url;
    }
  };

  const getPortalIcon = (iconName: string) => {
    switch (iconName) {
      case "settings":
        return <Settings className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      case "globe":
        return <Globe className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>
        <Button onClick={() => navigate("/pos")}>
          <ShoppingBag className="h-4 w-4 mr-2" />
          Open POS
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
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
        {/* Recent POS Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent POS Transactions</CardTitle>
            <CardDescription>
              Latest POS transactions from admin, staff, and cashier portals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-2 h-8 bg-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.id.includes("-")
                            ? `#${order.id.split("-")[1].padStart(3, "0")}`
                            : order.id}{" "}
                          • {order.time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <p className="font-semibold">
                        EGP {(order.amount || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent transactions
                </div>
              )}
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
                onClick={() => navigate("/pos")}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                New Sale
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/dashboard/products")}
              >
                <Package className="h-4 w-4 mr-2" />
                Add Product
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate("/dashboard/customers")}
              >
                <Users className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </CardContent>
          </Card>

          {/* Portal Switcher for Clients */}
          {portals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5 text-primary" />
                  <span>Switch Portal</span>
                </CardTitle>
                <CardDescription>
                  Access different parts of your business
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {portals.portals.map((portal) => (
                  <Button
                    key={portal.id}
                    className="w-full justify-start"
                    variant="outline"
                    onClick={() => handlePortalClick(portal)}
                  >
                    {getPortalIcon(portal.icon)}
                    <span className="ml-2">{portal.name}</span>
                    {portal.id === "customer" && (
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    )}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                <span>Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(dashboardData?.alerts?.lowStock || 0) > 0 && (
                <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm font-medium">Low Stock Alert</p>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.alerts.lowStock} product
                    {dashboardData.alerts.lowStock > 1 ? "s" : ""} running low
                  </p>
                </div>
              )}
              {(dashboardData?.alerts?.newBookings || 0) > 0 && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium">New Bookings</p>
                  <p className="text-xs text-muted-foreground">
                    {dashboardData.alerts.newBookings} new booking
                    {dashboardData.alerts.newBookings > 1 ? "s" : ""} today
                  </p>
                </div>
              )}
              {!dashboardData?.alerts?.lowStock &&
                !dashboardData?.alerts?.newBookings && (
                  <div className="p-3 bg-muted/10 border border-muted/20 rounded-lg">
                    <p className="text-sm font-medium">All Good!</p>
                    <p className="text-xs text-muted-foreground">
                      No alerts at the moment
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
