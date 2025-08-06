import { setupTestDatabase, teardownTestDatabase } from "./setup";

// Global test setup
beforeAll(async () => {
  await setupTestDatabase();
});

// Global test teardown
afterAll(async () => {
  await teardownTestDatabase();
});

// Increase timeout for database operations
jest.setTimeout(30000);
