import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const createMockUser = (overrides = {}) => ({
  id: "test-user-id",
  email: "test@example.com",
  password: "hashedpassword",
  role: "FARMER" as const,
  fullName: "Test User",
  phoneNumber: "+254712345678",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockListing = (overrides = {}) => ({
  id: "test-listing-id",
  farmerId: "test-farmer-id",
  cropType: "Maize",
  quantity: 100,
  unit: "kg",
  pricePerUnit: 50,
  harvestDate: new Date(),
  location: "Kiambu County",
  description: "Fresh maize from organic farm",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockToken = (payload = {}) => {
  const defaultPayload = {
    userId: "test-user-id",
    email: "test@example.com",
    role: "FARMER",
    ...payload,
  };

  return jwt.sign(defaultPayload, process.env.JWT_SECRET!, { expiresIn: "1h" });
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const mockPrismaResponse = <T>(data: T) => {
  return Promise.resolve(data);
};

export const mockPrismaError = (message: string) => {
  const error = new Error(message);
  (error as any).code = "P2002"; // Prisma unique constraint error
  return Promise.reject(error);
};

export const createAuthHeaders = (token?: string) => {
  if (!token) {
    token = createMockToken();
  }
  return {
    Authorization: `Bearer ${token}`,
  };
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
