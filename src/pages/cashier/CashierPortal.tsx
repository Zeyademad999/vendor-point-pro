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
import { useToast } from "@/hooks/use-toast";
import { clientService, WebsiteConfig } from "@/services/clients";
import EmbeddedPOS from "@/components/EmbeddedPOS";
import OfflinePOS from "@/components/OfflinePOS";
import {
  ShoppingCart,
  DollarSign,
  CreditCard,
  Receipt,
  Clock,
  TrendingUp,
  ArrowRight,
  LogOut,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageTransition from "@/components/PageTransition";

const CashierPortal = () => {
  const [searchParams] = useSearchParams();
  const subdomain = searchParams.get("subdomain");
  const { toast } = useToast();
  const [config, setConfig] = useState<WebsiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (subdomain) {
      loadCashierData();
    }
  }, [subdomain]);

  const loadCashierData = async () => {
    try {
      setLoading(true);

      // Load website config
      const configResponse = await clientService.getWebsiteConfig(subdomain!);
      if (configResponse.success) {
        setConfig(configResponse.data);
      }

      // Load dashboard stats
      const statsResponse = await clientService.getClientDashboard();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error("Error loading cashier data:", error);
      toast({
        title: "Error",
        description: "Failed to load cashier data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-800 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">
              Loading cashier portal...
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!config) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              Cashier Portal Not Found
            </h1>
            <p className="text-gray-600">
              The requested cashier portal could not be found.
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
                  Cashier Portal
                </h1>
                <p className="text-gray-600">
                  {config.business.name} - Process sales and transactions
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline">Cashier</Badge>
                <Button variant="outline" onClick={() => window.history.back()}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <Tabs defaultValue="online" className="h-full">
            <div className="p-4 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="online" className="flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Online POS
                </TabsTrigger>
                <TabsTrigger
                  value="offline"
                  className="flex items-center gap-2"
                >
                  <WifiOff className="h-4 w-4" />
                  Offline POS
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="online" className="h-full m-0">
              <EmbeddedPOS
                onTransactionComplete={() => {
                  // Refresh stats after transaction
                  loadCashierData();
                }}
              />
            </TabsContent>

            <TabsContent value="offline" className="h-full m-0">
              <OfflinePOS />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageTransition>
  );
};

export default CashierPortal;
