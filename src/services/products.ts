import { apiService } from "./api";

export interface Product {
  id?: number;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  stock: number;
  alert_level: number;
  barcode?: string;
  images?: string[];
  active?: boolean;
  category_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
}

export interface ProductResponse {
  success: boolean;
  data: Product[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Category {
  id: number;
  name: string;
}

export const productService = {
  // Get all products with filters
  getProducts: async (
    filters: ProductFilters = {}
  ): Promise<ProductResponse> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiService.get<ProductResponse>(
      `/products?${params.toString()}`
    );
    return response;
  },

  // Get single product by ID
  getProduct: async (
    id: number
  ): Promise<{ success: boolean; data: Product }> => {
    const response = await apiService.get<{ success: boolean; data: Product }>(
      `/products/${id}`
    );
    return response;
  },

  // Create new product
  createProduct: async (
    product: Omit<Product, "id" | "created_at" | "updated_at">
  ): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
      data: Product;
    }>("/products", product);
    return response;
  },

  // Update product
  updateProduct: async (
    id: number,
    product: Partial<Product>
  ): Promise<{ success: boolean; message: string; data: Product }> => {
    const response = await apiService.put<{
      success: boolean;
      message: string;
      data: Product;
    }>(`/products/${id}`, product);
    return response;
  },

  // Delete product
  deleteProduct: async (
    id: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.delete<{
      success: boolean;
      message: string;
    }>(`/products/${id}`);
    return response;
  },

  // Bulk import products
  bulkImport: async (
    products: Omit<Product, "id" | "created_at" | "updated_at">[]
  ): Promise<{ success: boolean; message: string }> => {
    const response = await apiService.post<{
      success: boolean;
      message: string;
    }>("/products/bulk-import", { products });
    return response;
  },

  // Get categories
  getCategories: async (): Promise<{ success: boolean; data: Category[] }> => {
    const response = await apiService.get<{
      success: boolean;
      data: Category[];
    }>("/products/categories");
    return response;
  },
};
