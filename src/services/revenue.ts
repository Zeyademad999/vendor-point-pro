import { apiService } from "./api";

// Types
export interface Revenue {
  id: number;
  client_id: number;
  title: string;
  amount: number;
  currency: string;
  category: string;
  source: string;
  payment_method: string;
  status: string;
  received_date?: string;
  description?: string;
  reference_number: string;
  is_recurring: boolean;
  recurrence_type?: string;
  created_at: string;
  updated_at: string;
}

export interface RevenueStats {
  totalRevenue: number;
  revenueByCategory: Array<{
    category: string;
    total: number;
  }>;
  revenueBySource: Array<{
    source: string;
    total: number;
  }>;
  revenueByStatus: Array<{
    status: string;
    total: number;
    count: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    total: number;
  }>;
  period: string;
}

export interface CreateRevenueData {
  title: string;
  amount: number;
  category: string;
  source: string;
  payment_method?: string;
  status?: string;
  received_date?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
}

export interface UpdateRevenueData {
  title?: string;
  amount?: number;
  category?: string;
  source?: string;
  payment_method?: string;
  status?: string;
  received_date?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
}

export interface RevenueFilters {
  page?: number;
  limit?: number;
  category?: string;
  source?: string;
  status?: string;
  search?: string;
}

export interface RevenueResponse {
  success: boolean;
  data: {
    revenue: Revenue[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface RevenueStatsResponse {
  success: boolean;
  data: RevenueStats;
}

// Service functions
export const revenueService = {
  // Get all revenue with filters
  getRevenue: async (
    filters: RevenueFilters = {}
  ): Promise<RevenueResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get(`/revenue?${params.toString()}`);
    return response;
  },

  // Get revenue by ID
  getRevenueById: async (
    id: number
  ): Promise<{ success: boolean; data: Revenue }> => {
    const response = await apiService.get(`/revenue/${id}`);
    return response;
  },

  // Create new revenue
  createRevenue: async (
    data: CreateRevenueData
  ): Promise<{ success: boolean; message: string; data: Revenue }> => {
    const response = await apiService.post("/revenue", data);
    return response;
  },

  // Update revenue
  updateRevenue: async (
    id: number,
    data: UpdateRevenueData
  ): Promise<{ success: boolean; message: string; data: Revenue }> => {
    const response = await apiService.put(`/revenue/${id}`, data);
    return response;
  },

  // Delete revenue
  deleteRevenue: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete(`/revenue/${id}`);
    return response;
  },

  // Get revenue statistics
  getRevenueStats: async (
    dateRange: string = "30"
  ): Promise<RevenueStatsResponse> => {
    const response = await apiService.get(
      `/revenue/stats?dateRange=${dateRange}`
    );
    return response;
  },

  // Bulk delete revenue
  bulkDeleteRevenue: async (
    revenueIds: number[]
  ): Promise<{ success: boolean; message: string }> => {
    console.log("Service: Bulk deleting revenue IDs:", revenueIds);
    const response = await apiService.delete("/revenue/bulk", {
      data: { revenueIds },
    });
    console.log("Service: Bulk delete response:", response);
    return response;
  },
};
