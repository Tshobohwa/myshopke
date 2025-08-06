import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/server";
import {
  createMockUser,
  createMockToken,
  expectApiError,
  expectApiSuccess,
} from "../utils/testHelpers";

// Mock the Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
    create: jest.fn(),
  },
};

// Mock the prisma module
jest.mock("../../src/lib/prisma", () => mockPrisma);

describe("Auth Password Change End-to-End Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Complete password change and login flow with weak passwords", () => {
    const mockUserId = "test-user-id";
    const mockEmail = "test@example.com";
    const mockUserProfile = {
      id: "profile-id",
      userId: mockUserId,
      location: "Nairobi",
      farmSize: "5 acres",
    };

    const createAuthToken = () =>
      createMockToken({
        userId: mockUserId,
        email: mockEmail,
        role: "FARMER",
      });

    it("should change password to weak password and allow login with new weak password", async () => {
      const currentPassword = "StrongPassword123!";
      const newWeakPassword = "123";
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const hashedNewPassword = await bcrypt.hash(newWeakPassword, 12);

      // Step 1: Change password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedCurrentPassword,
        role: "FARMER",
        isActive: true,
      });

      mockPrisma.user.update.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 1 });

      const changePasswordResponse = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${createAuthToken()}`)
        .send({
          currentPassword: currentPassword,
          newPassword: newWeakPassword,
        });

      expectApiSuccess(changePasswordResponse, 200);
      expect(changePasswordResponse.body.data.message).toBe(
        "Password changed successfully. Please log in again."
      );

      // Step 2: Login with new weak password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
        role: "FARMER",
        fullName: "Test User",
        phoneNumber: "+254712345678",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: mockUserProfile,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.session.create.mockResolvedValueOnce({
        id: "session-id",
        userId: mockUserId,
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: mockEmail,
        password: newWeakPassword,
      });

      expectApiSuccess(loginResponse, 200);
      expect(loginResponse.body.data.user.email).toBe(mockEmail);
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
      expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();
    });

    it("should change from weak password to another weak password and allow login", async () => {
      const currentWeakPassword = "test";
      const newWeakPassword = "a";
      const hashedCurrentPassword = await bcrypt.hash(currentWeakPassword, 12);
      const hashedNewPassword = await bcrypt.hash(newWeakPassword, 12);

      // Step 1: Change password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedCurrentPassword,
        role: "FARMER",
        isActive: true,
      });

      mockPrisma.user.update.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 1 });

      const changePasswordResponse = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${createAuthToken()}`)
        .send({
          currentPassword: currentWeakPassword,
          newPassword: newWeakPassword,
        });

      expectApiSuccess(changePasswordResponse, 200);

      // Step 2: Login with new weak password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
        role: "FARMER",
        fullName: "Test User",
        phoneNumber: "+254712345678",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: mockUserProfile,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.session.create.mockResolvedValueOnce({
        id: "session-id",
        userId: mockUserId,
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: mockEmail,
        password: newWeakPassword,
      });

      expectApiSuccess(loginResponse, 200);
      expect(loginResponse.body.data.user.email).toBe(mockEmail);
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
      expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();
    });

    it("should change password to numeric-only weak password and allow login", async () => {
      const currentPassword = "OldPassword456!";
      const newWeakPassword = "12345";
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const hashedNewPassword = await bcrypt.hash(newWeakPassword, 12);

      // Step 1: Change password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedCurrentPassword,
        role: "FARMER",
        isActive: true,
      });

      mockPrisma.user.update.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 1 });

      const changePasswordResponse = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${createAuthToken()}`)
        .send({
          currentPassword: currentPassword,
          newPassword: newWeakPassword,
        });

      expectApiSuccess(changePasswordResponse, 200);

      // Step 2: Login with new numeric weak password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
        role: "FARMER",
        fullName: "Test User",
        phoneNumber: "+254712345678",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: mockUserProfile,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.session.create.mockResolvedValueOnce({
        id: "session-id",
        userId: mockUserId,
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: mockEmail,
        password: newWeakPassword,
      });

      expectApiSuccess(loginResponse, 200);
      expect(loginResponse.body.data.user.email).toBe(mockEmail);
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
      expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();
    });

    it("should change password to common weak password and allow login", async () => {
      const currentPassword = "MySecurePass789!";
      const newWeakPassword = "password";
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const hashedNewPassword = await bcrypt.hash(newWeakPassword, 12);

      // Step 1: Change password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedCurrentPassword,
        role: "FARMER",
        isActive: true,
      });

      mockPrisma.user.update.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 1 });

      const changePasswordResponse = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${createAuthToken()}`)
        .send({
          currentPassword: currentPassword,
          newPassword: newWeakPassword,
        });

      expectApiSuccess(changePasswordResponse, 200);

      // Step 2: Login with common weak password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
        role: "FARMER",
        fullName: "Test User",
        phoneNumber: "+254712345678",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: mockUserProfile,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.session.create.mockResolvedValueOnce({
        id: "session-id",
        userId: mockUserId,
        refreshToken: "refresh-token",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: mockEmail,
        password: newWeakPassword,
      });

      expectApiSuccess(loginResponse, 200);
      expect(loginResponse.body.data.user.email).toBe(mockEmail);
      expect(loginResponse.body.data.tokens.accessToken).toBeDefined();
      expect(loginResponse.body.data.tokens.refreshToken).toBeDefined();
    });

    it("should fail login with old password after password change", async () => {
      const currentPassword = "OldPassword123!";
      const newWeakPassword = "new";
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);
      const hashedNewPassword = await bcrypt.hash(newWeakPassword, 12);

      // Step 1: Change password
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedCurrentPassword,
        role: "FARMER",
        isActive: true,
      });

      mockPrisma.user.update.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword,
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 1 });

      const changePasswordResponse = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${createAuthToken()}`)
        .send({
          currentPassword: currentPassword,
          newPassword: newWeakPassword,
        });

      expectApiSuccess(changePasswordResponse, 200);

      // Step 2: Try to login with old password (should fail)
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedNewPassword, // Password has been changed
        role: "FARMER",
        fullName: "Test User",
        phoneNumber: "+254712345678",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile: mockUserProfile,
      });

      const loginResponse = await request(app).post("/api/auth/login").send({
        email: mockEmail,
        password: currentPassword, // Using old password
      });

      expectApiError(loginResponse, 401);
      expect(loginResponse.body.error.message).toBe(
        "Invalid email or password"
      );
    });
  });

  describe("Password hashing verification with weak passwords", () => {
    const mockUserId = "test-user-id";
    const mockEmail = "test@example.com";

    const createAuthToken = () =>
      createMockToken({
        userId: mockUserId,
        email: mockEmail,
        role: "FARMER",
      });

    it("should properly hash weak passwords with bcrypt", async () => {
      const currentPassword = "strong123!";
      const newWeakPassword = "1";
      const hashedCurrentPassword = await bcrypt.hash(currentPassword, 12);

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUserId,
        email: mockEmail,
        password: hashedCurrentPassword,
        role: "FARMER",
        isActive: true,
      });

      // Capture the hashed password that gets saved
      let savedHashedPassword: string;
      mockPrisma.user.update.mockImplementationOnce(async (args) => {
        savedHashedPassword = args.data.password;
        return {
          id: mockUserId,
          email: mockEmail,
          password: savedHashedPassword,
        };
      });

      mockPrisma.session.deleteMany.mockResolvedValueOnce({ count: 1 });

      const response = await request(app)
        .post("/api/auth/change-password")
        .set("Authorization", `Bearer ${createAuthToken()}`)
        .send({
          currentPassword: currentPassword,
          newPassword: newWeakPassword,
        });

      expectApiSuccess(response, 200);

      // Verify the password was properly hashed
      expect(savedHashedPassword).toBeDefined();
      expect(savedHashedPassword).not.toBe(newWeakPassword); // Should not be plain text
      expect(savedHashedPassword.startsWith("$2a$12$")).toBe(true); // Should be bcrypt hash

      // Verify the hash can be verified against the original weak password
      const isValidHash = await bcrypt.compare(
        newWeakPassword,
        savedHashedPassword
      );
      expect(isValidHash).toBe(true);
    });
  });
});
