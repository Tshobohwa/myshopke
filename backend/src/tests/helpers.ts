import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

export const generateJWT = (userId: string, role: string = "BUYER") => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || "test-secret", {
    expiresIn: "1h",
  });
};

export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export const createAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

export const cleanDatabase = async (prisma: PrismaClient) => {
  // Delete in order to respect foreign key constraints
  await prisma.interaction.deleteMany();
  await prisma.produceListing.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.session.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.category.deleteMany();
  await prisma.location.deleteMany();
};

export const expectApiError = (
  response: any,
  statusCode: number,
  errorCode?: string
) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(false);
  expect(response.body.error).toBeDefined();
  expect(response.body.error.message).toBeDefined();

  if (errorCode) {
    expect(response.body.error.code).toBe(errorCode);
  }
};

export const expectApiSuccess = (response: any, statusCode: number = 200) => {
  expect(response.status).toBe(statusCode);
  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeDefined();
  expect(response.body.timestamp).toBeDefined();
};

export const createTestUserWithProfile = async (
  prisma: PrismaClient,
  userData: any = {}
) => {
  const hashedPassword = await hashPassword("password123");

  const user = await prisma.user.create({
    data: {
      email: `test${Date.now()}@example.com`,
      password: hashedPassword,
      fullName: "Test User",
      phoneNumber: "+254712345678",
      role: "BUYER",
      ...userData,
    },
  });

  if (userData.profile) {
    await prisma.userProfile.create({
      data: {
        userId: user.id,
        ...userData.profile,
      },
    });
  }

  return user;
};
