import { Request, Response, NextFunction } from "express";
import { z, ZodError, ZodSchema } from "zod";
import { ResponseUtil } from "../utils/response";
import { logger } from "../utils/logger";

/**
 * Generic validation middleware factory
 */
export const validate = (schema: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      // Validate route parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        logger.warn("Validation failed", { errors: validationErrors });
        ResponseUtil.validationError(res, validationErrors);
      } else {
        logger.error("Validation middleware error", error);
        ResponseUtil.internalError(res, "Validation failed");
      }
    }
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // ID parameter validation
  idParam: z.object({
    id: z.string().cuid("Invalid ID format"),
  }),

  // Pagination query validation
  pagination: z
    .object({
      page: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 1)),
      limit: z
        .string()
        .optional()
        .transform((val) => (val ? parseInt(val) : 10)),
    })
    .refine((data) => data.page >= 1, {
      message: "Page must be >= 1",
      path: ["page"],
    })
    .refine((data) => data.limit >= 1 && data.limit <= 100, {
      message: "Limit must be between 1 and 100",
      path: ["limit"],
    }),

  // Email validation
  email: z.string().email("Invalid email format").toLowerCase(),

  // Password validation (disabled - allows any password)
  // Password complexity validation has been disabled to allow users to use weak passwords
  // for improved accessibility and user convenience.
  password: z.string().min(1, "Password is required"),

  // Phone number validation (Kenyan format)
  phoneNumber: z
    .string()
    .regex(
      /^\+254[17]\d{8}$/,
      "Invalid Kenyan phone number format (+254XXXXXXXXX)"
    ),

  // User role validation
  userRole: z.enum(["FARMER", "BUYER"], {
    errorMap: () => ({ message: "Role must be either FARMER or BUYER" }),
  }),
};

/**
 * Authentication validation schemas
 */
export const authSchemas = {
  register: z
    .object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      fullName: z
        .string()
        .min(2, "Full name must be at least 2 characters")
        .max(100),
      phoneNumber: commonSchemas.phoneNumber,
      role: commonSchemas.userRole,
      location: z.string().min(2).max(100).optional(),
      farmSize: z.number().positive("Farm size must be positive").optional(),
    })
    .refine(
      (data) => {
        // If role is FARMER, location is required
        if (data.role === "FARMER" && !data.location) {
          return false;
        }
        return true;
      },
      {
        message: "Location is required for farmers",
        path: ["location"],
      }
    ),

  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, "Password is required"),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),

  updateProfile: z.object({
    fullName: z.string().min(2).max(100).optional(),
    phoneNumber: commonSchemas.phoneNumber.optional(),
    location: z.string().min(2).max(100).optional(),
    farmSize: z.number().positive().optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(1, "New password is required"),
  }),
};

/**
 * Produce listing validation schemas
 */
export const listingSchemas = {
  create: z.object({
    cropType: z
      .string()
      .min(2, "Crop type must be at least 2 characters")
      .max(50),
    quantity: z.number().positive("Quantity must be positive"),
    unit: z.string().min(1, "Unit is required").max(20),
    pricePerUnit: z.number().positive("Price per unit must be positive"),
    harvestDate: z.string().datetime("Invalid harvest date format"),
    location: z
      .string()
      .min(2, "Location must be at least 2 characters")
      .max(100),
    description: z
      .string()
      .max(500, "Description must be less than 500 characters")
      .optional(),
    categoryId: z.string().cuid("Invalid category ID").optional(),
  }),

  update: z.object({
    cropType: z.string().min(2).max(50).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().min(1).max(20).optional(),
    pricePerUnit: z.number().positive().optional(),
    harvestDate: z.string().datetime().optional(),
    location: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    categoryId: z.string().cuid().optional(),
    isActive: z.boolean().optional(),
  }),

  search: z
    .object({
      cropType: z.string().optional(),
      location: z.string().optional(),
      minPrice: z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined)),
      maxPrice: z
        .string()
        .optional()
        .transform((val) => (val ? parseFloat(val) : undefined)),
      availableFrom: z.string().datetime().optional(),
      availableTo: z.string().datetime().optional(),
      categoryId: z.string().cuid().optional(),
      isActive: z
        .string()
        .optional()
        .transform((val) => val === "true"),
    })
    .merge(commonSchemas.pagination),
};

/**
 * Interaction validation schemas
 */
export const interactionSchemas = {
  create: z.object({
    listingId: z.string().cuid("Invalid listing ID"),
    type: z.enum(["VIEW", "CONTACT", "BOOKMARK"], {
      errorMap: () => ({ message: "Type must be VIEW, CONTACT, or BOOKMARK" }),
    }),
    metadata: z.record(z.any()).optional(),
  }),
};

/**
 * User preferences validation schemas
 */
export const preferenceSchemas = {
  update: z.object({
    searchFilters: z.record(z.any()).optional(),
    savedListings: z.array(z.string().cuid()).optional(),
  }),
};
