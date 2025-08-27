import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  staffAuthService,
  Staff,
  Business,
  StaffLoginData,
} from "../services/staffAuth";
import { useAuth } from "./AuthContext";

interface StaffAuthContextType {
  staff: Staff | null;
  business: Business | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    data: StaffLoginData
  ) => Promise<"staff" | "cashier" | "admin" | "all">;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPortalAccess: (portal: "staff" | "cashier" | "admin") => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  getPortalAccess: () => "staff" | "cashier" | "admin" | "all" | null;
}

const StaffAuthContext = createContext<StaffAuthContextType | undefined>(
  undefined
);

interface StaffAuthProviderProps {
  children: ReactNode;
}

export const StaffAuthProvider: React.FC<StaffAuthProviderProps> = ({
  children,
}) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Get main auth context to check if user is already authenticated
  const { user: mainUser, isAuthenticated: mainAuth } = useAuth();

  // Initialize staff auth state only for staff/cashier routes
  useEffect(() => {
    const initializeStaffAuth = async () => {
      try {
        // Only initialize if we're on a staff/cashier route and no main user is authenticated
        const isStaffRoute =
          window.location.pathname.startsWith("/staff") ||
          window.location.pathname.startsWith("/cashier");

        // Don't initialize staff auth if main user is already authenticated (unless on staff routes)
        if (mainAuth && !isStaffRoute) {
          setLoading(false);
          return;
        }

        if (isStaffRoute && staffAuthService.isAuthenticated()) {
          // Get staff from localStorage first
          const currentStaff = staffAuthService.getCurrentStaff();
          const currentBusiness = staffAuthService.getCurrentBusiness();

          if (currentStaff && currentBusiness) {
            setStaff(currentStaff);
            setBusiness(currentBusiness);
          }

          // Then refresh from server
          await refreshProfile();
        } else {
          // Not a staff route, don't initialize staff auth
          setLoading(false);
        }
      } catch (error) {
        console.error("Staff auth initialization error:", error);
        // Clear invalid auth data
        localStorage.removeItem("staff_token");
        localStorage.removeItem("staff_data");
        localStorage.removeItem("business_data");
        setStaff(null);
        setBusiness(null);
        setLoading(false);
      }
    };

    initializeStaffAuth();
  }, [mainAuth]);

  const login = async (data: StaffLoginData) => {
    try {
      setLoading(true);
      const response = await staffAuthService.login(data);

      if (response.success && response.data) {
        setStaff(response.data.staff);
        setBusiness(response.data.business);

        // Return portal access for redirection handling
        return response.data.staff.portal_access || "staff";
      } else {
        throw new Error(response.message || "Staff login failed");
      }
    } catch (error) {
      console.error("Staff login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await staffAuthService.logout();
      setStaff(null);
      setBusiness(null);
    } catch (error) {
      console.error("Staff logout error:", error);
      // Still clear staff state even if API call fails
      setStaff(null);
      setBusiness(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await staffAuthService.getProfile();

      if (response.success && response.data) {
        setStaff(response.data.staff);
        setBusiness(response.data.business);

        // Update localStorage
        localStorage.setItem("staff_data", JSON.stringify(response.data.staff));
        localStorage.setItem(
          "business_data",
          JSON.stringify(response.data.business)
        );
      } else {
        throw new Error(response.message || "Failed to refresh staff profile");
      }
    } catch (error) {
      console.error("Refresh staff profile error:", error);
      // If refresh fails, logout staff
      await logout();
      throw error;
    }
  };

  const hasPortalAccess = (portal: "staff" | "cashier" | "admin"): boolean => {
    return staffAuthService.hasPortalAccess(portal);
  };

  const hasPermission = (permission: string): boolean => {
    return staffAuthService.hasPermission(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return staffAuthService.hasAnyPermission(permissions);
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return staffAuthService.hasAllPermissions(permissions);
  };

  const getPortalAccess = (): "staff" | "cashier" | "admin" | "all" | null => {
    return staffAuthService.getPortalAccess();
  };

  const value: StaffAuthContextType = {
    staff,
    business,
    loading,
    isAuthenticated: !!staff,
    login,
    logout,
    refreshProfile,
    hasPortalAccess,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getPortalAccess,
  };

  return (
    <StaffAuthContext.Provider value={value}>
      {children}
    </StaffAuthContext.Provider>
  );
};

export const useStaffAuth = (): StaffAuthContextType => {
  const context = useContext(StaffAuthContext);
  if (context === undefined) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return context;
};
