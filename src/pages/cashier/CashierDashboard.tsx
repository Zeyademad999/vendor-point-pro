import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";
import POSInterface from "@/pages/pos/POSInterface";

const CashierDashboard = () => {
  console.log("CashierDashboard: Component rendering");
  const { user } = useAuth();

  if (!user || (user.role !== "cashier" && user.role !== "staff")) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You don't have access to the cashier portal.
            </p>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Directly render the POS interface for cashiers
  console.log("CashierDashboard: Rendering POS interface directly");
  return (
    <PageTransition>
      <POSInterface />
    </PageTransition>
  );
};

export default CashierDashboard;
