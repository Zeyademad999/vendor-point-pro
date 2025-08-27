import { apiService } from "./api";

export interface StaffPermissions {
  view_dashboard: boolean;
  manage_bookings: boolean;
  manage_customers: boolean;
  manage_products: boolean;
  manage_services: boolean;
  view_reports: boolean;
  pos_access: boolean;
  manage_staff: boolean;
  manage_settings: boolean;
}

export interface Staff {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  photo?: string;
  salary?: number;
  working_hours?: string;
  permissions?: StaffPermissions;
  notes?: string;
  active?: boolean;
  hire_date?: string;
  username?: string;
  portal_access?: "staff" | "cashier" | "admin" | "all";
  can_login?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StaffFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface StaffResponse {
  success: boolean;
  data: Staff[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StaffPerformance {
  success: boolean;
  data: {
    totalStaff: number;
    performanceData: Array<{
      name: string;
      role: string;
      total_sales: number;
      total_revenue: number;
      avg_sale: number;
    }>;
    staffByRole: Array<{
      role: string;
      count: number;
    }>;
    totalSalary: number;
  };
}

export const staffService = {
  // Get public staff list for customer booking
  getPublicStaff: async (
    clientId: number
  ): Promise<{ success: boolean; data: any[] }> => {
    const response = await apiService.get<any[]>(
      `/staff/public?client_id=${clientId}`
    );
    return response;
  },

  // Get all staff with filters
  getStaff: async (filters: StaffFilters = {}): Promise<StaffResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<StaffResponse>(
      `/staff?${params.toString()}`
    );
    return response;
  },

  // Get single staff member by ID
  getStaffMember: async (
    id: number
  ): Promise<{ success: boolean; data: Staff }> => {
    const response = await apiService.get<{ success: boolean; data: Staff }>(
      `/staff/${id}`
    );
    return response;
  },

  // Create new staff member
  createStaff: async (
    staff: Omit<Staff, "id" | "created_at" | "updated_at">
  ): Promise<{ success: boolean; message: string; data: Staff }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: Staff;
    }>("/staff", staff);
    return response;
  },

  // Update staff member
  updateStaff: async (
    id: number,
    staff: Partial<Staff>
  ): Promise<{ success: boolean; message: string; data: Staff }> => {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: Staff;
    }>(`/staff/${id}`, staff);
    return response;
  },

  // Delete staff member
  deleteStaff: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete<{
      success: boolean;
      message: string;
    }>(`/staff/${id}`);
    return response;
  },

  // Get staff performance analytics
  getPerformance: async (
    period: string = "month"
  ): Promise<StaffPerformance> => {
    const response = await apiService.get<StaffPerformance>(
      `/staff/performance?period=${period}`
    );
    return response;
  },

  // Get individual staff schedule
  getStaffSchedule: async (
    staffId: number,
    date?: string
  ): Promise<{ success: boolean; data: StaffSchedule }> => {
    const params = new URLSearchParams();
    if (date) {
      params.append("date", date);
    }

    const response = await apiService.get<{
      success: boolean;
      data: StaffSchedule;
    }>(`/staff/${staffId}/schedule?${params.toString()}`);
    return response;
  },
};
