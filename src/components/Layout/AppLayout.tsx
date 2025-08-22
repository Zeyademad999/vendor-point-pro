import React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { BarChart3, ShoppingBag, Users, Package, Calendar, Settings, LogOut, Zap } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
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

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
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
              <SidebarTrigger />
            </div>
          </header>
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;