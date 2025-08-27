import { apiService } from "./api";

export interface Wallet {
  id: number;
  client_id: number;
  name: string;
  balance: number;
  wallet_type: string;
  currency: string;
  color: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: number;
  client_id: number;
  wallet_id: number;
  from_wallet_id?: number;
  to_wallet_id?: number;
  transaction_type: "credit" | "debit" | "transfer";
  amount: number;
  currency: string;
  category: string;
  description?: string;
  reference_number: string;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
  wallet_name?: string;
  wallet_color?: string;
}

export interface WalletStats {
  totalBalance: number;
  totalExpenses: number;
  totalRevenue: number;
  netBalance: number;
}

export interface CreateWalletData {
  name: string;
  initial_balance?: number;
  wallet_type?: string;
  currency?: string;
  color?: string;
  description?: string;
}

export interface UpdateWalletData {
  name?: string;
  wallet_type?: string;
  currency?: string;
  color?: string;
  description?: string;
}

export interface AddTransactionData {
  wallet_id: number;
  transaction_type: "credit" | "debit";
  amount: number;
  category?: string;
  description?: string;
}

export interface TransferData {
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  description?: string;
}

export interface TransactionFilters {
  wallet_id?: number;
  transaction_type?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface WalletsResponse {
  success: boolean;
  message: string;
  data: Wallet[];
}

export interface WalletResponse {
  success: boolean;
  message: string;
  data: Wallet;
}

export interface WalletStatsResponse {
  success: boolean;
  message: string;
  data: WalletStats;
}

export interface TransactionsResponse {
  success: boolean;
  message: string;
  data: {
    transactions: WalletTransaction[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: {
    transaction: WalletTransaction;
    updatedWallet: Wallet;
  };
}

export interface TransferResponse {
  success: boolean;
  message: string;
  data: {
    fromWallet: Wallet;
    toWallet: Wallet;
    referenceNumber: string;
  };
}

export const walletService = {
  // Get all wallets
  getWallets: async (): Promise<WalletsResponse> => {
    const response = await apiService.get<Wallet[]>("/wallets");
    return response;
  },

  // Get wallet by ID
  getWallet: async (id: number): Promise<WalletResponse> => {
    const response = await apiService.get<Wallet>(`/wallets/${id}`);
    return response;
  },

  // Create new wallet
  createWallet: async (data: CreateWalletData): Promise<WalletResponse> => {
    const response = await apiService.post<Wallet>("/wallets", data);
    return response;
  },

  // Update wallet
  updateWallet: async (id: number, data: UpdateWalletData): Promise<WalletResponse> => {
    const response = await apiService.put<Wallet>(`/wallets/${id}`, data);
    return response;
  },

  // Delete wallet
  deleteWallet: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete(`/wallets/${id}`);
    return response;
  },

  // Get wallet statistics
  getWalletStats: async (): Promise<WalletStatsResponse> => {
    const response = await apiService.get<WalletStats>("/wallets/stats");
    return response;
  },

  // Add transaction
  addTransaction: async (data: AddTransactionData): Promise<TransactionResponse> => {
    const response = await apiService.post<TransactionResponse>("/wallets/transactions", data);
    return response;
  },

  // Transfer between wallets
  transferBetweenWallets: async (data: TransferData): Promise<TransferResponse> => {
    const response = await apiService.post<TransferResponse>("/wallets/transfers", data);
    return response;
  },

  // Get wallet transactions
  getWalletTransactions: async (filters: TransactionFilters = {}): Promise<TransactionsResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<TransactionsResponse>(`/wallets/transactions?${params.toString()}`);
    return response;
  },
};
