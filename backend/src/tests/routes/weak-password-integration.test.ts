import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../server";
import { createTestPrismaClient } from "../setup";
import { cleanDatabase, expectApiSuccess, expectApiError } from "../helpers";

describe("Weak Password Integration Tests", () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe("Registration with Weak Passwords", () => {
    const weakPasswords = [
      { password: "123", description: "numeric only password" },
      { password: "a", description: "single character password" },
      { password: "password", description: "common weak password" },
      { password: "test", description: "short simple password" },
      { password: "abc", description: "short alphabetic password" },
      { password: "12345", description: "numeric sequence password" },
      { password: "qwerty", description: "keyboard pattern password" },
    ];

    weakPasswords.forEach(({ password, description }) => {
      it(`should register successfully with ${description}: "${password}"`, async () => {
        const testData = {
          email: `test-${Date.now()}-${Math.random()}@example.com`,
          password,
          fullName: "Test User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(testData);

        expectApiSuccess(response, 201);
        expect(response.body.data.user.email).toBe(testData.email);
        expect(response.body.data.user.role).toBe("BUYER");
        expect(response.body.data.tokens.accessToken).toBeDefined();
        expect(response.body.data.tokens.refreshToken).toBeDefined();

        // Verify user was created in database
        const user = await prisma.user.findUnique({
          where: { email: testData.email },
        });
        expect(user).toBeTruthy();
        expect(user?.password).not.toBe(password); // Should be hashed
        expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
      });
    });

    it("should register farmer with weak password and profile", async () => {
      const testData = {
        email: `farmer-${Date.now()}@example.com`,
        password: "123",
        fullName: "Test Farmer",
        phoneNumber: "+254712345679",
        role: "FARMER",
        location: "Kiambu County",
        farmSize: 5.5,
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(testData);

      expectApiSuccess(response, 201);
      expect(response.body.data.user.email).toBe(testData.email);
      expect(response.body.data.user.role).toBe("FARMER");

      // Verify profile was created
      const user = await prisma.user.findUnique({
        where: { email: testData.email },
        include: { profile: true },
      });
      expect(user?.profile?.location).toBe(testData.location);
      expect(user?.profile?.farmSize).toBe(testData.farmSize);
      expect(user?.password).not.toBe("123"); // Should be hashed
    });
  });

  describe("Login with Weak Passwords After Registration", () => {
    const testCases = [
      { password: "123", description: "numeric password" },
      { password: "a", description: "single character password" },
      { password: "password", description: "common weak password" },
      { password: "test", description: "short simple password" },
    ];

    testCases.forEach(({ password, description }) => {
      it(`should login successfully after registering with ${description}`, async () => {
        // First register with weak password
        const registrationData = {
          email: `login-test-${Date.now()}-${Math.random()}@example.com`,
          password,
          fullName: "Login Test User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        };

        const registerResponse = await request(app)
          .post("/api/auth/register")
          .send(registrationData);

        expectApiSuccess(registerResponse, 201);

        // Then try to login with the same weak password
        const loginResponse = await request(app).post("/api/auth/login").send({
          email: registrationData.email,
          password,
        });

        expectApiSuccess(loginResponse);
        expect(loginResponse.body.data.user.email).toBe(registrationData.email);
        expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
        expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();

        // Verify session was created
        const user = await prisma.user.findUnique({
          where: { email: registrationData.email },
        });
        const session = await prisma.session.findFirst({
          where: { userId: user?.id },
        });
        expect(session).toBeTruthy();
      });
    });

    it("should maintain authentication flow with weak passwords", async () => {
      const testData = {
        email: `auth-flow-${Date.now()}@example.com`,
        password: "123",
        fullName: "Auth Flow Test",
        phoneNumber: "+254712345678",
        role: "BUYER",
      };

      // Register
      const registerResponse = await request(app)
        .post("/api/auth/register")
        .send(testData);

      expectApiSuccess(registerResponse, 201);
      const { accessToken } = registerResponse.body.data.tokens;

      // Use token to access protected route
      const profileResponse = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${accessToken}`);

      expectApiSuccess(profileResponse);
      expect(profileResponse.body.data.email).toBe(testData.email);

      // Login again with weak password
      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testData.email,
        password: "123",
      });

      expectApiSuccess(loginResponse);

      // Logout
      const logoutResponse = await request(app)
        .post("/api/auth/logout")
        .set(
          "Authorization",
          `Bearer ${loginResponse.body.data.tokens.accessToken}`
        );

      expectApiSuccess(logoutResponse);
    });
  });

  describe("Password Hashing Verification", () => {
    it("should properly hash weak passwords with bcrypt", async () => {
      const weakPasswords = ["123", "a", "password", "test"];

      for (const password of weakPasswords) {
        const testData = {
          email: `hash-test-${Date.now()}-${Math.random()}@example.com`,
          password,
          fullName: "Hash Test User",
          phoneNumber: "+254712345678",
          role: "BUYER",
        };

        const response = await request(app)
          .post("/api/auth/register")
          .send(testData);

        expectApiSuccess(response, 201);

        // Verify password is hashed in database
        const user = await prisma.user.findUnique({
          where: { email: testData.email },
        });

        expect(user?.password).not.toBe(password);
        expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
        expect(user?.password.length).toBeGreaterThan(50); // bcrypt hashes are long
      }
    });
  });
});
