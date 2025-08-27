import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  ShoppingBag,
  Users,
  Package,
  Calendar,
  Settings,
  LogOut,
  Zap,
  Wrench,
  UserCheck,
  Globe,
  ExternalLink,
  ChevronDown,
  UserPlus,
  CreditCard,
  Shield,
  Wallet,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { clientService, ClientPortals } from "@/services/clients";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/PageTransition";
import RateLimitNotification from "@/components/RateLimitNotification";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [portals, setPortals] = useState<ClientPortals | null>(null);
  const [showPortals, setShowPortals] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debug user state
  console.log("AppLayout: Current user:", user);
  console.log("AppLayout: User role:", user?.role);
  console.log("AppLayout: User business_id:", user?.business_id);
  console.log("AppLayout: User name:", user?.name);
  console.log("AppLayout: User subdomain:", user?.subdomain);

  useEffect(() => {
    console.log(
      "AppLayout: User changed, loading portals if needed. User:",
      user
    );
    if (user && user.role === "client") {
      console.log("AppLayout: Loading portals for client user");
      loadPortals();
    } else {
      // Clear portals if user is not a client
      console.log("AppLayout: Clearing portals - user is not a client");
      setPortals(null);
    }
  }, [user]);

  const loadPortals = async () => {
    try {
      console.log("AppLayout: Starting to load portals");
      setLoading(true);
      const response = await clientService.getClientPortals();
      console.log("AppLayout: Portal response:", response);
      if (response.success) {
        console.log("AppLayout: Setting portals:", response.data);
        setPortals(response.data);
      } else {
        console.error("AppLayout: Portal loading failed:", response);
      }
    } catch (error) {
      console.error("AppLayout: Error loading portals:", error);
    } finally {
      setLoading(false);
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

  // Organized menu items by category
  const organizedMenuItems = {
    overview: [{ title: "Dashboard", url: "/dashboard", icon: BarChart3 }],
    sales: [
      { title: "POS", url: "/pos", icon: ShoppingBag },
      { title: "Orders", url: "/dashboard/orders", icon: Package },
      {
        title: "Transactions",
        url: "/dashboard/transactions",
        icon: CreditCard,
      },
    ],
    inventory: [
      { title: "Products", url: "/dashboard/products", icon: Package },
      { title: "Services", url: "/dashboard/services", icon: Wrench },
    ],
    people: [
      { title: "Customers", url: "/dashboard/customers", icon: Users },
      { title: "Staff", url: "/dashboard/staff", icon: UserPlus },
    ],
    operations: [
      { title: "Bookings", url: "/dashboard/bookings", icon: Calendar },
    ],
    analytics: [
      { title: "Reports", url: "/dashboard/reports", icon: BarChart3 },
      { title: "Wallet", url: "/dashboard/wallet", icon: Wallet },
      { title: "Costs", url: "/dashboard/costs", icon: TrendingDown },
      { title: "Revenue", url: "/dashboard/revenue", icon: TrendingUp },
    ],
    business: [
      { title: "Website CMS", url: "/dashboard/website-cms", icon: Globe },
      { title: "Settings", url: "/dashboard/settings", icon: Settings },
    ],
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ProtectedRoute requireAuth={true}>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          {user && user.id ? (
            <Sidebar className="border-r">
              <div className="p-4 border-b">
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-lg">FlokiPOS</span>
                </div>
                {user && user.name && (
                  <div className="mt-2 text-sm text-muted-foreground">
                    Welcome, {user.name}
                  </div>
                )}
              </div>

              <SidebarContent>
                {/* Portal Switcher for Clients */}
                {user && user.role === "client" && portals && (
                  <SidebarGroup>
                    <SidebarGroupLabel>Portals</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            onClick={() => setShowPortals(!showPortals)}
                            className="w-full justify-between"
                          >
                            <div className="flex items-center">
                              <Globe className="h-4 w-4 mr-2" />
                              <span>Switch Portal</span>
                            </div>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                showPortals ? "rotate-180" : ""
                              }`}
                            />
                          </SidebarMenuButton>
                        </SidebarMenuItem>

                        {showPortals && (
                          <>
                            {portals.portals.map((portal) => (
                              <SidebarMenuItem key={portal.id} className="ml-4">
                                <SidebarMenuButton
                                  onClick={() => handlePortalClick(portal)}
                                  className="w-full justify-start"
                                >
                                  {getPortalIcon(portal.icon)}
                                  <span className="ml-2">{portal.name}</span>
                                  {portal.id === "customer" && (
                                    <ExternalLink className="h-3 w-3 ml-auto" />
                                  )}
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </>
                        )}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                )}

                {/* Overview */}
                <SidebarGroup>
                  <SidebarGroupLabel>Overview</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {organizedMenuItems.overview.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Sales */}
                <SidebarGroup>
                  <SidebarGroupLabel>Sales</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {organizedMenuItems.sales.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Inventory */}
                <SidebarGroup>
                  <SidebarGroupLabel>Inventory</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {organizedMenuItems.inventory.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* People */}
                <SidebarGroup>
                  <SidebarGroupLabel>People</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {organizedMenuItems.people.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Operations */}
                <SidebarGroup>
                  <SidebarGroupLabel>Operations</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {organizedMenuItems.operations.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Analytics */}
                <SidebarGroup>
                  <SidebarGroupLabel>Analytics</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {organizedMenuItems.analytics.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                {/* Business */}
                <SidebarGroup>
                  <SidebarGroupLabel>Business</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {organizedMenuItems.business.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              className={({ isActive }) =>
                                isActive
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              }
                            >
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
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </SidebarContent>
            </Sidebar>
          ) : (
            <div className="flex items-center justify-center w-64 border-r">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}

          <main className="flex-1">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="flex items-center justify-between p-4">
                <SidebarTrigger />
                <div className="flex items-center space-x-4">
                  {user && user.name && (
                    <span className="text-sm text-muted-foreground">
                      User: {user.name}
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {user?.role === "admin" ? "Administrator" : "User"}
                  </span>
                  {portals && portals.client && (
                    <span className="text-sm text-muted-foreground">
                      {portals.client.subdomain}.flokipos.com
                    </span>
                  )}
                  {portals && portals.portals && portals.portals.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Globe className="h-4 w-4" />
                          <span>Portals</span>
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {portals.portals.map((portal) => (
                          <DropdownMenuItem
                            key={portal.id}
                            onClick={() => handlePortalClick(portal)}
                            className="flex items-center space-x-2"
                          >
                            {getPortalIcon(portal.icon)}
                            <span>{portal.name}</span>
                            {portal.id === "customer" && (
                              <ExternalLink className="h-3 w-3 ml-auto" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </header>
            <div className="p-6">
              <RateLimitNotification />
              <AnimatePresence mode="wait">
                <PageTransition key={window.location.pathname}>
                  {children}
                </PageTransition>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export default AppLayout;
