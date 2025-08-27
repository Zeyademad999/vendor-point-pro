import { apiService, ApiResponse } from "./api";

// User types
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "client" | "staff" | "cashier";
  status: "active" | "suspended" | "trial";
  subdomain?: string;
  settings?: Record<string, unknown>;
  business_id?: number;
  business_name?: string;
  portal_access?: "staff" | "cashier" | "admin" | "all";
  permissions?: Record<string, unknown>; // Staff permissions
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  subdomain?: string;
  businessType?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Authentication service
export const authService = {
  // Login user
  login: async (data: LoginData): Promise<ApiResponse<AuthResponse>> => {
    console.log("AuthService: Attempting login with:", data);
    const response = await apiService.post<AuthResponse>("/auth/login", data);
    console.log("AuthService: Login response:", response);

    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      console.log("AuthService: Stored token and user data");
    }

    return response;
  },

  // Register user
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiService.post<AuthResponse>(
      "/auth/register",
      data
    );

    if (response.success && response.data) {
      // Store token and user data
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  },

  // Get current user profile
  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return await apiService.get<{ user: User }>("/auth/profile");
  },

  // Update user profile
  updateProfile: async (
    data: Partial<User>
  ): Promise<ApiResponse<{ user: User }>> => {
    const response = await apiService.put<{ user: User }>(
      "/auth/profile",
      data
    );

    if (response.success && response.data) {
      // Update stored user data
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response;
  },

  // Change password
  changePassword: async (
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<void>> => {
    return await apiService.post<void>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  // Logout
  logout: async (): Promise<ApiResponse<void>> => {
    try {
      // Only call logout API if we have a token
      const token = localStorage.getItem("token");
      if (token) {
        await apiService.post<void>("/auth/logout");
      }
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn("Logout API call failed:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return { success: true, message: "Logged out successfully" };
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return !!(token && user);
  },

  // Get current user from localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  },

  // Get token from localStorage
  getToken: (): string | null => {
    return localStorage.getItem("token");
  },

  // Check if user has specific role
  hasRole: (role: "admin" | "client"): boolean => {
    const user = authService.getCurrentUser();
    return user?.role === role;
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    return authService.hasRole("admin");
  },

  // Check if user is client
  isClient: (): boolean => {
    return authService.hasRole("client");
  },

  // Check if account is active
  isActive: (): boolean => {
    const user = authService.getCurrentUser();
    return user?.status === "active" || user?.status === "trial";
  },
};
