import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, requireRole } from "../../middleware/auth";
import { createTestPrismaClient, createTestUser } from "../setup";
import { generateJWT, createAuthHeaders, cleanDatabase } from "../helpers";

const app = express();
app.use(express.json());

// Test routes
app.get("/protected", authMiddleware, (req, res) => {
  res.json({ success: true, data: { userId: req.user?.id } });
});

app.get("/farmer-only", authMiddleware, requireRole("FARMER"), (req, res) => {
  res.json({ success: true, data: { message: "Farmer access granted" } });
});

app.get("/buyer-only", authMiddleware, requireRole("BUYER"), (req, res) => {
  res.json({ success: true, data: { message: "Buyer access granted" } });
});

describe("Authentication Middleware", () => {
  let prisma: PrismaClient;
  let testUser: any;
  let validToken: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    testUser = await prisma.user.create({
      data: createTestUser({ role: "BUYER" }),
    });

    validToken = generateJWT(testUser.id, testUser.role);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe("authMiddleware", () => {
    it("should allow access with valid token", async () => {
      const response = await request(app)
        .get("/protected")
        .set(createAuthHeaders(validToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(testUser.id);
    });

    it("should reject request without token", async () => {
      const response = await request(app).get("/protected");

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain("token");
    });

    it("should reject request with invalid token", async () => {
      const response = await request(app)
        .get("/protected")
        .set(createAuthHeaders("invalid-token"));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject request with expired token", async () => {
      const expiredToken = jwt.sign(
        { userId: testUser.id, role: testUser.role },
        process.env.JWT_SECRET || "test-secret",
        { expiresIn: "-1h" }
      );

      const response = await request(app)
        .get("/protected")
        .set(createAuthHeaders(expiredToken));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should reject request for non-existent user", async () => {
      const fakeToken = generateJWT("non-existent-id");

      const response = await request(app)
        .get("/protected")
        .set(createAuthHeaders(fakeToken));

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe("requireRole middleware", () => {
    it("should allow farmer access to farmer-only route", async () => {
      const farmer = await prisma.user.create({
        data: createTestUser({ role: "FARMER" }),
      });
      const farmerToken = generateJWT(farmer.id, "FARMER");

      const response = await request(app)
        .get("/farmer-only")
        .set(createAuthHeaders(farmerToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should deny buyer access to farmer-only route", async () => {
      const response = await request(app)
        .get("/farmer-only")
        .set(createAuthHeaders(validToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain("permission");
    });

    it("should allow buyer access to buyer-only route", async () => {
      const response = await request(app)
        .get("/buyer-only")
        .set(createAuthHeaders(validToken));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it("should deny farmer access to buyer-only route", async () => {
      const farmer = await prisma.user.create({
        data: createTestUser({ role: "FARMER" }),
      });
      const farmerToken = generateJWT(farmer.id, "FARMER");

      const response = await request(app)
        .get("/buyer-only")
        .set(createAuthHeaders(farmerToken));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });
});
