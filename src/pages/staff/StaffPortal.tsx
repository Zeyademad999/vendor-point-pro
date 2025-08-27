import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { clientService, WebsiteConfig } from "@/services/clients";
import { bookingService, Booking } from "@/services/bookings";
import { customerService } from "@/services/customers";
import { productService } from "@/services/products";
import EmbeddedPOS from "@/components/EmbeddedPOS";
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShoppingCart,
  BarChart3,
  UserPlus,
  Package,
  CreditCard,
  TrendingUp,
  DollarSign,
  LogOut,
  Shield,
} from "lucide-react";
import PageTransition from "@/components/PageTransition";

const StaffPortal = () => {
  const [searchParams] = useSearchParams();
  const subdomain = searchParams.get("subdomain");
  const { toast } = useToast();
  const { logout, user, loading: authLoading } = useAuth();
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Add authentication debugging
  console.log("StaffPortal: Component mounted");
  console.log("StaffPortal: Subdomain:", subdomain);
  console.log(
    "StaffPortal: Search params:",
    Object.fromEntries(searchParams.entries())
  );
  console.log("StaffPortal: User role:", user?.role);
  console.log("StaffPortal: User business_id:", user?.business_id);
  console.log("StaffPortal: User business_name:", user?.business_name);

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-800 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">
              Checking authentication...
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "bookings" | "customers" | "products" | "reports" | "pos"
  >("dashboard");

  // Check if user is authorized to access staff portal
  if (user && user.role !== "staff" && user.role !== "cashier") {
    console.log("StaffPortal: Unauthorized access attempt by role:", user.role);
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have permission to access the staff portal.
            </p>
            <Button className="mt-4" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Parse permissions from user data (staff permissions are stored in user object)
  // If no permissions are set, provide default permissions for staff
  const permissions = user?.permissions
    ? typeof user.permissions === "string"
      ? JSON.parse(user.permissions)
      : user.permissions
    : {
        // Default permissions for staff members
        view_dashboard: true,
        manage_bookings: true,
        manage_customers: true,
        manage_products: true,
        view_reports: true,
        pos_access: true,
      };

  // Debug permissions
  console.log("StaffPortal: User permissions:", user?.permissions);
  console.log("StaffPortal: Parsed permissions:", permissions);

  // Helper function to check permissions
  const hasPermission = (permission: string) => {
    const hasPerm = permissions[permission] === true;
    console.log(`StaffPortal: Checking permission '${permission}':`, hasPerm);
    return hasPerm;
  };

  // Get available tabs based on permissions
  const getAvailableTabs = () => {
    const tabs = [];

    if (hasPermission("view_dashboard")) {
      tabs.push({ id: "dashboard", label: "Dashboard", icon: TrendingUp });
    }
    if (hasPermission("manage_bookings")) {
      tabs.push({ id: "bookings", label: "Bookings", icon: Calendar });
    }
    if (hasPermission("manage_customers")) {
      tabs.push({ id: "customers", label: "Customers", icon: Users });
    }
    if (hasPermission("manage_products")) {
      tabs.push({ id: "products", label: "Products", icon: Package });
    }
    if (hasPermission("view_reports")) {
      tabs.push({ id: "reports", label: "Reports", icon: BarChart3 });
    }
    if (hasPermission("pos_access")) {
      tabs.push({ id: "pos", label: "POS", icon: ShoppingCart });
    }

    console.log("StaffPortal: Available tabs:", tabs);
    return tabs;
  };

  // Get permission required for a tab
  const getPermissionForTab = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return "view_dashboard";
      case "bookings":
        return "manage_bookings";
      case "customers":
        return "manage_customers";
      case "products":
        return "manage_products";
      case "reports":
        return "view_reports";
      case "pos":
        return "pos_access";
      default:
        return "view_dashboard";
    }
  };

  useEffect(() => {
    // Load staff data regardless of subdomain - staff members are already authenticated
    loadStaffData();

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log("StaffPortal: Loading timeout reached, forcing completion");
        setLoading(false);
        toast({
          title: "Loading Timeout",
          description:
            "Some data may not have loaded completely. Please refresh if needed.",
          variant: "destructive",
        });
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timeout);
  }, [selectedDate]);

  // Auto-switch to first available tab if current tab is not accessible
  useEffect(() => {
    if (user && !loading) {
      const availableTabs = getAvailableTabs();
      const currentTabPermission = getPermissionForTab(activeTab);

      if (!hasPermission(currentTabPermission) && availableTabs.length > 0) {
        console.log(
          "StaffPortal: Switching to first available tab:",
          availableTabs[0].id
        );
        setActiveTab(availableTabs[0].id as "dashboard" | "bookings" | "customers" | "products" | "reports" | "pos");
      }
    }
  }, [user, loading, activeTab]);

  const loadStaffData = async () => {
    try {
      setLoading(true);
      console.log("StaffPortal: Starting to load staff data");
      console.log("StaffPortal: User data:", user);

      // Load website config only if subdomain is available
      if (subdomain) {
        console.log(
          "StaffPortal: Loading website config for subdomain:",
          subdomain
        );
        const configResponse = await clientService.getWebsiteConfig(subdomain);
        if (configResponse.success) {
          setConfig(configResponse.data);
          console.log("StaffPortal: Website config loaded successfully");
        }
      } else {
        console.log(
          "StaffPortal: No subdomain available, skipping website config"
        );
      }

      // Load dashboard stats if staff has permission
      if (hasPermission("view_dashboard")) {
        console.log("StaffPortal: Loading dashboard stats");
        const statsResponse = await clientService.getClientDashboard();
        if (statsResponse.success) {
          setStats(statsResponse.data);
          console.log(
            "StaffPortal: Dashboard stats loaded successfully:",
            statsResponse.data
          );
        } else {
          console.error(
            "StaffPortal: Failed to load dashboard stats:",
            statsResponse
          );
        }
      }

      // Load bookings if staff has permission
      if (hasPermission("manage_bookings")) {
        console.log("StaffPortal: Loading bookings");
        const bookingsResponse = await bookingService.getBookings({
          page: 1,
          limit: 10,
          date: selectedDate,
        });
        if (bookingsResponse.success) {
          setBookings(bookingsResponse.data);
          console.log(
            "StaffPortal: Bookings loaded successfully:",
            bookingsResponse.data.length,
            "bookings"
          );
        } else {
          console.error(
            "StaffPortal: Failed to load bookings:",
            bookingsResponse
          );
        }
      }

      // Load customers if staff has permission
      if (hasPermission("manage_customers")) {
        console.log("StaffPortal: Loading customers");
        const customersResponse = await customerService.getCustomers({
          page: 1,
          limit: 10,
        });
        if (customersResponse.success) {
          setCustomers(customersResponse.data);
          console.log(
            "StaffPortal: Customers loaded successfully:",
            customersResponse.data.length,
            "customers"
          );
        } else {
          console.error(
            "StaffPortal: Failed to load customers:",
            customersResponse
          );
        }
      }

      // Load products if staff has permission
      if (hasPermission("manage_products")) {
        console.log("StaffPortal: Loading products");
        const productsResponse = await productService.getProducts({
          page: 1,
          limit: 10,
        });
        if (productsResponse.success) {
          setProducts(productsResponse.data);
          console.log(
            "StaffPortal: Products loaded successfully:",
            productsResponse.data.length,
            "products"
          );
        } else {
          console.error(
            "StaffPortal: Failed to load products:",
            productsResponse
          );
        }
      }
    } catch (error) {
      console.error("StaffPortal: Error loading staff data:", error);
      toast({
        title: "Error",
        description: "Failed to load staff data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("StaffPortal: Finished loading staff data");
    }
  };

  const handleTransactionComplete = async (receipt: any) => {
    console.log("StaffPortal: Transaction completed, receipt:", receipt);
    // Refresh dashboard stats after transaction
    try {
      console.log("StaffPortal: Refreshing dashboard stats...");
      const statsResponse = await clientService.getClientDashboard();
      console.log("StaffPortal: Stats response:", statsResponse);
      if (statsResponse.success) {
        setStats(statsResponse.data);
        console.log("StaffPortal: Stats updated successfully");
      }
    } catch (error) {
      console.error("StaffPortal: Error refreshing stats:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-800 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">
              Loading staff portal...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Only show config error if we were trying to load config but failed
  if (subdomain && !config) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              Staff Portal Not Found
            </h1>
            <p className="text-gray-600">
              The requested staff portal could not be found.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Staff Portal
                </h1>
                <p className="text-gray-600">
                  {config?.business?.name || "Business"} - Manage your schedule
                  and bookings
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {config?.business?.type && (
                  <Badge variant="outline">{config.business.type}</Badge>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Welcome, {user?.name || "Staff Member"}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {user?.role === "staff" ? "Staff" : "Cashier"}
                  </Badge>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {/* Show all tabs but make some unclickable based on permissions */}
              {[
                {
                  id: "dashboard",
                  label: "Dashboard",
                  icon: TrendingUp,
                  permission: "view_dashboard",
                },
                {
                  id: "bookings",
                  label: "Bookings",
                  icon: Calendar,
                  permission: "manage_bookings",
                },
                {
                  id: "customers",
                  label: "Customers",
                  icon: Users,
                  permission: "manage_customers",
                },
                {
                  id: "products",
                  label: "Products",
                  icon: Package,
                  permission: "manage_products",
                },
                {
                  id: "reports",
                  label: "Reports",
                  icon: BarChart3,
                  permission: "view_reports",
                },
                {
                  id: "pos",
                  label: "POS",
                  icon: ShoppingCart,
                  permission: "pos_access",
                },
              ].map((tab) => {
                const hasAccess = hasPermission(tab.permission);
                return (
                  <button
                    key={tab.id}
                    onClick={() => hasAccess && setActiveTab(tab.id as any)}
                    disabled={!hasAccess}
                    className={`flex items-center px-3 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? "border-slate-800 text-slate-800"
                        : hasAccess
                        ? "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        : "border-transparent text-gray-300 cursor-not-allowed opacity-50"
                    }`}
                    title={
                      !hasAccess
                        ? "Access denied - Contact your administrator"
                        : ""
                    }
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.label}
                    {!hasAccess && (
                      <Shield className="h-3 w-3 ml-1 text-gray-400" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "dashboard" && hasPermission("view_dashboard") && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Dashboard Content */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Today's Schedule
                    </CardTitle>
                    <CardDescription>
                      View and manage your appointments for{" "}
                      {new Date(selectedDate).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <Label htmlFor="date">Select Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    {bookings.length === 0 ? (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No bookings scheduled
                        </h3>
                        <p className="text-gray-600">
                          You have no appointments for this date.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {bookings.map((booking) => (
                          <Card
                            key={booking.id}
                            className="border-l-4 border-l-blue-500"
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg">
                                    {booking.customer_name}
                                  </h3>
                                  <p className="text-gray-600">
                                    {booking.service_name}
                                  </p>
                                </div>
                                <Badge
                                  className={getStatusColor(booking.status)}
                                >
                                  <span className="flex items-center">
                                    {getStatusIcon(booking.status)}
                                    <span className="ml-1 capitalize">
                                      {booking.status}
                                    </span>
                                  </span>
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="h-4 w-4 mr-2" />
                                  {booking.booking_time} ({booking.duration}{" "}
                                  min)
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <span className="font-medium">
                                    ${booking.price}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {booking.customer_phone}
                                </div>
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {booking.customer_email}
                                </div>
                              </div>

                              {booking.notes && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <p className="text-sm text-gray-700">
                                    <strong>Notes:</strong> {booking.notes}
                                  </p>
                                </div>
                              )}

                              <div className="flex space-x-2 mt-4">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Confirm
                                </Button>
                                <Button size="sm" variant="outline">
                                  Reschedule
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Business Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Business Info
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Business Name
                      </Label>
                      <p className="text-gray-900">{config?.business.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Phone
                      </Label>
                      <p className="text-gray-900">{config?.business.phone}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <p className="text-gray-900">{config?.business.email}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Star className="h-5 w-5 mr-2" />
                      Today's Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Bookings</span>
                      <span className="font-semibold">{bookings.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmed</span>
                      <span className="font-semibold text-green-600">
                        {
                          bookings.filter((b) => b.status === "confirmed")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pending</span>
                      <span className="font-semibold text-yellow-600">
                        {bookings.filter((b) => b.status === "pending").length}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveTab("bookings")}
                    >
                      View All Bookings
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveTab("pos")}
                    >
                      Open POS
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => setActiveTab("customers")}
                    >
                      Manage Customers
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "bookings" && hasPermission("manage_bookings") && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    All Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card
                        key={booking.id}
                        className="border-l-4 border-l-blue-500"
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {booking.customer_name}
                              </h3>
                              <p className="text-gray-600">
                                {booking.service_name}
                              </p>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              <span className="flex items-center">
                                {getStatusIcon(booking.status)}
                                <span className="ml-1 capitalize">
                                  {booking.status}
                                </span>
                              </span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2" />
                              {new Date(
                                booking.booking_date
                              ).toLocaleDateString()}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-2" />
                              {booking.booking_time} ({booking.duration} min)
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {booking.customer_phone}
                            </div>
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-1" />
                              {booking.customer_email}
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />$
                              {booking.price}
                            </div>
                          </div>

                          {booking.notes && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-700">
                                <strong>Notes:</strong> {booking.notes}
                              </p>
                            </div>
                          )}

                          <div className="flex space-x-2 mt-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline">
                              Reschedule
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "customers" && hasPermission("manage_customers") && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Customers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customers.map((customer) => (
                      <Card key={customer.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {customer.name}
                              </h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-1" />
                                  {customer.email}
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-1" />
                                  {customer.phone}
                                </div>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "products" && hasPermission("manage_products") && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <Card key={product.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {product.name}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {product.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                                <span className="font-medium">
                                  ${product.price}
                                </span>
                                <span>Stock: {product.stock}</span>
                              </div>
                            </div>
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "reports" && hasPermission("view_reports") && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Reports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-8 w-8 text-blue-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Bookings
                            </p>
                            <p className="text-2xl font-bold">
                              {stats?.stats?.todayBookings || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <DollarSign className="h-8 w-8 text-green-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">
                              Today's Sales
                            </p>
                            <p className="text-2xl font-bold">
                              ${stats?.stats?.todaySales || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Users className="h-8 w-8 text-purple-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Customers
                            </p>
                            <p className="text-2xl font-bold">
                              {stats?.stats?.customers || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Package className="h-8 w-8 text-orange-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600">
                              Total Products
                            </p>
                            <p className="text-2xl font-bold">
                              {stats?.stats?.products || 0}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "pos" && hasPermission("pos_access") && (
            <div className="h-[calc(100vh-200px)]">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h2 className="text-lg font-semibold">Point of Sale</h2>
                  <p className="text-sm text-gray-600">
                    Process transactions and manage sales
                  </p>
                </div>
                <div className="p-4">
                  <EmbeddedPOS
                    onTransactionComplete={handleTransactionComplete}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Access Denied for current tab */}
          {!hasPermission(getPermissionForTab(activeTab)) && (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600">
                You don't have permission to access this section.
              </p>
            </div>
          )}
        </main>
      </div>
    </PageTransition>
  );
};

export default StaffPortal;
