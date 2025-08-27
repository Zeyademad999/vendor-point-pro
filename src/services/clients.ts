import { apiService } from "./api";

export interface ClientRegistrationData {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  password: string;
  businessType: string;
  subdomain: string;
  plan: string;
}

export interface WebsiteConfig {
  id: number; // Client ID for public orders
  business: {
    name: string;
    type: string;
    email: string;
    phone: string;
    subdomain: string;
  };
  website: {
    theme: string;
    colors: {
      primary: string;
      secondary: string;
      backgroundColor: string;
      textColor: string;
      buttonColor: string;
      buttonTextColor: string;
      accentColor: string;
      borderColor: string;
    };
    logo: string | null;
    hero: {
      title: string;
      subtitle: string;
    };
    url: string;
  };
  services: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    duration: number;
    images: string[] | null;
  }>;
  products: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[] | null;
  }>;
  staff: Array<{
    id: number;
    name: string;
    email: string;
    phone: string;
    photo: string | null;
  }>;
}

export interface ClientDashboard {
  stats: {
    customers: number;
    products: number;
    services: number;
    staff: number;
    todaySales: number;
    todayBookings: number;
  };
  recentTransactions: Array<{
    id: number;
    receipt_number: string;
    total: number;
    payment_status: string;
    created_at: string;
    customer_name: string | null;
  }>;
  recentBookings: Array<{
    id: number;
    booking_date: string;
    booking_time: string;
    status: string;
    customer_name: string | null;
    service_name: string | null;
  }>;
}

export interface ClientPortal {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
}

export interface ClientPortals {
  client: {
    name: string;
    subdomain: string;
    subscription_plan: string;
    trial_ends_at: string;
  };
  portals: ClientPortal[];
}

export const clientService = {
  // Register new client
  registerClient: async (
    data: ClientRegistrationData
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      user: {
        id: number;
        email: string;
        name: string;
        role: string;
        status: string;
        subdomain: string;
        subscription_plan: string;
        trial_ends_at: string;
      };
      website: string;
    };
  }> => {
    const response = await apiService.post("/clients/register", data);
    return response;
  },

  // Get website configuration
  getWebsiteConfig: async (
    subdomain: string
  ): Promise<{
    success: boolean;
    data: WebsiteConfig;
  }> => {
    const response = await apiService.get(`/clients/website/${subdomain}`);
    return response;
  },

  // Get client dashboard data
  getClientDashboard: async (): Promise<{
    success: boolean;
    data: ClientDashboard;
  }> => {
    const response = await apiService.get("/clients/dashboard");
    return response;
  },

  // Get client portals
  getClientPortals: async (): Promise<{
    success: boolean;
    data: ClientPortals;
  }> => {
    const response = await apiService.get("/clients/portals");
    return response;
  },

  // Get website settings
  getWebsiteSettings: async (): Promise<{
    success: boolean;
    data: {
      hero: {
        title: string;
        subtitle: string;
      };
      theme: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        textColor: string;
        buttonColor: string;
        buttonTextColor: string;
        accentColor: string;
        borderColor: string;
      };
    };
  }> => {
    const response = await apiService.get("/clients/website-settings");
    return response;
  },

  // Update website settings
  updateWebsiteSettings: async (settings: {
    hero: {
      title: string;
      subtitle: string;
    };
    theme: {
      primaryColor: string;
      secondaryColor: string;
      backgroundColor: string;
      textColor: string;
      buttonColor: string;
      buttonTextColor: string;
      accentColor: string;
      borderColor: string;
    };
  }): Promise<{
    success: boolean;
    message: string;
    data: any;
  }> => {
    const response = await apiService.put(
      "/clients/website-settings",
      settings
    );
    return response;
  },
};
