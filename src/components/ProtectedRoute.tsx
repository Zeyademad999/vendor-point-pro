import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: "admin" | "client";
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requireRole,
  redirectTo,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    const authLog = `[${new Date().toISOString()}] ProtectedRoute: User not authenticated, redirecting to login. User: ${JSON.stringify(
      user
    )}, isAuthenticated: ${isAuthenticated}`;
    localStorage.setItem(
      "debug_logs",
      (localStorage.getItem("debug_logs") || "") + "\n" + authLog
    );
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If user is authenticated but shouldn't be (e.g., login page)
  if (!requireAuth && isAuthenticated) {
    // For login page, redirect based on user role
    let redirectPath = redirectTo || "/dashboard";

    if (user?.role === "staff") {
      redirectPath = "/staff";
    } else if (user?.role === "cashier") {
      redirectPath = "/cashier";
    } else if (user?.role === "admin" || user?.role === "client") {
      redirectPath = "/dashboard";
    }

    return <Navigate to={redirectPath} replace />;
  }

  // If specific role is required
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
