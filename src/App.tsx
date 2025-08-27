import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import { StaffAuthProvider } from "./contexts/StaffAuthContext";
import AppLayout from "./components/Layout/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Products from "./pages/dashboard/Products";
import Customers from "./pages/dashboard/Customers";
import StaffEnhanced from "./pages/dashboard/StaffEnhanced";
import Services from "./pages/dashboard/Services";
import Bookings from "./pages/dashboard/Bookings";
import Reports from "./pages/dashboard/Reports";
import Settings from "./pages/dashboard/Settings";
import WebsiteCMS from "./pages/dashboard/WebsiteCMS";
import Orders from "./pages/dashboard/Orders";
import Transactions from "./pages/dashboard/Transactions";
import Wallet from "./pages/dashboard/Wallet";
import Costs from "./pages/dashboard/Costs";
import Revenue from "./pages/dashboard/Revenue";
import POSInterface from "./pages/pos/POSInterface";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientWebsite from "./pages/client-website/ClientWebsite";
import CheckoutPage from "./pages/client-website/CheckoutPage";
import StaffPortal from "./pages/staff/StaffPortal";
import StaffDashboard from "./pages/staff/StaffDashboard";
import CashierPortal from "./pages/cashier/CashierPortal";
import CashierDashboard from "./pages/cashier/CashierDashboard";
import StaffLogin from "./pages/staff/StaffLogin";
import CashierLogin from "./pages/cashier/CashierLogin";
import PortalSwitcher from "./components/PortalSwitcher";
import InternalLogin from "./components/InternalLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />

        {/* Dashboard routes with AppLayout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/products"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Products />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/customers"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Customers />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/staff"
          element={
            <ProtectedRoute>
              <AppLayout>
                <StaffEnhanced />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/services"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Services />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/bookings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Bookings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Reports />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/wallet"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Wallet />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/costs"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Costs />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/revenue"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Revenue />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Settings />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/website-cms"
          element={
            <ProtectedRoute>
              <AppLayout>
                <WebsiteCMS />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/orders"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Orders />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/transactions"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Transactions />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <AppLayout>
                <POSInterface />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/pos"
          element={
            <ProtectedRoute>
              <AppLayout>
                <POSInterface />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdminDashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/portals"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PortalSwitcher />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/website/:subdomain" element={<ClientWebsite />} />
        <Route path="/website/:subdomain/checkout" element={<CheckoutPage />} />

        {/* Staff Portal Routes */}
        <Route path="/staff/login" element={<StaffLogin />} />
        <Route
          path="/staff"
          element={
            <ProtectedRoute>
              <StaffPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute>
              <StaffDashboard />
            </ProtectedRoute>
          }
        />

        {/* Cashier Portal Routes */}
        <Route path="/cashier/login" element={<CashierLogin />} />
        <Route
          path="/cashier"
          element={
            <ProtectedRoute>
              <CashierPortal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cashier/dashboard"
          element={
            <ProtectedRoute>
              <CashierDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Portal Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StaffAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AnimatedRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </StaffAuthProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
