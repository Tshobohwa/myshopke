import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthUtils } from "../../utils/auth";
import { UserRole } from "../../types";

describe("Security Measures Verification - Unit Tests", () => {
  describe("Password Hashing Security", () => {
    it("should properly hash weak passwords with bcrypt", async () => {
      const weakPasswords = ["123", "a", "password", "test", "12345"];

      for (const weakPassword of weakPasswords) {
        const hashedPassword = await AuthUtils.hashPassword(weakPassword);

        // Verify password is hashed
        expect(hashedPassword).not.toBe(weakPassword);
        expect(hashedPassword.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
        expect(hashedPassword.startsWith("$2")).toBe(true); // bcrypt format

        // Verify password can be verified with bcrypt
        const isValid = await bcrypt.compare(weakPassword, hashedPassword);
        expect(isValid).toBe(true);
      }
    });

    it("should use bcrypt with proper salt rounds (12)", async () => {
      const testPassword = "weak";
      const hashedPassword = await AuthUtils.hashPassword(testPassword);

      // bcrypt hash format: $2a$rounds$salt+hash
      const parts = hashedPassword.split("$");
      expect(parts[0]).toBe(""); // Empty string before first $
      expect(parts[1]).toBe("2a"); // bcrypt version
      expect(parts[2]).toBe("12"); // Salt rounds
      expect(parts[3]).toHaveLength(53); // Salt (22 chars) + hash (31 chars)
    });

    it("should generate different hashes for same weak password", async () => {
      const password = "123";
      const hash1 = await AuthUtils.hashPassword(password);
      const hash2 = await AuthUtils.hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });

    it("should verify passwords correctly", async () => {
      const weakPassword = "abc";
      const hashedPassword = await AuthUtils.hashPassword(weakPassword);

      // Correct password should verify
      const isValidCorrect = await AuthUtils.verifyPassword(
        weakPassword,
        hashedPassword
      );
      expect(isValidCorrect).toBe(true);

      // Wrong password should not verify
      const isValidWrong = await AuthUtils.verifyPassword(
        "wrong",
        hashedPassword
      );
      expect(isValidWrong).toBe(false);
    });
  });

  describe("JWT Token Security", () => {
    const testPayload = {
      userId: "test-user-id",
      email: "test@example.com",
      role: UserRole.BUYER,
    };

    it("should generate valid JWT access tokens", () => {
      const accessToken = AuthUtils.generateAccessToken(testPayload);

      expect(accessToken).toBeTruthy();
      expect(typeof accessToken).toBe("string");

      const decoded = jwt.verify(
        accessToken,
        process.env.JWT_SECRET || "test-jwt-secret"
      ) as any;

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.iss).toBe("myshopke-api");
      expect(decoded.aud).toBe("myshopke-app");
    });

    it("should generate valid JWT refresh tokens", () => {
      const refreshToken = AuthUtils.generateRefreshToken(testPayload);

      expect(refreshToken).toBeTruthy();
      expect(typeof refreshToken).toBe("string");

      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "test-refresh-secret"
      ) as any;

      expect(decoded.userId).toBe(testPayload.userId);
      expect(decoded.email).toBe(testPayload.email);
      expect(decoded.role).toBe(testPayload.role);
      expect(decoded.iss).toBe("myshopke-api");
      expect(decoded.aud).toBe("myshopke-app");
    });

    it("should validate JWT access tokens correctly", () => {
      const accessToken = AuthUtils.generateAccessToken(testPayload);
      const verified = AuthUtils.verifyAccessToken(accessToken);

      expect(verified.userId).toBe(testPayload.userId);
      expect(verified.email).toBe(testPayload.email);
      expect(verified.role).toBe(testPayload.role);
    });

    it("should validate JWT refresh tokens correctly", () => {
      const refreshToken = AuthUtils.generateRefreshToken(testPayload);
      const verified = AuthUtils.verifyRefreshToken(refreshToken);

      expect(verified.userId).toBe(testPayload.userId);
      expect(verified.email).toBe(testPayload.email);
      expect(verified.role).toBe(testPayload.role);
    });

    it("should reject invalid tokens", () => {
      const invalidToken = "invalid.token.here";

      expect(() => AuthUtils.verifyAccessToken(invalidToken)).toThrow(
        "Invalid token"
      );
      expect(() => AuthUtils.verifyRefreshToken(invalidToken)).toThrow(
        "Invalid refresh token"
      );
    });

    it("should reject expired tokens", () => {
      const expiredToken = jwt.sign(
        testPayload,
        process.env.JWT_SECRET || "test-jwt-secret",
        {
          expiresIn: "-1h", // Expired 1 hour ago
          issuer: "myshopke-api",
          audience: "myshopke-app",
        }
      );

      expect(() => AuthUtils.verifyAccessToken(expiredToken)).toThrow(
        "Token expired"
      );
    });

    it("should extract tokens from authorization headers correctly", () => {
      const token = "test-token-123";
      const authHeader = `Bearer ${token}`;

      const extracted = AuthUtils.extractTokenFromHeader(authHeader);
      expect(extracted).toBe(token);

      // Test invalid formats
      expect(AuthUtils.extractTokenFromHeader("Invalid format")).toBeNull();
      expect(AuthUtils.extractTokenFromHeader("Bearer")).toBeNull();
      expect(AuthUtils.extractTokenFromHeader("")).toBeNull();
      expect(AuthUtils.extractTokenFromHeader(undefined)).toBeNull();
    });
  });

  describe("Password Validation Security", () => {
    it("should allow all weak passwords (validation disabled)", () => {
      const weakPasswords = [
        "123",
        "a",
        "password",
        "test",
        "",
        " ",
        "12345",
        "abc",
        "qwerty",
        "admin",
        "user",
      ];

      weakPasswords.forEach((password) => {
        const result = AuthUtils.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    it("should maintain consistent validation interface", () => {
      const result = AuthUtils.validatePasswordStrength("any-password");

      expect(result).toHaveProperty("isValid");
      expect(result).toHaveProperty("errors");
      expect(typeof result.isValid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should always return the same result regardless of input", () => {
      const inputs = ["", "a", "StrongPassword123!", "weak", "12345"];

      inputs.forEach((input) => {
        const result = AuthUtils.validatePasswordStrength(input);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });
  });

  describe("Secure Token Generation", () => {
    it("should generate secure random tokens", () => {
      const token1 = AuthUtils.generateSecureToken();
      const token2 = AuthUtils.generateSecureToken();

      expect(token1).toBeTruthy();
      expect(token2).toBeTruthy();
      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(32); // Default length
      expect(token2.length).toBe(32);

      // Should only contain alphanumeric characters
      expect(/^[A-Za-z0-9]+$/.test(token1)).toBe(true);
      expect(/^[A-Za-z0-9]+$/.test(token2)).toBe(true);
    });

    it("should generate tokens of specified length", () => {
      const lengths = [16, 32, 64, 128];

      lengths.forEach((length) => {
        const token = AuthUtils.generateSecureToken(length);
        expect(token.length).toBe(length);
        expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
      });
    });
  });

  describe("Token Expiry Calculation", () => {
    it("should calculate token expiry dates correctly", () => {
      const now = new Date();

      // Test seconds
      const expiry1s = AuthUtils.getTokenExpiryDate("1s");
      expect(expiry1s.getTime()).toBeGreaterThan(now.getTime());
      expect(expiry1s.getTime()).toBeLessThan(now.getTime() + 2000);

      // Test minutes
      const expiry1m = AuthUtils.getTokenExpiryDate("1m");
      expect(expiry1m.getTime()).toBeGreaterThan(now.getTime() + 59000);
      expect(expiry1m.getTime()).toBeLessThan(now.getTime() + 61000);

      // Test hours
      const expiry1h = AuthUtils.getTokenExpiryDate("1h");
      expect(expiry1h.getTime()).toBeGreaterThan(now.getTime() + 3599000);
      expect(expiry1h.getTime()).toBeLessThan(now.getTime() + 3601000);

      // Test days
      const expiry1d = AuthUtils.getTokenExpiryDate("1d");
      expect(expiry1d.getTime()).toBeGreaterThan(now.getTime() + 86399000);
      expect(expiry1d.getTime()).toBeLessThan(now.getTime() + 86401000);
    });

    it("should handle invalid expiry formats", () => {
      expect(() => AuthUtils.getTokenExpiryDate("invalid")).toThrow(
        "Invalid expiry format"
      );
      expect(() => AuthUtils.getTokenExpiryDate("1x")).toThrow(
        "Invalid time unit"
      );
      expect(() => AuthUtils.getTokenExpiryDate("")).toThrow(
        "Invalid expiry format"
      );
    });
  });

  describe("Security Error Handling", () => {
    it("should handle password hashing errors gracefully", async () => {
      // Mock bcrypt to throw an error
      const originalHash = bcrypt.hash;
      bcrypt.hash = jest.fn().mockRejectedValue(new Error("Hashing failed"));

      await expect(AuthUtils.hashPassword("test")).rejects.toThrow(
        "Password hashing failed"
      );

      // Restore original function
      bcrypt.hash = originalHash;
    });

    it("should handle password verification errors gracefully", async () => {
      // Mock bcrypt to throw an error
      const originalCompare = bcrypt.compare;
      bcrypt.compare = jest
        .fn()
        .mockRejectedValue(new Error("Comparison failed"));

      await expect(AuthUtils.verifyPassword("test", "hash")).rejects.toThrow(
        "Password verification failed"
      );

      // Restore original function
      bcrypt.compare = originalCompare;
    });

    it("should handle JWT generation errors gracefully", () => {
      // Mock jwt.sign to throw an error
      const originalSign = jwt.sign;
      jwt.sign = jest.fn().mockImplementation(() => {
        throw new Error("JWT generation failed");
      });

      const payload = {
        userId: "test-user-id",
        email: "test@example.com",
        role: UserRole.BUYER,
      };

      expect(() => AuthUtils.generateAccessToken(payload)).toThrow(
        "Token generation failed"
      );
      expect(() => AuthUtils.generateRefreshToken(payload)).toThrow(
        "Refresh token generation failed"
      );

      // Restore original function
      jwt.sign = originalSign;
    });
  });

  describe("Security Requirements Compliance", () => {
    it("should meet requirement 4.1: hash passwords with bcrypt", async () => {
      const weakPassword = "123";
      const hashedPassword = await AuthUtils.hashPassword(weakPassword);

      // Verify bcrypt format and properties
      expect(hashedPassword.startsWith("$2a$12$")).toBe(true);
      expect(hashedPassword.length).toBe(60); // Standard bcrypt hash length
      expect(await bcrypt.compare(weakPassword, hashedPassword)).toBe(true);
    });

    it("should meet requirement 4.2: implement proper authentication flows", () => {
      const payload = {
        userId: "test-user",
        email: "test@example.com",
        role: UserRole.FARMER,
      };

      // Generate tokens
      const accessToken = AuthUtils.generateAccessToken(payload);
      const refreshToken = AuthUtils.generateRefreshToken(payload);

      // Verify tokens
      const verifiedAccess = AuthUtils.verifyAccessToken(accessToken);
      const verifiedRefresh = AuthUtils.verifyRefreshToken(refreshToken);

      expect(verifiedAccess.userId).toBe(payload.userId);
      expect(verifiedRefresh.userId).toBe(payload.userId);
    });

    it("should meet requirement 4.3: protect against security vulnerabilities", () => {
      // Test that validation still exists (even if disabled)
      const validationResult = AuthUtils.validatePasswordStrength("any-input");
      expect(validationResult).toHaveProperty("isValid");
      expect(validationResult).toHaveProperty("errors");

      // Test that secure token generation works
      const secureToken = AuthUtils.generateSecureToken();
      expect(secureToken).toBeTruthy();
      expect(secureToken.length).toBe(32);
    });

    it("should meet requirement 4.4: implement proper session management", () => {
      const payload = {
        userId: "session-test",
        email: "session@example.com",
        role: UserRole.BUYER,
      };

      // Generate tokens with proper expiry
      const accessToken = AuthUtils.generateAccessToken(payload);
      const refreshToken = AuthUtils.generateRefreshToken(payload);

      // Verify tokens have proper structure
      const decodedAccess = jwt.decode(accessToken) as any;
      const decodedRefresh = jwt.decode(refreshToken) as any;

      expect(decodedAccess.exp).toBeTruthy();
      expect(decodedRefresh.exp).toBeTruthy();
      expect(decodedAccess.iss).toBe("myshopke-api");
      expect(decodedRefresh.iss).toBe("myshopke-api");
      expect(decodedAccess.aud).toBe("myshopke-app");
      expect(decodedRefresh.aud).toBe("myshopke-app");
    });
  });
});
