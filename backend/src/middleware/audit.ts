import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";
import prisma from "../lib/prisma";

/**
 * Audit logging middleware
 */
export const auditLog = (action: string, resource: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Store original res.json to capture response
    const originalJson = res.json;
    let responseData: any;

    res.json = function (data: any) {
      responseData = data;
      return originalJson.call(this, data);
    };

    // Continue with the request
    next();

    // Log after response is sent
    res.on("finish", async () => {
      try {
        const userId = req.user?.id || null;
        const resourceId = req.params.id || null;
        const ipAddress = req.ip || req.connection.remoteAddress || null;
        const userAgent = req.get("User-Agent") || null;

        // Prepare metadata
        const metadata: any = {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          userAgent,
        };

        // Add request body for create/update operations (excluding sensitive data)
        if (["POST", "PUT", "PATCH"].includes(req.method)) {
          const sanitizedBody = { ...req.body };
          delete sanitizedBody.password;
          delete sanitizedBody.refreshToken;
          metadata.requestBody = sanitizedBody;
        }

        // Add response data for successful operations (excluding sensitive data)
        if (res.statusCode < 400 && responseData?.success) {
          const sanitizedResponse = { ...responseData };
          if (sanitizedResponse.data?.password) {
            delete sanitizedResponse.data.password;
          }
          metadata.responseData = sanitizedResponse;
        }

        // Create audit log entry
        await prisma.auditLog.create({
          data: {
            userId,
            action,
            resource,
            resourceId,
            metadata,
            ipAddress,
            userAgent,
          },
        });

        logger.info("Audit log created", {
          userId,
          action,
          resource,
          resourceId,
          statusCode: res.statusCode,
        });
      } catch (error) {
        logger.error("Failed to create audit log", error);
        // Don't fail the request if audit logging fails
      }
    });
  };
};

/**
 * Security event logging for sensitive operations
 */
export const securityLog = (eventType: string) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const originalJson = res.json;
    let responseData: any;

    res.json = function (data: any) {
      responseData = data;
      return originalJson.call(this, data);
    };

    next();

    res.on("finish", async () => {
      try {
        // Only log security events for specific conditions
        const shouldLog =
          (eventType === "LOGIN_ATTEMPT" && res.statusCode === 401) ||
          (eventType === "LOGIN_SUCCESS" && res.statusCode === 200) ||
          (eventType === "REGISTRATION" && res.statusCode === 201) ||
          (eventType === "PASSWORD_CHANGE" && res.statusCode === 200) ||
          (eventType === "UNAUTHORIZED_ACCESS" && res.statusCode === 403);

        if (shouldLog) {
          const metadata = {
            eventType,
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            userAgent: req.get("User-Agent"),
            timestamp: new Date().toISOString(),
            email: req.body?.email || null,
            success: res.statusCode < 400,
          };

          await prisma.auditLog.create({
            data: {
              userId: req.user?.id || null,
              action: "SECURITY_EVENT",
              resource: "security",
              metadata,
              ipAddress: req.ip || req.connection.remoteAddress || null,
              userAgent: req.get("User-Agent") || null,
            },
          });

          logger.warn("Security event logged", metadata);
        }
      } catch (error) {
        logger.error("Failed to create security log", error);
      }
    });
  };
};

/**
 * Request logging middleware for debugging
 */
export const requestLog = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  logger.info("Request started", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("Request completed", {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};
