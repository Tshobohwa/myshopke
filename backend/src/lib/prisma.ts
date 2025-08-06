import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

// Prevent multiple instances of Prisma Client in development
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma =
  globalThis.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : [],
  });

if (process.env.NODE_ENV === "development") {
  globalThis.__prisma = prisma;
}

export default prisma;
