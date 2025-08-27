import React, { useState, useEffect } from "react";
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
import { clientService, ClientPortals } from "@/services/clients";
import {
  Settings,
  Users,
  Globe,
  ExternalLink,
  ArrowRight,
  ShoppingCart,
} from "lucide-react";

const PortalSwitcher = () => {
  const [portals, setPortals] = useState<ClientPortals | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPortals();
  }, []);

  const loadPortals = async () => {
    try {
      const response = await clientService.getClientPortals();
      if (response.success) {
        setPortals(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to load portals",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error loading portals:", error);
      toast({
        title: "Error",
        description: "Failed to load portals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "settings":
        return <Settings className="h-6 w-6" />;
      case "users":
        return <Users className="h-6 w-6" />;
      case "globe":
        return <Globe className="h-6 w-6" />;
      case "shopping-cart":
        return <ShoppingCart className="h-6 w-6" />;
      default:
        return <Settings className="h-6 w-6" />;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!portals) {
    return null;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome, {portals.client.name}!
        </h2>
        <p className="text-muted-foreground">
          Choose which portal you'd like to access
        </p>
        <div className="flex items-center space-x-4 mt-2">
          <Badge variant="outline">
            Plan: {portals.client.subscription_plan}
          </Badge>
          <Badge variant="outline">
            Website: {portals.client.subdomain}.flokipos.com
          </Badge>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {portals.portals.map((portal) => (
          <Card
            key={portal.id}
            className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
            onClick={() => handlePortalClick(portal)}
          >
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-lg text-primary w-fit">
                {getIcon(portal.icon)}
              </div>
              <CardTitle className="text-xl">{portal.name}</CardTitle>
              <CardDescription className="text-center">
                {portal.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                className="w-full"
                variant={portal.id === "customer" ? "outline" : "default"}
              >
                {portal.id === "customer" ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit Website
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Access Portal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2">Quick Actions</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() =>
              window.open(`/website/${portals.client.subdomain}`, "_blank")
            }
            className="justify-start"
          >
            <Globe className="h-4 w-4 mr-2" />
            View My Website
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/dashboard")}
            className="justify-start"
          >
            <Settings className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PortalSwitcher;
