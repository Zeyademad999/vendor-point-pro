import { apiService } from "./api";

// Types
export interface Cost {
  id: number;
  client_id: number;
  title: string;
  amount: number;
  currency: string;
  category: string;
  payment_method: string;
  status: string;
  due_date?: string;
  description?: string;
  reference_number: string;
  is_recurring: boolean;
  recurrence_type?: string;
  created_at: string;
  updated_at: string;
}

export interface CostStats {
  totalCosts: number;
  costsByCategory: Array<{
    category: string;
    total: number;
  }>;
  costsByStatus: Array<{
    status: string;
    total: number;
    count: number;
  }>;
  monthlyCosts: Array<{
    month: string;
    total: number;
  }>;
  period: string;
  // All-time stats for stat cards
  allTimeTotalCosts: number;
  allTimeCostsByStatus: Array<{
    status: string;
    total: number;
    count: number;
  }>;
}

export interface CreateCostData {
  title: string;
  amount: number;
  category: string;
  payment_method?: string;
  status?: string;
  due_date?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
}

export interface UpdateCostData {
  title?: string;
  amount?: number;
  category?: string;
  payment_method?: string;
  status?: string;
  due_date?: string;
  description?: string;
  is_recurring?: boolean;
  recurrence_type?: string;
}

export interface CostFilters {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
}

export interface CostsResponse {
  success: boolean;
  data: {
    costs: Cost[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface CostStatsResponse {
  success: boolean;
  data: CostStats;
}

// Service functions
export const costsService = {
  // Get all costs with filters
  getCosts: async (filters: CostFilters = {}): Promise<CostsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get(`/costs?${params.toString()}`);
    return response;
  },

  // Get cost by ID
  getCost: async (id: number): Promise<{ success: boolean; data: Cost }> => {
    const response = await apiService.get(`/costs/${id}`);
    return response;
  },

  // Create new cost
  createCost: async (
    data: CreateCostData
  ): Promise<{ success: boolean; message: string; data: Cost }> => {
    const response = await apiService.post("/costs", data);
    return response;
  },

  // Update cost
  updateCost: async (
    id: number,
    data: UpdateCostData
  ): Promise<{ success: boolean; message: string; data: Cost }> => {
    const response = await apiService.put(`/costs/${id}`, data);
    return response;
  },

  // Delete cost
  deleteCost: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete(`/costs/${id}`);
    return response;
  },

  // Get cost statistics
  getCostStats: async (
    dateRange: string = "30"
  ): Promise<CostStatsResponse> => {
    const response = await apiService.get(
      `/costs/stats?dateRange=${dateRange}`
    );
    return response;
  },

  // Bulk delete costs
  bulkDeleteCosts: async (
    costIds: number[]
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete("/costs/bulk", {
      data: { costIds },
    });
    return response;
  },
};
