/**
 * Integration tests for password change flow with weak passwords
 * These tests verify the complete password change process including
 * validation, hashing, and the ability to login with new weak passwords.
 */

import bcrypt from "bcryptjs";
import { AuthUtils } from "../../utils/auth";

describe("Password Change Flow Integration Tests", () => {
  describe("Complete password change simulation", () => {
    it("should successfully change from strong password to weak password", async () => {
      const currentStrongPassword = "StrongPassword123!";
      const newWeakPassword = "123";

      // Step 1: Hash the current strong password (simulating existing user)
      const currentHashedPassword = await AuthUtils.hashPassword(
        currentStrongPassword
      );

      // Step 2: Verify current password (simulating password verification in controller)
      const isCurrentPasswordValid = await AuthUtils.verifyPassword(
        currentStrongPassword,
        currentHashedPassword
      );
      expect(isCurrentPasswordValid).toBe(true);

      // Step 3: Validate new weak password (this is the key test)
      const passwordValidation =
        AuthUtils.validatePasswordStrength(newWeakPassword);
      expect(passwordValidation.isValid).toBe(true);
      expect(passwordValidation.errors).toEqual([]);

      // Step 4: Hash the new weak password
      const newHashedPassword = await AuthUtils.hashPassword(newWeakPassword);
      expect(newHashedPassword).toBeDefined();
      expect(newHashedPassword).not.toBe(newWeakPassword); // Should be hashed

      // Step 5: Verify the new weak password can be verified
      const isNewPasswordValid = await AuthUtils.verifyPassword(
        newWeakPassword,
        newHashedPassword
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it("should successfully change from weak password to another weak password", async () => {
      const currentWeakPassword = "test";
      const newWeakPassword = "a";

      // Step 1: Hash the current weak password
      const currentHashedPassword = await AuthUtils.hashPassword(
        currentWeakPassword
      );

      // Step 2: Verify current weak password
      const isCurrentPasswordValid = await AuthUtils.verifyPassword(
        currentWeakPassword,
        currentHashedPassword
      );
      expect(isCurrentPasswordValid).toBe(true);

      // Step 3: Validate new weak password
      const passwordValidation =
        AuthUtils.validatePasswordStrength(newWeakPassword);
      expect(passwordValidation.isValid).toBe(true);
      expect(passwordValidation.errors).toEqual([]);

      // Step 4: Hash the new weak password
      const newHashedPassword = await AuthUtils.hashPassword(newWeakPassword);
      expect(newHashedPassword).toBeDefined();
      expect(newHashedPassword).not.toBe(newWeakPassword);

      // Step 5: Verify the new weak password
      const isNewPasswordValid = await AuthUtils.verifyPassword(
        newWeakPassword,
        newHashedPassword
      );
      expect(isNewPasswordValid).toBe(true);
    });

    it("should handle multiple weak password scenarios", async () => {
      const testCases = [
        { current: "StrongPassword123!", new: "1" },
        { current: "ComplexPass456#", new: "a" },
        { current: "test", new: "123" },
        { current: "abc", new: "password" },
        { current: "12345", new: "xyz" },
      ];

      for (const testCase of testCases) {
        // Hash current password
        const currentHashed = await AuthUtils.hashPassword(testCase.current);

        // Verify current password
        const currentValid = await AuthUtils.verifyPassword(
          testCase.current,
          currentHashed
        );
        expect(currentValid).toBe(true);

        // Validate new password (should always pass)
        const validation = AuthUtils.validatePasswordStrength(testCase.new);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);

        // Hash new password
        const newHashed = await AuthUtils.hashPassword(testCase.new);

        // Verify new password
        const newValid = await AuthUtils.verifyPassword(
          testCase.new,
          newHashed
        );
        expect(newValid).toBe(true);
      }
    });
  });

  describe("Password hashing security with weak passwords", () => {
    it("should properly hash weak passwords with bcrypt", async () => {
      const weakPasswords = ["1", "a", "123", "test", "password"];

      for (const password of weakPasswords) {
        const hashedPassword = await AuthUtils.hashPassword(password);

        // Verify hash properties
        expect(hashedPassword).toBeDefined();
        expect(hashedPassword).not.toBe(password);
        expect(hashedPassword.startsWith("$2a$12$")).toBe(true); // bcrypt with 12 rounds

        // Verify hash can be verified
        const isValid = await AuthUtils.verifyPassword(
          password,
          hashedPassword
        );
        expect(isValid).toBe(true);
      }
    });

    it("should generate unique hashes for the same weak password", async () => {
      const password = "123";

      const hash1 = await AuthUtils.hashPassword(password);
      const hash2 = await AuthUtils.hashPassword(password);

      // Hashes should be different due to salt
      expect(hash1).not.toBe(hash2);

      // But both should verify correctly
      expect(await AuthUtils.verifyPassword(password, hash1)).toBe(true);
      expect(await AuthUtils.verifyPassword(password, hash2)).toBe(true);
    });

    it("should maintain security properties even with weak passwords", async () => {
      const weakPassword = "1";
      const hashedPassword = await AuthUtils.hashPassword(weakPassword);

      // Verify wrong passwords are rejected
      expect(await AuthUtils.verifyPassword("2", hashedPassword)).toBe(false);
      expect(await AuthUtils.verifyPassword("a", hashedPassword)).toBe(false);
      expect(await AuthUtils.verifyPassword("", hashedPassword)).toBe(false);

      // Verify correct password is accepted
      expect(await AuthUtils.verifyPassword(weakPassword, hashedPassword)).toBe(
        true
      );
    });
  });

  describe("Requirements compliance verification", () => {
    it("should meet requirement 2.1: accept simple passwords during password change", async () => {
      const simplePasswords = ["simple", "test", "password", "user"];

      for (const password of simplePasswords) {
        const validation = AuthUtils.validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);

        // Verify it can be hashed and verified
        const hashed = await AuthUtils.hashPassword(password);
        const verified = await AuthUtils.verifyPassword(password, hashed);
        expect(verified).toBe(true);
      }
    });

    it("should meet requirement 2.2: accept short passwords (less than 8 characters)", async () => {
      const shortPasswords = ["1", "ab", "123", "test", "short"];

      for (const password of shortPasswords) {
        expect(password.length).toBeLessThan(8);

        const validation = AuthUtils.validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);

        // Verify complete flow works
        const hashed = await AuthUtils.hashPassword(password);
        const verified = await AuthUtils.verifyPassword(password, hashed);
        expect(verified).toBe(true);
      }
    });

    it("should meet requirement 2.3: accept passwords with only letters or numbers", async () => {
      const letterOnlyPasswords = ["abc", "letters", "test"];
      const numberOnlyPasswords = ["123", "456789", "12345"];

      const allPasswords = [...letterOnlyPasswords, ...numberOnlyPasswords];

      for (const password of allPasswords) {
        const validation = AuthUtils.validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);

        // Verify complete flow works
        const hashed = await AuthUtils.hashPassword(password);
        const verified = await AuthUtils.verifyPassword(password, hashed);
        expect(verified).toBe(true);
      }
    });

    it("should meet requirement 2.4: not enforce complexity requirements", async () => {
      const weakPasswords = [
        "1", // Too short by old standards
        "a", // Too short, no complexity
        "123", // No letters
        "abc", // No numbers/uppercase/special chars
        "password", // Common weak password
        "12345678", // Only numbers
        "abcdefgh", // Only lowercase letters
      ];

      for (const password of weakPasswords) {
        const validation = AuthUtils.validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);

        // Verify complete authentication flow would work
        const hashed = await AuthUtils.hashPassword(password);
        const verified = await AuthUtils.verifyPassword(password, hashed);
        expect(verified).toBe(true);
      }
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle empty password", async () => {
      const emptyPassword = "";

      const validation = AuthUtils.validatePasswordStrength(emptyPassword);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);

      // Verify it can be hashed (though this might not be practical)
      const hashed = await AuthUtils.hashPassword(emptyPassword);
      const verified = await AuthUtils.verifyPassword(emptyPassword, hashed);
      expect(verified).toBe(true);
    });

    it("should handle special characters in weak passwords", async () => {
      const specialCharPasswords = ["!", "@#", "   ", "\n", "\t"];

      for (const password of specialCharPasswords) {
        const validation = AuthUtils.validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);

        const hashed = await AuthUtils.hashPassword(password);
        const verified = await AuthUtils.verifyPassword(password, hashed);
        expect(verified).toBe(true);
      }
    });

    it("should handle very long weak passwords", async () => {
      const longWeakPassword = "a".repeat(1000); // 1000 characters of 'a'

      const validation = AuthUtils.validatePasswordStrength(longWeakPassword);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);

      const hashed = await AuthUtils.hashPassword(longWeakPassword);
      const verified = await AuthUtils.verifyPassword(longWeakPassword, hashed);
      expect(verified).toBe(true);
    });
  });

  describe("Backward compatibility", () => {
    it("should still accept strong passwords", async () => {
      const strongPasswords = [
        "StrongPassword123!",
        "ComplexPass456#",
        "SecurePassword789$",
        "MyStrongPass2023!",
      ];

      for (const password of strongPasswords) {
        const validation = AuthUtils.validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toEqual([]);

        const hashed = await AuthUtils.hashPassword(password);
        const verified = await AuthUtils.verifyPassword(password, hashed);
        expect(verified).toBe(true);
      }
    });

    it("should maintain the same validation function interface", () => {
      const result = AuthUtils.validatePasswordStrength("test");

      // Verify the interface hasn't changed
      expect(typeof result).toBe("object");
      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("errors");
      expect(typeof result.isValid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);

      // Verify the new behavior
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
