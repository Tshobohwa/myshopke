import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authenticateToken, requireRole } from "../../src/middleware/auth";
import { createMockToken, createMockUser } from "../utils/testHelpers";

// Mock the Prisma client
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
};

jest.mock("../../src/lib/prisma", () => ({
  prisma: mockPrisma,
}));

describe("Authentication Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  describe("authenticateToken", () => {
    it("should authenticate valid token", async () => {
      const mockUser = createMockUser();
      const token = createMockToken({ userId: mockUser.id });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toEqual(mockUser);
      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should reject request without token", async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Access token required",
        },
        timestamp: expect.any(String),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should reject invalid token", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid-token",
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Invalid or expired token",
        },
        timestamp: expect.any(String),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should reject token for non-existent user", async () => {
      const token = createMockToken();
      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found",
        },
        timestamp: expect.any(String),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should reject token for inactive user", async () => {
      const mockUser = createMockUser({ isActive: false });
      const token = createMockToken({ userId: mockUser.id });

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "USER_INACTIVE",
          message: "User account is inactive",
        },
        timestamp: expect.any(String),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("requireRole", () => {
    it("should allow access for correct role", () => {
      const mockUser = createMockUser({ role: "FARMER" });
      mockRequest.user = mockUser;

      const middleware = requireRole("FARMER");
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should deny access for incorrect role", () => {
      const mockUser = createMockUser({ role: "BUYER" });
      mockRequest.user = mockUser;

      const middleware = requireRole("FARMER");
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: "Insufficient permissions for this action",
        },
        timestamp: expect.any(String),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should deny access when user is not authenticated", () => {
      const middleware = requireRole("FARMER");
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
        timestamp: expect.any(String),
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should allow access for multiple roles", () => {
      const mockUser = createMockUser({ role: "BUYER" });
      mockRequest.user = mockUser;

      const middleware = requireRole(["FARMER", "BUYER"]);
      middleware(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
