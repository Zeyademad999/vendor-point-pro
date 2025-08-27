import { apiService, ApiResponse } from "./api";

// Staff types
export interface Staff {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  salary: number;
  working_hours?: string;
  notes?: string;
  active: boolean;
  hire_date?: string;
  username?: string;
  portal_access: "staff" | "cashier" | "admin" | "all";
  can_login: boolean;
  permissions?: any;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: number;
  name: string;
  subdomain: string;
}

export interface StaffLoginData {
  username: string;
  password: string;
}

export interface StaffAuthResponse {
  staff: Staff;
  business: Business;
  token: string;
}

export interface StaffProfileResponse {
  staff: Staff;
  business: Business;
}

// Staff authentication service
export const staffAuthService = {
  // Staff login
  login: async (
    data: StaffLoginData
  ): Promise<ApiResponse<StaffAuthResponse>> => {
    const response = await apiService.post<StaffAuthResponse>(
      "/auth/staff/login",
      data
    );

    if (response.success && response.data) {
      // Store staff token and data
      localStorage.setItem("staff_token", response.data.token);
      localStorage.setItem("staff_data", JSON.stringify(response.data.staff));
      localStorage.setItem(
        "business_data",
        JSON.stringify(response.data.business)
      );
    }

    return response;
  },

  // Staff logout
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      // Only call logout API if we have a token
      const token = localStorage.getItem("staff_token");
      if (token) {
        await apiService.post<void>("/auth/staff/logout");
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Staff logout API call failed:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("staff_token");
      localStorage.removeItem("staff_data");
      localStorage.removeItem("business_data");
    }

    return { success: true, message: "Staff logged out successfully" };
  },

  // Get staff profile
  getProfile: async (): Promise<ApiResponse<StaffProfileResponse>> => {
    return await apiService.get<StaffProfileResponse>("/auth/staff/profile");
  },

  // Check if staff is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("staff_token");
    const staffData = localStorage.getItem("staff_data");
    return !!(token && staffData);
  },

  // Get current staff from localStorage
  getCurrentStaff: (): Staff | null => {
    const staffStr = localStorage.getItem("staff_data");
    if (staffStr) {
      try {
        return JSON.parse(staffStr);
      } catch (error) {
        console.error("Error parsing staff data:", error);
        return null;
      }
    }
    return null;
  },

  // Get current business from localStorage
  getCurrentBusiness: (): Business | null => {
    const businessStr = localStorage.getItem("business_data");
    if (businessStr) {
      try {
        return JSON.parse(businessStr);
      } catch (error) {
        console.error("Error parsing business data:", error);
        return null;
      }
    }
    return null;
  },

  // Get staff token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem("staff_token");
  },

  // Check if staff has specific portal access
  hasPortalAccess: (portal: "staff" | "cashier" | "admin"): boolean => {
    const staff = staffAuthService.getCurrentStaff();
    if (!staff) return false;

    return staff.portal_access === portal || staff.portal_access === "all";
  },

  // Check if staff has specific permission
  hasPermission: (permission: string): boolean => {
    const staff = staffAuthService.getCurrentStaff();
    if (!staff || !staff.permissions) return false;

    return staff.permissions[permission] === true;
  },

  // Check if staff has any of the specified permissions
  hasAnyPermission: (permissions: string[]): boolean => {
    const staff = staffAuthService.getCurrentStaff();
    if (!staff || !staff.permissions) return false;

    return permissions.some(
      (permission) => staff.permissions[permission] === true
    );
  },

  // Check if staff has all of the specified permissions
  hasAllPermissions: (permissions: string[]): boolean => {
    const staff = staffAuthService.getCurrentStaff();
    if (!staff || !staff.permissions) return false;

    return permissions.every(
      (permission) => staff.permissions[permission] === true
    );
  },

  // Get staff portal access
  getPortalAccess: (): "staff" | "cashier" | "admin" | "all" | null => {
    const staff = staffAuthService.getCurrentStaff();
    return staff?.portal_access || null;
  },

  // Check if staff is active
  isActive: (): boolean => {
    const staff = staffAuthService.getCurrentStaff();
    return staff?.active === true;
  },
};
