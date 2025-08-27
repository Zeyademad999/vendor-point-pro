import { apiService } from "./api";

export interface Customer {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  birthday?: string;
  address?: string;
  notes?: string;
  birthday_greetings?: boolean;
  loyalty_points?: number;
  total_spent?: number;
  last_visit?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface CustomerResponse {
  success: boolean;
  data: Customer[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CustomerAnalytics {
  success: boolean;
  data: {
    totalCustomers: number;
    newCustomers: number;
    topCustomers: Array<{
      name: string;
      email: string;
      total_spent: number;
    }>;
    growthData: Array<{
      date: string;
      count: number;
    }>;
  };
}

export const customerService = {
  // Get all customers with filters
  getCustomers: async (
    filters: CustomerFilters = {}
  ): Promise<CustomerResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<CustomerResponse>(
      `/customers?${params.toString()}`
    );
    return response;
  },

  // Get single customer by ID
  getCustomer: async (
    id: number
  ): Promise<{ success: boolean; data: Customer }> => {
    const response = await apiService.get<{ success: boolean; data: Customer }>(
      `/customers/${id}`
    );
    return response;
  },

  // Create new customer
  createCustomer: async (
    customer: Omit<Customer, "id" | "created_at" | "updated_at">
  ): Promise<{ success: boolean; message: string; data: Customer }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: Customer;
    }>("/customers", customer);
    return response;
  },

  // Update customer
  updateCustomer: async (
    id: number,
    customer: Partial<Customer>
  ): Promise<{ success: boolean; message: string; data: Customer }> => {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: Customer;
    }>(`/customers/${id}`, customer);
    return response;
  },

  // Delete customer
  deleteCustomer: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete<{
      success: boolean;
      message: string;
    }>(`/customers/${id}`);
    return response;
  },

  // Get customer analytics
  getAnalytics: async (
    period: string = "month"
  ): Promise<CustomerAnalytics> => {
    const response = await apiService.get<CustomerAnalytics>(
      `/customers/analytics?period=${period}`
    );
    return response;
  },
};
