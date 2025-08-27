import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  backoffMultiplier: 2,
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequestsPerMinute: 60,
  windowMs: 60000, // 1 minute
};

// Request tracking for rate limiting
const requestCount = 0;
const windowStart = Date.now();

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // Increased timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    console.log("API Request - Token:", token ? "Present" : "Missing");
    console.log("API Request - URL:", config.url);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    console.log("API Error:", {
      status: error.response?.status,
      message: error.response?.data,
      url: error.config?.url,
    });

    if (error.response?.status === 401) {
      console.log("401 Error - Token issue detected");
      // Temporarily disable auto-logout for debugging
      // localStorage.removeItem("token");
      // localStorage.removeItem("user");
      // window.location.href = "/auth/login";
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 5000;

      // Store rate limit info for user feedback
      localStorage.setItem(
        "rateLimitInfo",
        JSON.stringify({
          timestamp: Date.now(),
          waitTime,
          message:
            (error.response.data as { message?: string })?.message ||
            "Too many requests",
        })
      );
    }

    return Promise.reject(error);
  }
);

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Retry wrapper function
const withRetry = async <T>(
  requestFn: () => Promise<AxiosResponse<ApiResponse<T>>>,
  retryCount = 0
): Promise<ApiResponse<T>> => {
  try {
    const response = await requestFn();
    return response.data;
  } catch (error: unknown) {
    const axiosError = error as AxiosError;
    const isRateLimited = axiosError.response?.status === 429;
    const isRetryable =
      axiosError.response?.status >= 500 || axiosError.response?.status === 408;
    const canRetry =
      retryCount < RETRY_CONFIG.maxRetries && (isRetryable || isRateLimited);

    if (canRetry) {
      const delay = isRateLimited
        ? RETRY_CONFIG.retryDelay *
          Math.pow(RETRY_CONFIG.backoffMultiplier, retryCount)
        : RETRY_CONFIG.retryDelay;

      await new Promise((resolve) => setTimeout(resolve, delay));
      return withRetry(requestFn, retryCount + 1);
    }

    throw handleApiError(error);
  }
};

// Generic API methods
export const apiService = {
  // GET request with retry logic
  get: async <T>(
    url: string,
    params?: Record<string, unknown>
  ): Promise<ApiResponse<T>> => {
    return withRetry(() => api.get(url, { params }));
  },

  // POST request with retry logic
  post: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    return withRetry(() => api.post(url, data));
  },

  // PUT request with retry logic
  put: async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
    return withRetry(() => api.put(url, data));
  },

  // DELETE request with retry logic
  delete: async <T>(url: string): Promise<ApiResponse<T>> => {
    return withRetry(() => api.delete(url));
  },

  // File upload
  upload: async <T>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

// Error handler
const handleApiError = (error: unknown): Error => {
  const axiosError = error as AxiosError;

  if (axiosError.response?.status === 429) {
    const retryAfter = axiosError.response.headers["retry-after"];
    const waitTime = retryAfter ? parseInt(retryAfter) : 60;

    return new Error(
      `Rate limit exceeded. Please wait ${waitTime} seconds before trying again. ` +
        `This helps protect our servers and ensure fair usage for all users.`
    );
  }

  if (axiosError.response?.data) {
    const { message, errors } = axiosError.response.data as {
      message?: string;
      errors?: unknown[];
    };

    // If there are validation errors, include them in the error message
    if (errors && Array.isArray(errors) && errors.length > 0) {
      const validationMessages = errors
        .map((err: { msg?: string }) => err.msg || "Validation error")
        .join(", ");
      return new Error(`${message}: ${validationMessages}`);
    }

    return new Error(message || "An error occurred");
  }

  if (axiosError.code === "ECONNABORTED") {
    return new Error(
      "Request timed out. Please check your connection and try again."
    );
  }

  if (!axiosError.response) {
    return new Error(
      "Network error. Please check your connection and try again."
    );
  }

  return new Error("An unexpected error occurred. Please try again later.");
};

export default api;
