import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../server";
import { createTestPrismaClient } from "../setup";
import {
  cleanDatabase,
  createTestUserWithProfile,
  expectApiSuccess,
  expectApiError,
} from "../helpers";

describe("Authentication Routes", () => {
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

  describe("POST /api/auth/register", () => {
    const validBuyerData = {
      email: "buyer@example.com",
      password: "Password123!",
      fullName: "John Buyer",
      phoneNumber: "+254712345678",
      role: "BUYER",
    };

    const validFarmerData = {
      email: "farmer@example.com",
      password: "Password123!",
      fullName: "Jane Farmer",
      phoneNumber: "+254712345679",
      role: "FARMER",
      profile: {
        location: "Kiambu County",
        farmSize: 5.5,
      },
    };

    it("should register a buyer successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(validBuyerData);

      expectApiSuccess(response, 201);
      expect(response.body.data.user.email).toBe(validBuyerData.email);
      expect(response.body.data.user.role).toBe("BUYER");
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: validBuyerData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.password).not.toBe(validBuyerData.password); // Should be hashed
    });

    it("should register a farmer with profile successfully", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send(validFarmerData);

      expectApiSuccess(response, 201);
      expect(response.body.data.user.email).toBe(validFarmerData.email);
      expect(response.body.data.user.role).toBe("FARMER");

      // Verify profile was created
      const user = await prisma.user.findUnique({
        where: { email: validFarmerData.email },
        include: { profile: true },
      });
      expect(user?.profile?.location).toBe(validFarmerData.profile.location);
      expect(user?.profile?.farmSize).toBe(validFarmerData.profile.farmSize);
    });

    it("should reject registration with duplicate email", async () => {
      // Create first user
      await request(app).post("/api/auth/register").send(validBuyerData);

      // Try to create second user with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...validBuyerData, fullName: "Different Name" });

      expectApiError(response, 400);
      expect(response.body.error.message).toContain("email");
    });

    it("should reject registration with invalid email", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...validBuyerData, email: "invalid-email" });

      expectApiError(response, 400);
    });

    it("should accept registration with weak password", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ ...validBuyerData, password: "123" });

      expectApiSuccess(response, 201);
      expect(response.body.data.user.email).toBe(validBuyerData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    describe("Weak Password Registration Tests", () => {
      const weakPasswords = [
        { password: "123", description: "numeric only password" },
        { password: "a", description: "single character password" },
        { password: "password", description: "common weak password" },
        { password: "test", description: "short simple password" },
        { password: "abc", description: "short alphabetic password" },
        { password: "12345", description: "numeric sequence password" },
        { password: "qwerty", description: "keyboard pattern password" },
        { password: "", description: "empty password" },
      ];

      weakPasswords.forEach(({ password, description }) => {
        it(`should register successfully with ${description}: "${password}"`, async () => {
          const testData = {
            ...validBuyerData,
            email: `test-${Date.now()}-${Math.random()}@example.com`,
            password,
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
          const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
              email: registrationData.email,
              password,
            });

          expectApiSuccess(loginResponse);
          expect(loginResponse.body.data.user.email).toBe(
            registrationData.email
          );
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

    it("should reject registration with missing required fields", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com" });

      expectApiError(response, 400);
    });
  });

  describe("POST /api/auth/login", () => {
    let testUser: any;
    const password = "Password123!";

    beforeEach(async () => {
      testUser = await createTestUserWithProfile(prisma, {
        email: "test@example.com",
        role: "BUYER",
      });
    });

    it("should login with valid credentials", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password,
      });

      expectApiSuccess(response);
      expect(response.body.data.user.id).toBe(testUser.id);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();

      // Verify session was created
      const session = await prisma.session.findFirst({
        where: { userId: testUser.id },
      });
      expect(session).toBeTruthy();
    });

    it("should reject login with invalid email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password,
      });

      expectApiError(response, 401);
    });

    it("should reject login with invalid password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expectApiError(response, 401);
    });

    it("should reject login for inactive user", async () => {
      await prisma.user.update({
        where: { id: testUser.id },
        data: { isActive: false },
      });

      const response = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password,
      });

      expectApiError(response, 401);
    });
  });

  describe("POST /api/auth/logout", () => {
    let testUser: any;
    let authToken: string;

    beforeEach(async () => {
      testUser = await createTestUserWithProfile(prisma);

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      authToken = loginResponse.body.data.token;
    });

    it("should logout successfully", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${authToken}`);

      expectApiSuccess(response);

      // Verify session was removed
      const session = await prisma.session.findFirst({
        where: { userId: testUser.id },
      });
      expect(session).toBeFalsy();
    });

    it("should reject logout without token", async () => {
      const response = await request(app).post("/api/auth/logout");

      expectApiError(response, 401);
    });
  });

  describe("GET /api/auth/profile", () => {
    let testUser: any;
    let authToken: string;

    beforeEach(async () => {
      testUser = await createTestUserWithProfile(prisma, {
        role: "FARMER",
        profile: {
          location: "Kiambu County",
          farmSize: 10.5,
        },
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: testUser.email,
        password: "password123",
      });

      authToken = loginResponse.body.data.token;
    });

    it("should get user profile successfully", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`);

      expectApiSuccess(response);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.profile).toBeDefined();
      expect(response.body.data.profile.location).toBe("Kiambu County");
    });

    it("should reject profile request without token", async () => {
      const response = await request(app).get("/api/auth/profile");

      expectApiError(response, 401);
    });
  });
});
