import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import { randomBytes } from "crypto";

// Generate a unique database name for each test run
const generateTestDatabaseUrl = () => {
  const testId = randomBytes(8).toString("hex");
  const baseUrl =
    process.env.DATABASE_URL ||
    "postgresql://postgres:243243@localhost:5432/myshopke";
  const url = new URL(baseUrl);
  url.pathname = `/myshopke_test_${testId}`;
  return url.toString();
};

export const testDatabaseUrl = generateTestDatabaseUrl();

// Create test database
export const setupTestDatabase = async () => {
  const url = new URL(testDatabaseUrl);
  const dbName = url.pathname.slice(1); // Remove leading slash

  try {
    // Create test database
    execSync(`createdb ${dbName}`, { stdio: "ignore" });

    // Set environment variable for Prisma
    process.env.DATABASE_URL = testDatabaseUrl;

    // Run migrations
    execSync("npx prisma migrate deploy", {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: testDatabaseUrl },
    });

    console.log(`Test database created: ${dbName}`);
  } catch (error) {
    console.error("Failed to setup test database:", error);
    throw error;
  }
};

// Clean up test database
export const teardownTestDatabase = async () => {
  const url = new URL(testDatabaseUrl);
  const dbName = url.pathname.slice(1);

  try {
    execSync(`dropdb ${dbName}`, { stdio: "ignore" });
    console.log(`Test database dropped: ${dbName}`);
  } catch (error) {
    console.warn("Failed to drop test database:", error);
  }
};

// Create test Prisma client
export const createTestPrismaClient = () => {
  return new PrismaClient({
    datasources: {
      db: {
        url: testDatabaseUrl,
      },
    },
  });
};

// Test data factories
export const createTestUser = (overrides: any = {}) => ({
  email: `test${randomBytes(4).toString("hex")}@example.com`,
  password: "hashedPassword123",
  fullName: "Test User",
  phoneNumber: "+254712345678",
  role: "BUYER",
  isActive: true,
  ...overrides,
});

export const createTestFarmer = (overrides: any = {}) => ({
  ...createTestUser({ role: "FARMER" }),
  ...overrides,
});

export const createTestListing = (farmerId: string, overrides: any = {}) => ({
  farmerId,
  cropType: "Tomatoes",
  quantity: 100,
  unit: "kg",
  pricePerUnit: 50,
  harvestDate: new Date("2025-03-01"),
  location: "Kiambu County",
  description: "Fresh organic tomatoes",
  isActive: true,
  ...overrides,
});

export const createTestCategory = (overrides: any = {}) => ({
  name: `Test Category ${randomBytes(4).toString("hex")}`,
  description: "Test category description",
  isActive: true,
  ...overrides,
});

export const createTestLocation = (overrides: any = {}) => ({
  county: `Test County ${randomBytes(4).toString("hex")}`,
  region: "Test Region",
  isActive: true,
  ...overrides,
});
