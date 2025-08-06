import { Prisma } from "@prisma/client";
import { DatabaseError } from "../types";
import { logger } from "./logger";

/**
 * Handle Prisma database errors and convert them to user-friendly messages
 */
export function handleDatabaseError(error: any): DatabaseError {
  logger.error("Database operation failed", error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        // Unique constraint violation
        const field = error.meta?.target as string[];
        return {
          name: "DatabaseError",
          message: `A record with this ${field?.[0] || "value"} already exists`,
          code: "UNIQUE_CONSTRAINT_VIOLATION",
          meta: error.meta,
        };

      case "P2025":
        // Record not found
        return {
          name: "DatabaseError",
          message: "The requested record was not found",
          code: "RECORD_NOT_FOUND",
          meta: error.meta,
        };

      case "P2003":
        // Foreign key constraint violation
        return {
          name: "DatabaseError",
          message: "Cannot perform this operation due to related records",
          code: "FOREIGN_KEY_CONSTRAINT",
          meta: error.meta,
        };

      case "P2014":
        // Required relation violation
        return {
          name: "DatabaseError",
          message:
            "The change you are trying to make would violate the required relation",
          code: "REQUIRED_RELATION_VIOLATION",
          meta: error.meta,
        };

      default:
        return {
          name: "DatabaseError",
          message: "A database error occurred",
          code: error.code,
          meta: error.meta,
        };
    }
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return {
      name: "DatabaseError",
      message: "An unknown database error occurred",
      code: "UNKNOWN_DATABASE_ERROR",
    };
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return {
      name: "DatabaseError",
      message: "Database engine encountered an internal error",
      code: "DATABASE_ENGINE_ERROR",
    };
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      name: "DatabaseError",
      message: "Failed to initialize database connection",
      code: "DATABASE_CONNECTION_ERROR",
    };
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      name: "DatabaseError",
      message: "Invalid data provided to database operation",
      code: "DATABASE_VALIDATION_ERROR",
    };
  }

  // Generic error fallback
  return {
    name: "DatabaseError",
    message: error.message || "An unexpected database error occurred",
    code: "GENERIC_DATABASE_ERROR",
  };
}

/**
 * Pagination helper for database queries
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function getPaginationParams(options: PaginationOptions) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10)); // Max 100 items per page
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Build dynamic where clause for filtering
 */
export function buildWhereClause(filters: Record<string, any>) {
  const where: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      // Handle different filter types
      if (key.startsWith("min") && typeof value === "number") {
        const field = key.replace("min", "").toLowerCase();
        where[field] = { ...where[field], gte: value };
      } else if (key.startsWith("max") && typeof value === "number") {
        const field = key.replace("max", "").toLowerCase();
        where[field] = { ...where[field], lte: value };
      } else if (typeof value === "string") {
        // Case-insensitive string matching
        where[key] = { contains: value, mode: "insensitive" };
      } else {
        where[key] = value;
      }
    }
  });

  return where;
}
