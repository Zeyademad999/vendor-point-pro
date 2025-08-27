import React from "react";
import { Navigate } from "react-router-dom";
import { useStaffAuth } from "@/contexts/StaffAuthContext";

interface StaffProtectedRouteProps {
  children: React.ReactNode;
  requiredPortal?: "staff" | "cashier" | "admin";
  requiredPermission?: string;
}

const StaffProtectedRoute: React.FC<StaffProtectedRouteProps> = ({
  children,
  requiredPortal,
  requiredPermission,
}) => {
  const { isAuthenticated, loading, hasPortalAccess, hasPermission } =
    useStaffAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/staff/login" replace />;
  }

  if (requiredPortal && !hasPortalAccess(requiredPortal)) {
    return <Navigate to="/staff/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/staff/login" replace />;
  }

  return <>{children}</>;
};

export default StaffProtectedRoute;
