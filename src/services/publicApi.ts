import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance for public endpoints (no auth required)
const publicApi: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor to handle common errors
publicApi.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    console.log("Public API Error:", {
      status: error.response?.status,
      message: error.response?.data,
      url: error.config?.url,
    });

    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

// Generic API service methods
export const publicApiService = {
  get: async <T>(url: string): Promise<T> => {
    const response = await publicApi.get<T>(url);
    return response.data;
  },

  post: async <T>(url: string, data?: any): Promise<T> => {
    const response = await publicApi.post<T>(url, data);
    return response.data;
  },

  put: async <T>(url: string, data?: any): Promise<T> => {
    const response = await publicApi.put<T>(url, data);
    return response.data;
  },

  delete: async <T>(url: string): Promise<T> => {
    const response = await publicApi.delete<T>(url);
    return response.data;
  },
};
