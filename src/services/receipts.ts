import { apiService } from "./api";

export interface ReceiptItem {
  product_id?: number;
  service_id?: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface Receipt {
  id: number;
  client_id: number;
  customer_id?: number;
  staff_id?: number;
  receipt_number: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  total_amount?: number; // For compatibility with orders/transactions
  payment_method: "cash" | "card" | "mobile" | "other" | "cod";
  payment_status: "pending" | "completed" | "failed" | "refunded" | "paid";
  order_status?:
    | "pending"
    | "in_progress"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  items: ReceiptItem[] | string; // Can be array or JSON string
  notes?: string;
  send_invoice: boolean;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  staff_name?: string;
  source?: "pos" | "website";
}

export interface CreateReceiptData {
  customer_id?: number;
  staff_id?: number;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  payment_method: "cash" | "card" | "mobile" | "other" | "cod";
  payment_status?: "pending" | "completed" | "failed" | "refunded" | "paid";
  order_status?:
    | "pending"
    | "in_progress"
    | "shipped"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  source?: "pos" | "website";
  items: ReceiptItem[];
  notes?: string;
  send_invoice?: boolean;
}

export interface ReceiptFilters {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
}

export interface ReceiptStats {
  totalSales: number;
  totalTransactions: number;
  avgTransaction: number;
  salesByPaymentMethod: Array<{
    payment_method: string;
    count: number;
    total: number;
  }>;
}

export interface ReceiptResponse {
  success: boolean;
  message: string;
  data: {
    receipt: Receipt;
    receipt_number: string;
  };
}

export interface ReceiptsResponse {
  success: boolean;
  message: string;
  data: {
    receipts: Receipt[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface OrderStats {
  pendingOrders: number;
  expectedCash: number;
  collectedCash: number;
}

export interface OrderStatsResponse {
  success: boolean;
  message: string;
  data: OrderStats;
}

export interface ReceiptStatsResponse {
  success: boolean;
  message: string;
  data: ReceiptStats;
}

export const receiptService = {
  // Create a new receipt/transaction
  createReceipt: async (
    receiptData: CreateReceiptData
  ): Promise<ReceiptResponse> => {
    const response = await apiService.post<ReceiptResponse>(
      "/receipts",
      receiptData
    );
    return response;
  },

  // Get all receipts with pagination and filters
  getReceipts: async (
    filters: ReceiptFilters = {}
  ): Promise<ReceiptsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<ReceiptsResponse>(
      `/receipts?${params.toString()}`
    );
    return response;
  },

  // Get a single receipt by ID
  getReceipt: async (
    id: number
  ): Promise<{ success: boolean; message: string; data: Receipt }> => {
    const response = await apiService.get<{
      success: boolean;
      message: string;
      data: Receipt;
    }>(`/receipts/${id}`);
    return response;
  },

  // Update receipt
  updateReceipt: async (
    id: number,
    updateData: { payment_status?: string; notes?: string }
  ): Promise<{ success: boolean; message: string; data: Receipt }> => {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: Receipt;
    }>(`/receipts/${id}`, updateData);
    return response;
  },

  // Delete receipt
  deleteReceipt: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete<{
      success: boolean;
      message: string;
    }>(`/receipts/${id}`);
    return response;
  },

  // Get receipt statistics
  getReceiptStats: async (
    period: number = 30
  ): Promise<ReceiptStatsResponse> => {
    const response = await apiService.get<ReceiptStatsResponse>(
      `/receipts/stats?period=${period}`
    );
    return response;
  },

  // Get all receipts for the current user (for orders/transactions pages)
  getAllReceipts: async (): Promise<{
    success: boolean;
    data: Receipt[];
  }> => {
    const response = await apiService.get("/receipts");
    // The backend returns data.receipts, so we need to extract that
    if (response.success && response.data && response.data.receipts) {
      return {
        success: true,
        data: response.data.receipts,
      };
    }
    return {
      success: response.success,
      data: [],
    };
  },

  // Update receipt status
  updateReceiptStatus: async (
    receiptId: number,
    orderStatus: string,
    paymentStatus: string
  ): Promise<{
    success: boolean;
    data: Receipt;
  }> => {
    const response = await apiService.put(`/receipts/${receiptId}/status`, {
      order_status: orderStatus,
      payment_status: paymentStatus,
    });
    return response;
  },

  // Get order statistics
  getOrderStats: async (filters?: {
    source?: string;
  }): Promise<OrderStatsResponse> => {
    const params = new URLSearchParams();
    if (filters?.source) {
      params.append("source", filters.source);
    }

    const response = await apiService.get<OrderStats>(
      `/receipts/orders/stats?${params.toString()}`
    );
    return response;
  },

  // Bulk delete orders
  bulkDeleteOrders: async (orderIds: number[]): Promise<ReceiptResponse> => {
    const response = await apiService.delete<Receipt>("/receipts/orders/bulk", {
      data: { orderIds },
    });
    return response;
  },

  // Clean up test orders
  cleanupTestOrders: async (): Promise<ReceiptResponse> => {
    const response = await apiService.delete<Receipt>(
      "/receipts/orders/cleanup"
    );
    return response;
  },
};
