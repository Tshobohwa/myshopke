import { Response } from "express";
import { ApiResponse } from "../types";

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ): Response {
    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string, details?: any): Response {
    return this.error(res, "BAD_REQUEST", message, 400, details);
  }

  static unauthorized(
    res: Response,
    message: string = "Unauthorized"
  ): Response {
    return this.error(res, "UNAUTHORIZED", message, 401);
  }

  static forbidden(res: Response, message: string = "Forbidden"): Response {
    return this.error(res, "FORBIDDEN", message, 403);
  }

  static notFound(
    res: Response,
    message: string = "Resource not found"
  ): Response {
    return this.error(res, "NOT_FOUND", message, 404);
  }

  static conflict(res: Response, message: string, details?: any): Response {
    return this.error(res, "CONFLICT", message, 409, details);
  }

  static validationError(res: Response, errors: any): Response {
    return this.error(
      res,
      "VALIDATION_ERROR",
      "Validation failed",
      400,
      errors
    );
  }

  static internalError(
    res: Response,
    message: string = "Internal server error"
  ): Response {
    return this.error(res, "INTERNAL_SERVER_ERROR", message, 500);
  }
}
