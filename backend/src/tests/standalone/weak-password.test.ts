/**
 * Standalone tests for weak password functionality
 * These tests run without the Jest setup that requires a database
 */

import { AuthUtils } from "../../utils/auth";

// Set up environment variables
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";

// Simple test runner
class TestRunner {
  private tests: Array<{ name: string; fn: () => Promise<void> | void }> = [];
  private passed = 0;
  private failed = 0;

  test(name: string, fn: () => Promise<void> | void) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log("🧪 Running Weak Password Integration Tests\n");

    for (const { name, fn } of this.tests) {
      try {
        await fn();
        console.log(`✅ ${name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total: ${this.tests.length}`);

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new TestRunner();

// Helper function for assertions
function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toEqual: (expected: any) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
          `Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(
            expected
          )}`
        );
      }
    },
    toMatch: (pattern: RegExp) => {
      if (!pattern.test(actual)) {
        throw new Error(`Expected ${actual} to match ${pattern}`);
      }
    },
    not: {
      toBe: (expected: any) => {
        if (actual === expected) {
          throw new Error(`Expected ${actual} not to be ${expected}`);
        }
      },
    },
    toBeGreaterThan: (expected: number) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeDefined: () => {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined`);
      }
    },
  };
}

// Test 1: Password validation always returns valid
runner.test(
  "Password validation should always return valid for weak passwords",
  () => {
    const weakPasswords = ["123", "a", "password", "test", "", "abc", "12345"];

    weakPasswords.forEach((password) => {
      const result = AuthUtils.validatePasswordStrength(password);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  }
);

// Test 2: Password hashing works with weak passwords
runner.test("Should hash weak passwords correctly", async () => {
  const weakPasswords = ["123", "a", "password", "test"];

  for (const password of weakPasswords) {
    const hashedPassword = await AuthUtils.hashPassword(password);

    expect(hashedPassword).not.toBe(password);
    expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);
    expect(hashedPassword.length).toBeGreaterThan(50);
  }
});

// Test 3: Password verification works
runner.test("Should verify weak passwords correctly", async () => {
  const testCases = ["123", "a", "password", "test"];

  for (const password of testCases) {
    const hashedPassword = await AuthUtils.hashPassword(password);
    const isValid = await AuthUtils.verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);
  }
});

// Test 4: JWT token generation works
runner.test("Should generate JWT tokens for users with weak passwords", () => {
  const tokenPayload = {
    userId: "test-user-id",
    email: "test@example.com",
    role: "BUYER" as any,
  };

  const accessToken = AuthUtils.generateAccessToken(tokenPayload);
  const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

  expect(accessToken).toBeDefined();
  expect(refreshToken).toBeDefined();
  expect(typeof accessToken).toBe("string");
  expect(typeof refreshToken).toBe("string");
});

// Test 5: JWT token verification works
runner.test("Should verify JWT tokens correctly", () => {
  const tokenPayload = {
    userId: "test-user-id",
    email: "test@example.com",
    role: "BUYER" as any,
  };

  const accessToken = AuthUtils.generateAccessToken(tokenPayload);
  const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

  const decodedAccess = AuthUtils.verifyAccessToken(accessToken);
  const decodedRefresh = AuthUtils.verifyRefreshToken(refreshToken);

  expect(decodedAccess.userId).toBe(tokenPayload.userId);
  expect(decodedAccess.email).toBe(tokenPayload.email);
  expect(decodedRefresh.userId).toBe(tokenPayload.userId);
  expect(decodedRefresh.email).toBe(tokenPayload.email);
});

// Test 6: Complete authentication flow simulation
runner.test(
  "Should simulate complete registration and login flow with weak passwords",
  async () => {
    const testCases = [
      { password: "123", email: "user1@example.com" },
      { password: "a", email: "user2@example.com" },
      { password: "password", email: "user3@example.com" },
      { password: "test", email: "user4@example.com" },
    ];

    for (const { password, email } of testCases) {
      // Step 1: Validate password (should always pass)
      const validation = AuthUtils.validatePasswordStrength(password);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);

      // Step 2: Hash password for storage
      const hashedPassword = await AuthUtils.hashPassword(password);
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);

      // Step 3: Simulate login by verifying password
      const isPasswordValid = await AuthUtils.verifyPassword(
        password,
        hashedPassword
      );
      expect(isPasswordValid).toBe(true);

      // Step 4: Generate JWT tokens
      const tokenPayload = {
        userId: `user-${Date.now()}`,
        email,
        role: "BUYER" as any,
      };

      const accessToken = AuthUtils.generateAccessToken(tokenPayload);
      const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();

      // Step 5: Verify tokens
      const decodedAccess = AuthUtils.verifyAccessToken(accessToken);
      const decodedRefresh = AuthUtils.verifyRefreshToken(refreshToken);

      expect(decodedAccess.userId).toBe(tokenPayload.userId);
      expect(decodedAccess.email).toBe(email);
      expect(decodedRefresh.userId).toBe(tokenPayload.userId);
      expect(decodedRefresh.email).toBe(email);
    }
  }
);

// Test 7: Security properties maintained
runner.test(
  "Should maintain security properties even with weak passwords",
  async () => {
    const weakPassword = "123";
    const hashedPassword = await AuthUtils.hashPassword(weakPassword);

    // Different passwords should not match
    const wrongPasswords = ["124", "1234", "abc", "password"];
    for (const wrongPassword of wrongPasswords) {
      const isValid = await AuthUtils.verifyPassword(
        wrongPassword,
        hashedPassword
      );
      expect(isValid).toBe(false);
    }

    // Correct password should match
    const isCorrectValid = await AuthUtils.verifyPassword(
      weakPassword,
      hashedPassword
    );
    expect(isCorrectValid).toBe(true);
  }
);

// Test 8: Unique hashes for same password
runner.test(
  "Should generate unique hashes for the same weak password",
  async () => {
    const password = "123";
    const hash1 = await AuthUtils.hashPassword(password);
    const hash2 = await AuthUtils.hashPassword(password);

    // Hashes should be different due to salt
    expect(hash1).not.toBe(hash2);

    // But both should verify correctly
    const isValid1 = await AuthUtils.verifyPassword(password, hash1);
    const isValid2 = await AuthUtils.verifyPassword(password, hash2);
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
  }
);

// Test 9: Edge cases
runner.test("Should handle edge cases like empty password", async () => {
  const emptyPassword = "";

  // Should pass validation
  const validation = AuthUtils.validatePasswordStrength(emptyPassword);
  expect(validation.isValid).toBe(true);

  // Should be hashable
  const hashedPassword = await AuthUtils.hashPassword(emptyPassword);
  expect(hashedPassword).toMatch(/^\$2[aby]\$\d+\$/);

  // Should be verifiable
  const isValid = await AuthUtils.verifyPassword(emptyPassword, hashedPassword);
  expect(isValid).toBe(true);
});

// Test 10: Requirements verification
runner.test("Should meet all specified requirements", async () => {
  // Requirement 3.1: always return isValid as true
  const passwords = ["123", "a", "password", "test", ""];
  passwords.forEach((password) => {
    const result = AuthUtils.validatePasswordStrength(password);
    expect(result.isValid).toBe(true);
  });

  // Requirement 3.2: return empty errors array
  passwords.forEach((password) => {
    const result = AuthUtils.validatePasswordStrength(password);
    expect(result.errors).toEqual([]);
  });

  // Requirement 4.1: still hash passwords using bcrypt
  for (const password of passwords) {
    const hashedPassword = await AuthUtils.hashPassword(password);
    expect(hashedPassword).toMatch(/^\$2[aby]\$12\$/); // bcrypt with 12 rounds
    expect(hashedPassword).not.toBe(password);

    const isValid = await AuthUtils.verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);
  }

  // Requirement 4.2: still implement proper authentication flows
  const tokenPayload = {
    userId: "test-user-id",
    email: "test@example.com",
    role: "BUYER" as any,
  };

  const accessToken = AuthUtils.generateAccessToken(tokenPayload);
  const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

  expect(accessToken).toBeDefined();
  expect(refreshToken).toBeDefined();

  const decodedAccess = AuthUtils.verifyAccessToken(accessToken);
  const decodedRefresh = AuthUtils.verifyRefreshToken(refreshToken);

  expect(decodedAccess.userId).toBe(tokenPayload.userId);
  expect(decodedRefresh.userId).toBe(tokenPayload.userId);
});

// Run all tests
runner.run().catch(console.error);
