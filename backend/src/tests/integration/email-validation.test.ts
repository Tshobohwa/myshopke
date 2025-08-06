import request from "supertest";
import { app } from "../../app";
import prisma from "../../lib/prisma";

describe("Email Validation Accuracy", () => {
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

  describe("Valid email formats", () => {
    const validEmails = [
      "user@domain.com",
      "test@example.org",
      "admin@company.co.ke",
      "farmer@agriculture.gov.ke",
      "buyer123@marketplace.com",
      "user.name@domain.com",
      "user+tag@domain.com",
      "user_name@domain-name.com",
    ];

    validEmails.forEach((email) => {
      it(`should accept valid email: ${email}`, async () => {
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
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(email.toLowerCase());
      });
    });
  });

  describe("Invalid email formats", () => {
    const invalidEmails = [
      { email: "invalid", expectedError: "Invalid email format" },
      { email: "@domain.com", expectedError: "Invalid email format" },
      { email: "user@", expectedError: "Invalid email format" },
      { email: "user.domain.com", expectedError: "Invalid email format" },
      { email: "user@domain", expectedError: "Invalid email format" },
      { email: "", expectedError: "Invalid email format" },
      { email: "user space@domain.com", expectedError: "Invalid email format" },
      { email: "user@@domain.com", expectedError: "Invalid email format" },
    ];

    invalidEmails.forEach(({ email, expectedError }) => {
      it(`should reject invalid email: "${email}"`, async () => {
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

        // Check that email validation error is present
        const emailError = response.body.error.details.find(
          (error: any) => error.field === "email"
        );
        expect(emailError).toBeDefined();
        expect(emailError.message).toBe(expectedError);
      });
    });
  });

  describe("Duplicate email handling", () => {
    it("should reject registration with duplicate email", async () => {
      const registrationData = {
        email: "duplicate@example.com",
        password: "123",
        fullName: "First User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      };

      // Register first user
      await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      // Try to register second user with same email
      const duplicateData = {
        ...registrationData,
        fullName: "Second User",
        phoneNumber: "+254712345679",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(
        "User with this email already exists"
      );
    });

    it("should handle case-insensitive duplicate email detection", async () => {
      const registrationData = {
        email: "CaseTest@Example.COM",
        password: "123",
        fullName: "First User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      };

      // Register first user
      await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      // Try to register with different case
      const duplicateData = {
        email: "casetest@example.com",
        password: "456",
        fullName: "Second User",
        phoneNumber: "+254712345679",
        role: "FARMER",
        location: "Nairobi",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(duplicateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe(
        "User with this email already exists"
      );
    });
  });

  describe("Email normalization", () => {
    it("should normalize email to lowercase", async () => {
      const registrationData = {
        email: "TestUser@EXAMPLE.COM",
        password: "123",
        fullName: "Test User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe("testuser@example.com");

      // Verify in database
      const user = await prisma.user.findUnique({
        where: { email: "testuser@example.com" },
      });
      expect(user).toBeDefined();
      expect(user!.email).toBe("testuser@example.com");
    });
  });

  describe("Email validation in login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post("/api/auth/register").send({
        email: "login-test@example.com",
        password: "123",
        fullName: "Login Test User",
        phoneNumber: "+254712345678",
        role: "BUYER",
      });
    });

    it("should accept valid email format in login", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "login-test@example.com",
          password: "123",
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it("should reject invalid email format in login", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "invalid-email",
          password: "123",
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");

      const emailError = response.body.error.details.find(
        (error: any) => error.field === "email"
      );
      expect(emailError).toBeDefined();
      expect(emailError.message).toBe("Invalid email format");
    });
  });
});
