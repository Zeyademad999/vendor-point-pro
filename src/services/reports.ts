import { apiService, ApiResponse } from "./api";

export interface ReportFilters {
  dateRange?: string;
  reportType?: string;
  startDate?: string;
  endDate?: string;
  exportFormat?: "pdf" | "csv" | "excel";
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  staffId?: number;
  customerId?: number;
}

export interface ReportData {
  totalSales: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalServices: number;
  totalBookings: number;
  salesByMonth: { month: string; sales: number }[];
  topProducts: { name: string; sales: number; quantity: number }[];
  topServices: { name: string; bookings: number; revenue: number }[];
  recentTransactions: {
    id: string;
    customer: string;
    amount: number;
    type: "sale" | "booking";
    date: string;
    status: string;
  }[];
  // Advanced analytics
  performanceMetrics: {
    averageOrderValue: number;
    customerRetentionRate: number;
    conversionRate: number;
    revenuePerCustomer: number;
    orderCompletionRate: number;
    staffProductivity: number;
  };
  customerInsights: {
    newCustomers: number;
    returningCustomers: number;
    customerLifetimeValue: number;
    churnRate: number;
    customerSegments: {
      highValue: number;
      mediumValue: number;
      lowValue: number;
    };
  };
  timeMetrics: {
    avgOrdersPerDay: number;
    avgMinutesPerOrder: number;
    avgItemsPerOrder: number;
    peakHoursPerDay: number;
  };
  revenueBreakdown: {
    productSales: number;
    serviceBookings: number;
    onlineOrders: number;
    posTransactions: number;
  };
  // Enhanced analytics
  salesAnalytics: {
    dailySales: { date: string; sales: number; orders: number }[];
    hourlySales: { hour: number; sales: number }[];
    salesByCategory: { category: string; sales: number; percentage: number }[];
    salesByPaymentMethod: { method: string; sales: number; count: number }[];
    salesByStaff: { staffName: string; sales: number; orders: number }[];
  };
  customerAnalytics: {
    customerGrowth: {
      month: string;
      newCustomers: number;
      totalCustomers: number;
    }[];
    customerSegments: { segment: string; count: number; revenue: number }[];
    topCustomers: {
      name: string;
      totalSpent: number;
      orders: number;
      lastOrder: string;
    }[];
    customerRetention: { cohort: string; retentionRate: number }[];
  };
  productAnalytics: {
    productPerformance: {
      name: string;
      sales: number;
      quantity: number;
      profit: number;
    }[];
    categoryPerformance: { category: string; sales: number; items: number }[];
    inventoryTurnover: {
      product: string;
      turnover: number;
      daysInStock: number;
    }[];
    lowStockItems: {
      name: string;
      currentStock: number;
      reorderPoint: number;
    }[];
  };
  financialAnalytics: {
    profitMargin: number;
    grossProfit: number;
    netProfit: number;
    expenses: number;
    profitByMonth: { month: string; profit: number; margin: number }[];
    cashFlow: {
      month: string;
      income: number;
      expenses: number;
      net: number;
    }[];
  };
}

export interface ReportResponse extends ApiResponse<ReportData> {
  // Extends ApiResponse interface
}

export interface PerformanceMetrics {
  staffId: number;
  staffName: string;
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  customerSatisfaction: number;
  efficiency: number;
}

export interface TransactionData {
  id: number;
  receipt_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  items: unknown[];
  total_amount: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  source: string;
  created_at: string;
  updated_at: string;
  staff_name?: string;
  notes?: string;
}

export interface TransactionResponse
  extends ApiResponse<{
    transactions: TransactionData[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
  // Extends ApiResponse interface
}

export const reportService = {
  // Get comprehensive reports with filters
  getReports: async (filters: ReportFilters = {}): Promise<ReportResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<ReportData>(
      `/reports?${params.toString()}`
    );
    return response;
  },

  // Get sales analytics
  getSalesAnalytics: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/sales?${params.toString()}`
    );
    return response;
  },

  // Get booking analytics
  getBookingAnalytics: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/bookings?${params.toString()}`
    );
    return response;
  },

  // Get performance metrics
  getPerformanceMetrics: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<PerformanceMetrics[]>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<PerformanceMetrics[]>(
      `/reports/performance?${params.toString()}`
    );
    return response;
  },

  // Get customer analytics
  getCustomerAnalytics: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/customers?${params.toString()}`
    );
    return response;
  },

  // Get product analytics
  getProductAnalytics: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/products?${params.toString()}`
    );
    return response;
  },

  // Get financial analytics
  getFinancialAnalytics: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/financial?${params.toString()}`
    );
    return response;
  },

  // Get transactions with pagination and filters
  getTransactions: async (
    filters: ReportFilters = {}
  ): Promise<TransactionResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<{
      transactions: TransactionData[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/reports/transactions?${params.toString()}`);
    return response;
  },

  // Update transaction
  updateTransaction: async (
    id: number,
    updateData: Partial<TransactionData>
  ): Promise<ApiResponse<TransactionData>> => {
    const response = await apiService.put<TransactionData>(
      `/reports/transactions/${id}`,
      updateData
    );
    return response;
  },

  // Delete transaction
  deleteTransaction: async (
    id: number
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiService.delete<{ message: string }>(
      `/reports/transactions/${id}`
    );
    return response;
  },

  // Bulk delete transactions
  bulkDeleteTransactions: async (
    ids: number[]
  ): Promise<ApiResponse<{ message: string }>> => {
    const response = await apiService.delete<{ message: string }>(
      `/reports/transactions/bulk?ids=${ids.join(",")}`
    );
    return response;
  },

  // Export report with multiple formats
  exportReport: async (
    filters: ReportFilters = {},
    format: "pdf" | "csv" | "excel" = "pdf"
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    params.append("format", format);

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/export?${params.toString()}`
    );
    return response;
  },

  // Get real-time analytics
  getRealTimeAnalytics: async (): Promise<
    ApiResponse<Record<string, unknown>>
  > => {
    const response = await apiService.get<Record<string, unknown>>(
      "/reports/realtime"
    );
    return response;
  },

  // Get comparative analytics
  getComparativeAnalytics: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/comparative?${params.toString()}`
    );
    return response;
  },

  // Get dashboard summary
  getDashboardSummary: async (
    filters: ReportFilters = {}
  ): Promise<ApiResponse<Record<string, unknown>>> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<Record<string, unknown>>(
      `/reports/dashboard?${params.toString()}`
    );
    return response;
  },
};
