import request from "supertest";
import app from "../../server";
import {
  createMockUser,
  createMockToken,
  expectApiError,
  expectApiSuccess,
  hashPassword,
} from "../utils/testHelpers";

// Mock the prisma module
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  session: {
    deleteMany: jest.fn(),
  },
};

jest.mock("../../lib/prisma", () => mockPrisma);

describe("Auth Password Change Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/change-password", () => {
    const mockUserId = "test-user-id";
    const mockEmail = "test@example.com";
    const currentStrongPassword = "StrongPassword123!";
    const currentHashedPassword = "$2a$12$hashedStrongPassword";

    const createAuthToken = () =>
      createMockToken({
        userId: mockUserId,
        email: mockEmail,
        role: "FARMER",
      });

    describe("Changing from strong password to weak password", () => {
      it("should successfully change from strong password to very short weak password", async () => {
        const weakPassword = "123";
        const hashedWeakPassword = await hashPassword(weakPassword);

        // Mock user lookup
        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: currentHashedPassword,
          role: "FARMER",
          isActive: true,
        });

        // Mock password update
        mockPrisma.user.update.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: hashedWeakPassword,
        });

        // Mock session cleanup
        mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: currentStrongPassword,
            newPassword: weakPassword,
          });

        expectApiSuccess(response, 200);
        expect(response.body.data.message).toBe(
          "Password changed successfully. Please log in again."
        );

        // Verify password was updated
        expect(mockPrisma.user.update).toHaveBeenCalledWith({
          where: { id: mockUserId },
          data: { password: expect.any(String) },
        });

        // Verify sessions were invalidated
        expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
          where: { userId: mockUserId },
        });
      });

      it("should successfully change from strong password to single character weak password", async () => {
        const weakPassword = "a";
        const hashedWeakPassword = await hashPassword(weakPassword);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: currentHashedPassword,
          role: "FARMER",
          isActive: true,
        });

        mockPrisma.user.update.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: hashedWeakPassword,
        });

        mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: currentStrongPassword,
            newPassword: weakPassword,
          });

        expectApiSuccess(response, 200);
        expect(response.body.data.message).toBe(
          "Password changed successfully. Please log in again."
        );
      });

      it("should successfully change from strong password to common weak password", async () => {
        const weakPassword = "password";
        const hashedWeakPassword = await hashPassword(weakPassword);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: currentHashedPassword,
          role: "FARMER",
          isActive: true,
        });

        mockPrisma.user.update.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: hashedWeakPassword,
        });

        mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: currentStrongPassword,
            newPassword: weakPassword,
          });

        expectApiSuccess(response, 200);
        expect(response.body.data.message).toBe(
          "Password changed successfully. Please log in again."
        );
      });

      it("should successfully change from strong password to numeric-only weak password", async () => {
        const weakPassword = "12345";
        const hashedWeakPassword = await hashPassword(weakPassword);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: currentHashedPassword,
          role: "FARMER",
          isActive: true,
        });

        mockPrisma.user.update.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: hashedWeakPassword,
        });

        mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: currentStrongPassword,
            newPassword: weakPassword,
          });

        expectApiSuccess(response, 200);
        expect(response.body.data.message).toBe(
          "Password changed successfully. Please log in again."
        );
      });
    });

    describe("Changing from weak password to another weak password", () => {
      const currentWeakPassword = "test";
      const currentHashedWeakPassword = "$2a$12$hashedWeakPassword";

      it("should successfully change from one weak password to another weak password", async () => {
        const newWeakPassword = "abc";
        const hashedNewWeakPassword = await hashPassword(newWeakPassword);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: currentHashedWeakPassword,
          role: "FARMER",
          isActive: true,
        });

        mockPrisma.user.update.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: hashedNewWeakPassword,
        });

        mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: currentWeakPassword,
            newPassword: newWeakPassword,
          });

        expectApiSuccess(response, 200);
        expect(response.body.data.message).toBe(
          "Password changed successfully. Please log in again."
        );
      });

      it("should successfully change from numeric weak password to alphabetic weak password", async () => {
        const currentWeakPassword = "123";
        const newWeakPassword = "xyz";
        const hashedNewWeakPassword = await hashPassword(newWeakPassword);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: await hashPassword(currentWeakPassword),
          role: "FARMER",
          isActive: true,
        });

        mockPrisma.user.update.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: hashedNewWeakPassword,
        });

        mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: currentWeakPassword,
            newPassword: newWeakPassword,
          });

        expectApiSuccess(response, 200);
        expect(response.body.data.message).toBe(
          "Password changed successfully. Please log in again."
        );
      });

      it("should successfully change from short weak password to even shorter weak password", async () => {
        const currentWeakPassword = "ab";
        const newWeakPassword = "x";
        const hashedNewWeakPassword = await hashPassword(newWeakPassword);

        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: await hashPassword(currentWeakPassword),
          role: "FARMER",
          isActive: true,
        });

        mockPrisma.user.update.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: hashedNewWeakPassword,
        });

        mockPrisma.session.deleteMany.mockResolvedValue({ count: 1 });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: currentWeakPassword,
            newPassword: newWeakPassword,
          });

        expectApiSuccess(response, 200);
        expect(response.body.data.message).toBe(
          "Password changed successfully. Please log in again."
        );
      });
    });

    describe("Error scenarios", () => {
      it("should fail when current password is incorrect", async () => {
        const incorrectCurrentPassword = "wrongpassword";
        const newWeakPassword = "123";

        mockPrisma.user.findUnique.mockResolvedValue({
          id: mockUserId,
          email: mockEmail,
          password: currentHashedPassword,
          role: "FARMER",
          isActive: true,
        });

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: incorrectCurrentPassword,
            newPassword: newWeakPassword,
          });

        expectApiError(response, 400);
        expect(response.body.error.message).toBe(
          "Current password is incorrect"
        );

        // Verify password was not updated
        expect(mockPrisma.user.update).not.toHaveBeenCalled();
      });

      it("should fail when user is not authenticated", async () => {
        const response = await request(app)
          .post("/api/auth/change-password")
          .send({
            currentPassword: "anypassword",
            newPassword: "123",
          });

        expectApiError(response, 401);
      });

      it("should fail when user does not exist", async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .post("/api/auth/change-password")
          .set("Authorization", `Bearer ${createAuthToken()}`)
          .send({
            currentPassword: "anypassword",
            newPassword: "123",
          });

        expectApiError(response, 404);
        expect(response.body.error.message).toBe("User not found");
      });
    });
  });
});
