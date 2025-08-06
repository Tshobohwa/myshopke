import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { AuthErrorHandler } from "./auth-error-handler";

// API Configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Simplified response interceptor for basic logging
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ API Success: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        {
          status: response.status,
          data: response.data,
        }
      );
    }
    return response;
  },
  (error: AxiosError) => {
    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        `❌ API Error: ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
        {
          status: error.response?.status,
          data: error.response?.data,
        }
      );
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Authentication API
export const authApi = {
  login: async (email: string, password: string): Promise<any> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (userData: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role: "FARMER" | "BUYER";
    location?: string;
    farmSize?: number;
  }): Promise<any> => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  getProfile: async (userId: string): Promise<any> => {
    const response = await api.get("/auth/profile", { params: { userId } });
    return response.data;
  },

  updateProfile: async (profileData: any): Promise<any> => {
    const response = await api.put("/auth/profile", profileData);
    return response.data;
  },

  changePassword: async (userId: string, newPassword: string): Promise<any> => {
    const response = await api.put("/auth/change-password", {
      userId,
      newPassword,
    });
    return response.data;
  },
};

// Marketplace API
export const marketplaceApi = {
  getListings: async (params?: {
    search?: string;
    location?: string;
    crop?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> => {
    const response = await api.get("/buyer/listings", { params });
    return response.data;
  },

  searchListings: async (params: {
    query?: string;
    location?: string;
    cropType?: string;
    minPrice?: number;
    maxPrice?: number;
    harvestDateFrom?: string;
    harvestDateTo?: string;
  }): Promise<any> => {
    const response = await api.get("/buyer/listings/search", { params });
    return response.data;
  },
};

// Farmer API
export const farmerApi = {
  getMyListings: async (farmerId: string): Promise<any> => {
    const response = await api.get("/farmer/listings", {
      params: { farmerId },
    });
    return response.data;
  },

  createListing: async (listingData: {
    farmerId: string;
    cropType: string;
    quantity: number;
    unit: string;
    pricePerUnit: number;
    harvestDate: string;
    location: string;
    description?: string;
  }): Promise<any> => {
    const response = await api.post("/farmer/listings", listingData);
    return response.data;
  },

  updateListing: async (id: string, listingData: any): Promise<any> => {
    const response = await api.put(`/farmer/listings/${id}`, listingData);
    return response.data;
  },

  deleteListing: async (id: string, farmerId: string): Promise<any> => {
    const response = await api.delete(`/farmer/listings/${id}`, {
      data: { farmerId },
    });
    return response.data;
  },

  getDashboard: async (farmerId: string): Promise<any> => {
    const response = await api.get("/farmer/dashboard", {
      params: { farmerId },
    });
    return response.data;
  },
};

// User Preferences API
export const preferencesApi = {
  getPreferences: async (userId: string): Promise<any> => {
    const response = await api.get("/buyer/preferences", {
      params: { userId },
    });
    return response.data;
  },

  savePreferences: async (preferences: {
    userId: string;
    searchFilters?: any;
    savedListings?: string[];
  }): Promise<any> => {
    const response = await api.post("/buyer/preferences", preferences);
    return response.data;
  },

  saveInteraction: async (interactionData: {
    buyerId: string;
    listingId: string;
    type: "VIEW" | "CONTACT" | "BOOKMARK";
    metadata?: any;
  }): Promise<any> => {
    const response = await api.post("/buyer/interactions", interactionData);
    return response.data;
  },

  getDashboard: async (buyerId: string): Promise<any> => {
    const response = await api.get("/buyer/dashboard", { params: { buyerId } });
    return response.data;
  },
};

// Public API (no auth required)
export const publicApi = {
  getCategories: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get("/public/categories");
    return response.data;
  },

  getLocations: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get("/public/locations");
    return response.data;
  },

  getPublicListings: async (limit?: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get("/public/listings", { params: { limit } });
    return response.data;
  },
};

// Demand Forecast API
export const forecastApi = {
  getCropRecommendations: async (params: {
    location: string;
    landSize: number;
    landUnit: string;
    season: string;
  }): Promise<ApiResponse<any[]>> => {
    const response = await api.post("/forecast/recommendations", params);
    return response.data;
  },

  getUserRecommendations: async (): Promise<ApiResponse<any[]>> => {
    const response = await api.get("/forecast/user-recommendations");
    return response.data;
  },
};

// Export utilities
export { api };
export default api;
