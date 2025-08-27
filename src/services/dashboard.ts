import { apiService } from "./api";

export interface DashboardStats {
  totalSales: number;
  totalTransactions: number;
  totalWebsiteOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalServices: number;
  totalBookings: number;
  todaySales: number;
  todayOrders: number;
  salesChange: number;
  ordersChange: number;
  customersChange: number;
  productsChange: number;
}

export interface RecentTransaction {
  id: string;
  customer: string;
  amount: number;
  type: "sale" | "booking";
  date: string;
  status: string;
  time: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentTransactions: RecentTransaction[];
  alerts: {
    lowStock: number;
    newBookings: number;
  };
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardResponse> => {
    const response = await apiService.get<DashboardResponse>("/dashboard");
    return response;
  },

  getTodayStats: async (): Promise<DashboardResponse> => {
    const response = await apiService.get<DashboardResponse>(
      "/dashboard/today"
    );
    return response;
  },
};
