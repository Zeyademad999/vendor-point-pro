import { apiService } from "./api";

export interface Service {
  id?: number;
  name: string;
  description?: string;
  price: number;
  duration?: number;
  booking_enabled?: boolean;
  available_times?: string[];
  images?: string[];
  active?: boolean;
  category_id?: number;
  category_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ServiceFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export interface ServiceResponse {
  success: boolean;
  data: Service[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceCategory {
  id: number;
  name: string;
}

export interface AvailabilityCheck {
  success: boolean;
  data: {
    isAvailable: boolean;
    service: Service;
    conflictingBookings: any[];
  };
}

export const serviceService = {
  // Get all services with filters
  getServices: async (
    filters: ServiceFilters = {}
  ): Promise<ServiceResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<ServiceResponse>(
      `/services?${params.toString()}`
    );
    return response;
  },

  // Get single service by ID
  getService: async (
    id: number
  ): Promise<{ success: boolean; data: Service }> => {
    const response = await apiService.get<{ success: boolean; data: Service }>(
      `/services/${id}`
    );
    return response;
  },

  // Create new service
  createService: async (
    service: Omit<Service, "id" | "created_at" | "updated_at">
  ): Promise<{ success: boolean; message: string; data: Service }> => {
    console.log("serviceService.createService called with:", service);
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: Service;
    }>("/services", service);
    return response;
  },

  // Update service
  updateService: async (
    id: number,
    service: Partial<Service>
  ): Promise<{ success: boolean; message: string; data: Service }> => {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: Service;
    }>(`/services/${id}`, service);
    return response;
  },

  // Delete service
  deleteService: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete<{
      success: boolean;
      message: string;
    }>(`/services/${id}`);
    return response;
  },

  // Check service availability
  checkAvailability: async (
    serviceId: number,
    date: string,
    time: string
  ): Promise<AvailabilityCheck> => {
    const response = await apiService.get<AvailabilityCheck>(
      `/services/availability?serviceId=${serviceId}&date=${date}&time=${time}`
    );
    return response;
  },

  // Get service categories
  getCategories: async (): Promise<{
    success: boolean;
    data: ServiceCategory[];
  }> => {
    const response = await apiService.get<{
      success: boolean;
      data: ServiceCategory[];
    }>("/services/categories");
    return response;
  },

  // Create new category
  createCategory: async (category: {
    name: string;
    client_id: number;
  }): Promise<{ success: boolean; message: string; data: ServiceCategory }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: ServiceCategory;
    }>("/categories", category);
    return response;
  },
};
