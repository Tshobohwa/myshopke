import request from "supertest";
import { app } from "../../app";
import { AuthUtils } from "../../utils/auth";
import prisma from "../../lib/prisma";

describe("Validation Consistency Across System", () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.session.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.$disconnect();
  });

  describe("Password validation consistency", () => {
    const weakPasswords = ["123", "a", "password", "test", ""];

    it("should have consistent password validation between Zod and AuthUtils", () => {
      weakPasswords.forEach((password) => {
        // Test AuthUtils validation
        const authUtilsResult = AuthUtils.validatePasswordStrength(password);
        expect(authUtilsResult.isValid).toBe(true);
        expect(authUtilsResult.errors).toEqual([]);
      });
    });

    it("should allow weak passwords in registration (Zod validation)", async () => {
      for (const password of weakPasswords.filter((p) => p !== "")) {
        // Skip empty password for registration
        const registrationData = {
          email: `consistency-${password || "empty"}@example.com`,
          password: password || "x", // Use 'x' for empty password test
          fullName: "Consistency Test User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(registrationData.email);
      }
    });

    it("should allow weak passwords in password change", async () => {
      // First register a user
      const registrationData = {
        email: "change-password-test@example.com",
        password: "initial123",
        fullName: "Password Change User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      };

      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      const accessToken = registerResponse.body.data.tokens.accessToken;

      // Test changing to weak passwords
      const weakNewPasswords = ["123", "a", "password", "test"];

      for (const newPassword of weakNewPasswords) {
        const changePasswordData = {
          currentPassword: "initial123",
          newPassword: newPassword,
        };

        const response = await request(app)
          .put("/api/auth/change-password")
          .set("Authorization", `Bearer ${accessToken}`)
          .send(changePasswordData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toContain(
          "Password changed successfully"
        );

        // Update current password for next iteration
        changePasswordData.currentPassword = newPassword;
      }
    });
  });

  describe("Other validation rules remain strict", () => {
    it("should maintain strict email validation", async () => {
      const invalidEmails = ["invalid", "@domain.com", "user@"];

      for (const email of invalidEmails) {
        const registrationData = {
          email: email,
          password: "123",
          fullName: "Test User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should maintain strict phone number validation", async () => {
      const invalidPhones = [
        "123456789",
        "+1234567890",
        "0712345678",
        "+254812345678", // Invalid prefix
        "+25471234567", // Too short
        "+2547123456789", // Too long
      ];

      for (const phoneNumber of invalidPhones) {
        const registrationData = {
          email: `phone-test-${Date.now()}@example.com`,
          password: "123",
          fullName: "Test User",
          phoneNumber: phoneNumber,
          role: "BUYER",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");

        const phoneError = response.body.error.details.find(
          (error: any) => error.field === "phoneNumber"
        );
        expect(phoneError).toBeDefined();
      }
    });

    it("should maintain strict role validation", async () => {
      const invalidRoles = ["ADMIN", "USER", "SELLER", ""];

      for (const role of invalidRoles) {
        const registrationData = {
          email: `role-test-${Date.now()}@example.com`,
          password: "123",
          fullName: "Test User",
          phoneNumber: "+254712345678",
          role: role,
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("should maintain farmer location requirement", async () => {
      const registrationData = {
        email: "farmer-no-location@example.com",
        password: "123",
        fullName: "Farmer User",
        phoneNumber: "+254712345678",
        role: "FARMER",
        // Missing location
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");

      const locationError = response.body.error.details.find(
        (error: any) => error.field === "location"
      );
      expect(locationError).toBeDefined();
      expect(locationError.message).toBe("Location is required for farmers");
    });
  });

  describe("Security measures with weak passwords", () => {
    it("should properly hash weak passwords", async () => {
      const weakPasswords = ["123", "a", "password", "test"];

      for (const password of weakPasswords) {
        const registrationData = {
          email: `security-${password}@example.com`,
          password: password,
          fullName: "Security Test User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        };

        await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(201);

        // Verify password is hashed
        const user = await prisma.user.findUnique({
          where: { email: registrationData.email },
        });

        expect(user).toBeDefined();
        expect(user!.password).not.toBe(password);
        expect(user!.password.startsWith("$2a$12$")).toBe(true);

        // Verify password can be verified
        const isValid = await AuthUtils.verifyPassword(
          password,
          user!.password
        );
        expect(isValid).toBe(true);
      }
    });

    it("should generate valid JWT tokens for weak password users", async () => {
      const registrationData = {
        email: "jwt-test@example.com",
        password: "123",
        fullName: "JWT Test User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      const { accessToken, refreshToken } = response.body.data.tokens;

      // Verify access token
      expect(accessToken).toBeDefined();
      expect(typeof accessToken).toBe("string");

      // Test that token works for authenticated requests
      const profileResponse = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body.success).toBe(true);
      expect(profileResponse.body.data.user.email).toBe(registrationData.email);

      // Verify refresh token
      expect(refreshToken).toBeDefined();
      expect(typeof refreshToken).toBe("string");

      // Test refresh token functionality
      const refreshResponse = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken })
        .expect(200);

      expect(refreshResponse.body.success).toBe(true);
      expect(refreshResponse.body.data.tokens.accessToken).toBeDefined();
      expect(refreshResponse.body.data.tokens.refreshToken).toBeDefined();
    });
  });

  describe("Validation interface consistency", () => {
    it("should maintain consistent validation response structure", async () => {
      // Test validation error structure
      const invalidData = {
        email: "invalid-email",
        password: "", // Empty password should still fail required validation
        fullName: "",
        phoneNumber: "invalid",
        role: "INVALID",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toHaveProperty("code", "VALIDATION_ERROR");
      expect(response.body.error).toHaveProperty("details");
      expect(Array.isArray(response.body.error.details)).toBe(true);

      // Each validation error should have consistent structure
      response.body.error.details.forEach((error: any) => {
        expect(error).toHaveProperty("field");
        expect(error).toHaveProperty("message");
        expect(error).toHaveProperty("code");
      });
    });

    it("should maintain consistent success response structure", async () => {
      const validData = {
        email: "success-test@example.com",
        password: "123",
        fullName: "Success Test User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(validData)
        .expect(201);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("data");
      expect(response.body.data).toHaveProperty("user");
      expect(response.body.data).toHaveProperty("tokens");
      expect(response.body.data.tokens).toHaveProperty("accessToken");
      expect(response.body.data.tokens).toHaveProperty("refreshToken");
    });
  });
});
