import { publicApiService } from "./publicApi";

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
  total_amount?: number;
  payment_method: "cash" | "card" | "mobile" | "other" | "cod";
  payment_status: "pending" | "completed" | "failed" | "refunded" | "paid";
  order_status?: "pending" | "completed" | "cancelled";
  source?: "pos" | "website";
  items: ReceiptItem[];
  notes?: string;
  send_invoice: boolean;
  created_at: string;
  updated_at: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  staff_name?: string;
}

export interface CreatePublicReceiptData {
  client_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_address: string;
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  payment_method: "cash" | "card" | "mobile" | "other" | "cod";
  payment_status?: "pending" | "completed" | "failed" | "refunded" | "paid";
  order_status?: "pending" | "completed" | "cancelled";
  source?: "pos" | "website";
  items: ReceiptItem[];
  notes?: string;
  send_invoice?: boolean;
}

export interface ReceiptResponse {
  success: boolean;
  message: string;
  data: {
    receipt: Receipt;
    receipt_number: string;
  };
}

export const publicReceiptService = {
  // Create a new receipt/transaction for public customers (no auth required)
  createPublicReceipt: async (
    receiptData: CreatePublicReceiptData
  ): Promise<ReceiptResponse> => {
    const response = await publicApiService.post<ReceiptResponse>(
      "/receipts/public",
      receiptData
    );
    return response;
  },
};
