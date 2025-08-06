import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// Health check endpoint
router.get("/health", async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: "connected",
    };

    res.status(200).json(healthStatus);
  } catch (error) {
    const healthStatus = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: "disconnected",
      error: error instanceof Error ? error.message : "Unknown error",
    };

    res.status(503).json(healthStatus);
  }
});

// Readiness check endpoint
router.get("/ready", async (req, res) => {
  try {
    // Check if all required services are ready
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Liveness check endpoint
router.get("/live", (req, res) => {
  res.status(200).json({
    status: "alive",
    timestamp: new Date().toISOString(),
  });
});

export default router;
