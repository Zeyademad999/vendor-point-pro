import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import Products from "./pages/dashboard/Products";
import Customers from "./pages/dashboard/Customers";
import Staff from "./pages/dashboard/Staff";
import Services from "./pages/dashboard/Services";
import Bookings from "./pages/dashboard/Bookings";
import POSInterface from "./pages/pos/POSInterface";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientWebsite from "./pages/client-website/ClientWebsite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/products" element={<Products />} />
          <Route path="/dashboard/customers" element={<Customers />} />
          <Route path="/dashboard/staff" element={<Staff />} />
          <Route path="/dashboard/services" element={<Services />} />
          <Route path="/dashboard/bookings" element={<Bookings />} />
          <Route path="/pos" element={<POSInterface />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/client-site" element={<ClientWebsite />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
