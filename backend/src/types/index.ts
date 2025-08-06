import { Request } from "express";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// User Types
export enum UserRole {
  FARMER = "FARMER",
  BUYER = "BUYER",
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  phoneNumber: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  userId: string;
  location?: string;
  farmSize?: number;
}

// Authentication Types
export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  location?: string;
  farmSize?: number;
}

// Produce Listing Types
export interface ProduceListing {
  id: string;
  farmerId: string;
  cropType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  harvestDate: Date;
  location: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListingData {
  cropType: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  harvestDate: Date;
  location: string;
  description?: string;
}

export interface UpdateListingData extends Partial<CreateListingData> {}

// Search and Filter Types
export interface ListingFilters {
  cropType?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  availableFrom?: Date;
  availableTo?: Date;
  page?: number;
  limit?: number;
}

export interface UserPreferences {
  id: string;
  userId: string;
  searchFilters?: ListingFilters;
  savedListings?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Interaction Types
export interface Interaction {
  id: string;
  buyerId: string;
  farmerId: string;
  listingId: string;
  type: "VIEW" | "CONTACT" | "BOOKMARK";
  createdAt: Date;
}

// Database Error Types
export interface DatabaseError extends Error {
  code?: string;
  meta?: any;
}
