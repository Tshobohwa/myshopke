import request from "supertest";
import { app } from "../../app";
import { AuthUtils } from "../../utils/auth";
import prisma from "../../lib/prisma";

describe("Signup Validation Fix - Registration Flow", () => {
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

  describe("Registration with weak passwords", () => {
    const weakPasswords = ["123", "a", "password", "test"];

    weakPasswords.forEach((password) => {
      it(`should allow registration with weak password: "${password}"`, async () => {
        const registrationData = {
          email: `test-${password}@example.com`,
          password: password,
          fullName: "Test User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(201);

        // Verify successful registration
        expect(response.body.success).toBe(true);
        expect(response.body.data.user).toBeDefined();
        expect(response.body.data.tokens).toBeDefined();
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();

        // Verify user data
        expect(response.body.data.user.email).toBe(registrationData.email);
        expect(response.body.data.user.fullName).toBe(
          registrationData.fullName
        );
        expect(response.body.data.user.role).toBe(registrationData.role);
        expect(response.body.data.user.password).toBeUndefined(); // Password should not be in response

        // Verify password is properly hashed in database
        const user = await prisma.user.findUnique({
          where: { email: registrationData.email },
        });
        expect(user).toBeDefined();
        expect(user!.password).not.toBe(password); // Should be hashed
        expect(user!.password.startsWith("$2a$12$")).toBe(true); // bcrypt format

        // Verify password can be verified
        const isPasswordValid = await AuthUtils.verifyPassword(
          password,
          user!.password
        );
        expect(isPasswordValid).toBe(true);
      });
    });

    it("should allow registration with very short password", async () => {
      const registrationData = {
        email: "short@example.com",
        password: "1",
        fullName: "Short Password User",
        phoneNumber: "+254712345679",
        role: "FARMER",
        location: "Nairobi",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(registrationData.email);
    });

    it("should allow registration with numeric-only password", async () => {
      const registrationData = {
        email: "numeric@example.com",
        password: "123456",
        fullName: "Numeric Password User",
        phoneNumber: "+254712345680",
        role: "BUYER",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(registrationData.email);
    });

    it("should allow registration with letter-only password", async () => {
      const registrationData = {
        email: "letters@example.com",
        password: "abcdef",
        fullName: "Letters Password User",
        phoneNumber: "+254712345681",
        role: "BUYER",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(registrationData.email);
    });
  });

  describe("Password hashing verification", () => {
    it("should properly hash all weak passwords with bcrypt", async () => {
      const testPasswords = ["123", "a", "password", "test", "12345"];

      for (const password of testPasswords) {
        const registrationData = {
          email: `hash-test-${password}@example.com`,
          password: password,
          fullName: "Hash Test User",
          phoneNumber: "+254712345682",
          role: "BUYER",
        };

        await request(app)
          .post("/api/auth/register")
          .send(registrationData)
          .expect(201);

        // Verify password is hashed in database
        const user = await prisma.user.findUnique({
          where: { email: registrationData.email },
        });

        expect(user).toBeDefined();
        expect(user!.password).not.toBe(password);
        expect(user!.password.startsWith("$2a$12$")).toBe(true);
        expect(user!.password.length).toBe(60); // bcrypt hash length

        // Verify password verification works
        const isValid = await AuthUtils.verifyPassword(
          password,
          user!.password
        );
        expect(isValid).toBe(true);
      }
    });
  });

  describe("Login with weak passwords", () => {
    it("should allow login after registration with weak password", async () => {
      const registrationData = {
        email: "login-test@example.com",
        password: "123",
        fullName: "Login Test User",
        phoneNumber: "+254712345683",
        role: "BUYER",
      };

      // Register user
      await request(app)
        .post("/api/auth/register")
        .send(registrationData)
        .expect(201);

      // Login with same weak password
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: registrationData.email,
          password: registrationData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user).toBeDefined();
      expect(loginResponse.body.data.tokens).toBeDefined();
      expect(loginResponse.body.data.user.email).toBe(registrationData.email);
    });
  });
});
