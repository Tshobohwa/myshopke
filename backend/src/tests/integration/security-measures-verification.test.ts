import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import app from "../../server";
import { PrismaClient } from "@prisma/client";
import {
  cleanDatabase,
  createTestUserWithProfile,
  expectApiSuccess,
  expectApiError,
} from "../helpers";
import { AuthUtils } from "../../utils/auth";

const prisma = new PrismaClient();

describe("Security Measures Verification with Weak Passwords", () => {
  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe("Password Hashing Security", () => {
    it("should properly hash weak passwords with bcrypt", async () => {
      const weakPasswords = ["123", "a", "password", "test", "12345"];

      for (const weakPassword of weakPasswords) {
        // Register user with weak password
        const response = await request(app)
          .post("/api/auth/register")
          .send({
            email: `test${Date.now()}@example.com`,
            password: weakPassword,
            fullName: "Test User",
            phoneNumber: "+254712345678",
            role: "BUYER",
          });

        expectApiSuccess(response, 201);

        // Verify password is hashed in database
        const user = await prisma.user.findUnique({
          where: { email: response.body.data.user.email },
        });

        expect(user).toBeTruthy();
        expect(user!.password).not.toBe(weakPassword);
        expect(user!.password.length).toBeGreaterThan(50); // bcrypt hashes are typically 60 chars
        expect(user!.password.startsWith("$2")).toBe(true); // bcrypt format

        // Verify password can be verified with bcrypt
        const isValid = await bcrypt.compare(weakPassword, user!.password);
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
  });

  describe("JWT Token Security", () => {
    it("should generate valid JWT tokens for users with weak passwords", async () => {
      // Register with weak password
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "weakpass@example.com",
          password: "123",
          fullName: "Weak Password User",
          phoneNumber: "+254712345678",
          role: "FARMER",
          location: "Nairobi",
        });

      expectApiSuccess(registerResponse, 201);

      const { accessToken, refreshToken } = registerResponse.body.data.tokens;

      // Verify access token structure and validity
      expect(accessToken).toBeTruthy();
      expect(typeof accessToken).toBe("string");

      const decodedAccess = jwt.verify(
        accessToken,
        process.env.JWT_SECRET || "test-jwt-secret"
      ) as any;

      expect(decodedAccess.userId).toBe(registerResponse.body.data.user.id);
      expect(decodedAccess.email).toBe("weakpass@example.com");
      expect(decodedAccess.role).toBe("FARMER");
      expect(decodedAccess.iss).toBe("myshopke-api");
      expect(decodedAccess.aud).toBe("myshopke-app");

      // Verify refresh token structure and validity
      expect(refreshToken).toBeTruthy();
      expect(typeof refreshToken).toBe("string");

      const decodedRefresh = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || "test-refresh-secret"
      ) as any;

      expect(decodedRefresh.userId).toBe(registerResponse.body.data.user.id);
      expect(decodedRefresh.email).toBe("weakpass@example.com");
      expect(decodedRefresh.role).toBe("FARMER");
    });

    it("should validate JWT tokens correctly for weak password users", async () => {
      // Create user with weak password
      const user = await createTestUserWithProfile(prisma, {
        email: "jwttest@example.com",
        password: await bcrypt.hash("weak", 12),
        role: "BUYER",
      });

      // Generate tokens using AuthUtils
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = AuthUtils.generateAccessToken(tokenPayload);
      const refreshToken = AuthUtils.generateRefreshToken(tokenPayload);

      // Test access token validation
      const verifiedAccess = AuthUtils.verifyAccessToken(accessToken);
      expect(verifiedAccess.userId).toBe(user.id);
      expect(verifiedAccess.email).toBe(user.email);

      // Test refresh token validation
      const verifiedRefresh = AuthUtils.verifyRefreshToken(refreshToken);
      expect(verifiedRefresh.userId).toBe(user.id);
      expect(verifiedRefresh.email).toBe(user.email);
    });

    it("should reject invalid or expired tokens", async () => {
      const invalidToken = "invalid.token.here";
      const expiredToken = jwt.sign(
        { userId: "test", email: "test@example.com", role: "BUYER" },
        process.env.JWT_SECRET || "test-jwt-secret",
        { expiresIn: "-1h" } // Expired 1 hour ago
      );

      // Test invalid token
      expect(() => AuthUtils.verifyAccessToken(invalidToken)).toThrow(
        "Invalid token"
      );

      // Test expired token
      expect(() => AuthUtils.verifyAccessToken(expiredToken)).toThrow(
        "Token expired"
      );
    });
  });

  describe("Authentication Flow Security", () => {
    it("should authenticate users with weak passwords correctly", async () => {
      const weakPassword = "abc";

      // Register user
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "authflow@example.com",
          password: weakPassword,
          fullName: "Auth Flow User",
          phoneNumber: "+254712345678",
          role: "FARMER",
          location: "Mombasa",
        });

      expectApiSuccess(registerResponse, 201);

      // Login with weak password
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "authflow@example.com",
        password: weakPassword,
      });

      expectApiSuccess(loginResponse);
      expect(loginResponse.body.data.user.email).toBe("authflow@example.com");
      expect(loginResponse.body.data.tokens.accessToken).toBeTruthy();
      expect(loginResponse.body.data.tokens.refreshToken).toBeTruthy();

      // Use access token to access protected endpoint
      const profileResponse = await request(app)
        .get("/api/auth/profile")
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.data.tokens.accessToken}`
        );

      expectApiSuccess(profileResponse);
      expect(profileResponse.body.data.user.email).toBe("authflow@example.com");
    });

    it("should handle password changes to weak passwords", async () => {
      // Create user with strong password
      const user = await createTestUserWithProfile(prisma, {
        email: "passchange@example.com",
        password: await bcrypt.hash("StrongPass123!", 12),
        role: "BUYER",
      });

      // Login with strong password
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "passchange@example.com",
        password: "StrongPass123!",
      });

      expectApiSuccess(loginResponse);

      // Change to weak password
      const changeResponse = await request(app)
        .put("/api/auth/change-password")
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.data.tokens.accessToken}`
        )
        .send({
          currentPassword: "StrongPass123!",
          newPassword: "123", // Very weak password
        });

      expectApiSuccess(changeResponse);

      // Login with new weak password
      const newLoginResponse = await request(app).post("/api/auth/login").send({
        email: "passchange@example.com",
        password: "123",
      });

      expectApiSuccess(newLoginResponse);
      expect(newLoginResponse.body.data.user.email).toBe(
        "passchange@example.com"
      );
    });

    it("should reject wrong passwords even for weak password users", async () => {
      // Register with weak password
      await request(app).post("/api/auth/register").send({
        email: "wrongpass@example.com",
        password: "123",
        fullName: "Wrong Pass User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      });

      // Try to login with wrong password
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "wrongpass@example.com",
        password: "456", // Wrong password
      });

      expectApiError(loginResponse, 401);
      expect(loginResponse.body.error.message).toBe(
        "Invalid email or password"
      );
    });
  });

  describe("CORS Security", () => {
    it("should enforce CORS policy", async () => {
      const response = await request(app)
        .options("/api/auth/login")
        .set("Origin", "http://malicious-site.com")
        .set("Access-Control-Request-Method", "POST");

      // Should not allow unauthorized origins
      expect(response.status).toBe(500); // CORS error
    });

    it("should allow authorized origins", async () => {
      const response = await request(app)
        .options("/api/auth/login")
        .set("Origin", "http://localhost:5173") // Allowed origin
        .set("Access-Control-Request-Method", "POST");

      expect(response.status).toBe(204); // Successful preflight
      expect(response.headers["access-control-allow-origin"]).toBe(
        "http://localhost:5173"
      );
    });
  });

  describe("Rate Limiting Security", () => {
    it("should enforce rate limiting on authentication endpoints", async () => {
      const requests = [];
      const maxRequests = 110; // Slightly above the limit

      // Make many requests quickly
      for (let i = 0; i < maxRequests; i++) {
        requests.push(
          request(app).post("/api/auth/login").send({
            email: "ratelimit@example.com",
            password: "123",
          })
        );
      }

      const responses = await Promise.all(requests);

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);

      // Rate limited responses should have proper error message
      rateLimitedResponses.forEach((response) => {
        expect(response.body.error.code).toBe("RATE_LIMIT_EXCEEDED");
        expect(response.body.error.message).toContain("Too many requests");
      });
    }, 30000); // Increase timeout for this test
  });

  describe("Input Sanitization Security", () => {
    it("should sanitize and validate input even with weak passwords", async () => {
      // Test with malicious input
      const maliciousResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "<script>alert('xss')</script>@example.com",
          password: "123",
          fullName: "<img src=x onerror=alert('xss')>",
          phoneNumber: "+254712345678",
          role: "BUYER",
        });

      expectApiError(maliciousResponse, 400);
      expect(maliciousResponse.body.error.message).toContain(
        "Invalid email format"
      );

      // Test with SQL injection attempt
      const sqlInjectionResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "test@example.com'; DROP TABLE users; --",
          password: "123",
        });

      expectApiError(sqlInjectionResponse, 400);
      expect(sqlInjectionResponse.body.error.message).toContain(
        "Invalid email format"
      );
    });

    it("should validate phone number format", async () => {
      const invalidPhoneResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "phone@example.com",
          password: "123",
          fullName: "Phone Test User",
          phoneNumber: "invalid-phone",
          role: "BUYER",
        });

      expectApiError(invalidPhoneResponse, 400);
      expect(invalidPhoneResponse.body.error.message).toContain("validation");
    });

    it("should validate user role", async () => {
      const invalidRoleResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "role@example.com",
          password: "123",
          fullName: "Role Test User",
          phoneNumber: "+254712345678",
          role: "ADMIN", // Invalid role
        });

      expectApiError(invalidRoleResponse, 400);
      expect(invalidRoleResponse.body.error.message).toContain("validation");
    });
  });

  describe("Session Management Security", () => {
    it("should manage sessions securely with weak passwords", async () => {
      // Register user with weak password
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "session@example.com",
          password: "123",
          fullName: "Session User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        });

      expectApiSuccess(registerResponse, 201);

      const { refreshToken } = registerResponse.body.data.tokens;

      // Verify session is stored in database
      const session = await prisma.session.findUnique({
        where: { refreshToken },
      });

      expect(session).toBeTruthy();
      expect(session!.userId).toBe(registerResponse.body.data.user.id);
      expect(session!.expiresAt).toBeInstanceOf(Date);
      expect(session!.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Test token refresh
      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expectApiSuccess(refreshResponse);
      expect(refreshResponse.body.data.tokens.accessToken).toBeTruthy();
      expect(refreshResponse.body.data.tokens.refreshToken).toBeTruthy();

      // Old refresh token should be replaced
      const oldSession = await prisma.session.findUnique({
        where: { refreshToken },
      });
      expect(oldSession).toBeNull();

      // New refresh token should exist
      const newSession = await prisma.session.findUnique({
        where: { refreshToken: refreshResponse.body.data.tokens.refreshToken },
      });
      expect(newSession).toBeTruthy();
    });

    it("should clean up expired sessions", async () => {
      // Create user
      const user = await createTestUserWithProfile(prisma, {
        email: "cleanup@example.com",
        password: await bcrypt.hash("123", 12),
        role: "BUYER",
      });

      // Create expired session manually
      const expiredRefreshToken = AuthUtils.generateRefreshToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: expiredRefreshToken,
          expiresAt: new Date(Date.now() - 1000 * 60 * 60), // Expired 1 hour ago
        },
      });

      // Login should clean up expired sessions
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "cleanup@example.com",
        password: "123",
      });

      expectApiSuccess(loginResponse);

      // Expired session should be cleaned up
      const expiredSession = await prisma.session.findUnique({
        where: { refreshToken: expiredRefreshToken },
      });
      expect(expiredSession).toBeNull();
    });

    it("should invalidate sessions on password change", async () => {
      // Register user
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "invalidate@example.com",
          password: "123",
          fullName: "Invalidate User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        });

      expectApiSuccess(registerResponse, 201);

      const { accessToken, refreshToken } = registerResponse.body.data.tokens;

      // Change password
      const changeResponse = await request(app)
        .put("/api/auth/change-password")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          currentPassword: "123",
          newPassword: "456",
        });

      expectApiSuccess(changeResponse);

      // Old refresh token should be invalidated
      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken });

      expectApiError(refreshResponse, 401);
      expect(refreshResponse.body.error.message).toContain(
        "Invalid or expired refresh token"
      );
    });
  });

  describe("Account Security Features", () => {
    it("should handle account deactivation properly", async () => {
      // Register user
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
          email: "deactivate@example.com",
          password: "123",
          fullName: "Deactivate User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        });

      expectApiSuccess(registerResponse, 201);

      const { accessToken } = registerResponse.body.data.tokens;

      // Deactivate account
      const deactivateResponse = await request(app)
        .post("/api/auth/deactivate")
        .set("Authorization", `Bearer ${accessToken}`);

      expectApiSuccess(deactivateResponse);

      // Should not be able to login with deactivated account
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: "deactivate@example.com",
        password: "123",
      });

      expectApiError(loginResponse, 401);
      expect(loginResponse.body.error.message).toBe("Account is deactivated");
    });

    it("should prevent access with deactivated account tokens", async () => {
      // Create active user
      const user = await createTestUserWithProfile(prisma, {
        email: "tokendeactivate@example.com",
        password: await bcrypt.hash("123", 12),
        role: "BUYER",
        isActive: true,
      });

      // Generate token for active user
      const accessToken = AuthUtils.generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      // Deactivate user directly in database
      await prisma.user.update({
        where: { id: user.id },
        data: { isActive: false },
      });

      // Token should be rejected for deactivated user
      const profileResponse = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`);

      expectApiError(profileResponse, 401);
      expect(profileResponse.body.error.message).toBe(
        "User not found or inactive"
      );
    });
  });
});
