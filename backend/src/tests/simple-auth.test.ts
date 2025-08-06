import request from "supertest";
import app from "../server";
import prisma from "../lib/prisma";

describe("Simplified Authentication System", () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: "test" } },
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: "test" } },
    });
    await prisma.$disconnect();
  });

  describe("POST /api/auth/register", () => {
    it("should register user with plain text password", async () => {
      const userData = {
        email: "test@example.com",
        password: "simple123",
        fullName: "Test User",
        phoneNumber: "1234567890",
        role: "FARMER",
        location: "Nairobi",
        farmSize: 5.5,
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe("test@example.com");
      expect(response.body.user.password).toBe("simple123"); // Plain text password
      expect(response.body.user.fullName).toBe("Test User");
      expect(response.body.user.role).toBe("FARMER");
      expect(response.body.user.profile.location).toBe("Nairobi");
      expect(response.body.user.profile.farmSize).toBe(5.5);
    });

    it("should prevent duplicate email registration", async () => {
      const userData = {
        email: "duplicate@example.com",
        password: "password123",
        fullName: "First User",
        phoneNumber: "1234567890",
        role: "FARMER",
      };

      // First registration
      await request(app).post("/api/auth/register").send(userData);

      // Second registration with same email
      const response = await request(app)
        .post("/api/auth/register")
        .send(userData);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("already exists");
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create test user
      await prisma.user.create({
        data: {
          email: "logintest@example.com",
          password: "testpass123", // Plain text
          fullName: "Login Test User",
          phoneNumber: "9876543210",
          role: "BUYER",
          profile: {
            create: {
              location: "Mombasa",
            },
          },
        },
      });
    });

    it("should login with plain text password comparison", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "logintest@example.com",
        password: "testpass123",
      });

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe("logintest@example.com");
      expect(response.body.user.password).toBe("testpass123"); // Plain text returned
      expect(response.body.user.fullName).toBe("Login Test User");
    });

    it("should fail login with wrong password", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "logintest@example.com",
        password: "wrongpassword",
      });

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
    });

    it("should fail login with non-existent email", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "anypassword",
      });

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Invalid credentials");
    });
  });

  describe("GET /api/auth/profile", () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: "profiletest@example.com",
          password: "profilepass",
          fullName: "Profile Test User",
          phoneNumber: "5555555555",
          role: "FARMER",
          profile: {
            create: {
              location: "Kisumu",
              farmSize: 10.0,
            },
          },
        },
      });
      testUserId = user.id;
    });

    it("should get user profile by ID", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .query({ userId: testUserId });

      expect(response.body.success).toBe(true);
      expect(response.body.user.id).toBe(testUserId);
      expect(response.body.user.email).toBe("profiletest@example.com");
      expect(response.body.user.password).toBe("profilepass"); // Plain text returned
      expect(response.body.user.profile.location).toBe("Kisumu");
    });

    it("should fail without userId parameter", async () => {
      const response = await request(app).get("/api/auth/profile");

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("userId is required");
    });
  });

  describe("PUT /api/auth/profile", () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: "updatetest@example.com",
          password: "updatepass",
          fullName: "Update Test User",
          phoneNumber: "7777777777",
          role: "BUYER",
          profile: {
            create: {
              location: "Nakuru",
            },
          },
        },
      });
      testUserId = user.id;
    });

    it("should update user profile without authentication", async () => {
      const updateData = {
        userId: testUserId,
        fullName: "Updated Name",
        phoneNumber: "8888888888",
        location: "Eldoret",
        farmSize: 15.5,
      };

      const response = await request(app)
        .put("/api/auth/profile")
        .send(updateData);

      expect(response.body.success).toBe(true);
      expect(response.body.user.fullName).toBe("Updated Name");
      expect(response.body.user.phoneNumber).toBe("8888888888");
      expect(response.body.user.profile.location).toBe("Eldoret");
      expect(response.body.user.profile.farmSize).toBe(15.5);
    });
  });

  describe("PUT /api/auth/change-password", () => {
    let testUserId: string;

    beforeEach(async () => {
      const user = await prisma.user.create({
        data: {
          email: "passwordtest@example.com",
          password: "oldpassword",
          fullName: "Password Test User",
          phoneNumber: "9999999999",
          role: "FARMER",
        },
      });
      testUserId = user.id;
    });

    it("should change password without validation", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .send({
          userId: testUserId,
          newPassword: "newpassword123",
        });

      expect(response.body.success).toBe(true);
      expect(response.body.user.password).toBe("newpassword123"); // Plain text stored
    });

    it("should allow weak passwords", async () => {
      const response = await request(app)
        .put("/api/auth/change-password")
        .send({
          userId: testUserId,
          newPassword: "123", // Very weak password
        });

      expect(response.body.success).toBe(true);
      expect(response.body.user.password).toBe("123");
    });
  });
});
