import { PrismaClient } from "@prisma/client";

// Mock Prisma Client for tests
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    produceListing: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userPreference: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    interaction: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    category: {
      findMany: jest.fn(),
    },
    location: {
      findMany: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  })),
}));

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db";

// Global test timeout
jest.setTimeout(10000);
