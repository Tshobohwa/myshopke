import { AuthErrorHandler, DetailedAuthError } from "../auth-error-handler";
import { AxiosError } from "axios";

// Mock console methods for testing
const originalConsole = console;
beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
  console.debug = jest.fn();
  console.group = jest.fn();
  console.groupEnd = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.debug = originalConsole.debug;
  console.group = originalConsole.group;
  console.groupEnd = originalConsole.groupEnd;
});

describe("AuthErrorHandler", () => {
  describe("processError", () => {
    it("should process API response errors correctly", () => {
      const axiosError = {
        response: {
          status: 400,
          data: {
            error: {
              code: "VALIDATION_ERROR",
              message: "Invalid input data",
              validation: ["Email is required", "Password is too short"],
            },
            timestamp: "2024-01-01T00:00:00.000Z",
          },
        },
      } as AxiosError;

      const result = AuthErrorHandler.processError(axiosError);

      expect(result.code).toBe("VALIDATION_ERROR");
      expect(result.message).toBe("Invalid input data");
      expect(result.statusCode).toBe(400);
      expect(result.details?.validation).toEqual([
        "Email is required",
        "Password is too short",
      ]);
      expect(result.details?.suggestions).toBeDefined();
    });

    it("should handle network timeout errors", () => {
      const networkError = {
        request: {},
        code: "ECONNABORTED",
        message: "timeout of 10000ms exceeded",
      };

      const result = AuthErrorHandler.processError(networkError);

      expect(result.code).toBe("NETWORK_TIMEOUT");
      expect(result.message).toContain("timed out");
      expect(result.statusCode).toBe(0);
      expect(result.details?.suggestions).toContain(
        "Check your internet connection speed"
      );
    });

    it("should handle connection refused errors", () => {
      const networkError = {
        request: {},
        code: "ECONNREFUSED",
        message: "connect ECONNREFUSED 127.0.0.1:3001",
      };

      const result = AuthErrorHandler.processError(networkError);

      expect(result.code).toBe("SERVER_UNAVAILABLE");
      expect(result.message).toContain("Cannot connect to the server");
      expect(result.details?.suggestions).toContain(
        "Check if the server is running"
      );
    });

    it("should handle DNS resolution errors", () => {
      const networkError = {
        request: {},
        code: "ENOTFOUND",
        message: "getaddrinfo ENOTFOUND api.example.com",
      };

      const result = AuthErrorHandler.processError(networkError);

      expect(result.code).toBe("DNS_ERROR");
      expect(result.message).toContain("DNS lookup failed");
      expect(result.details?.suggestions).toContain(
        "Try using a different DNS server"
      );
    });

    it("should handle generic network errors", () => {
      const networkError = {
        request: {},
        message: "Network Error",
      };

      const result = AuthErrorHandler.processError(networkError);

      expect(result.code).toBe("NETWORK_ERROR");
      expect(result.message).toBe("Unable to connect to the server");
      expect(result.details?.suggestions).toContain(
        "Check your internet connection"
      );
    });

    it("should handle unknown errors", () => {
      const unknownError = new Error("Something went wrong");

      const result = AuthErrorHandler.processError(unknownError);

      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.message).toBe("Something went wrong");
      expect(result.statusCode).toBe(500);
    });
  });

  describe("formatErrorMessage", () => {
    it("should format error message with details and suggestions", () => {
      const error: DetailedAuthError = {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: {
          validation: ["Email is required", "Password is too short"],
          suggestions: ["Check all fields", "Use a stronger password"],
        },
        statusCode: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const result = AuthErrorHandler.formatErrorMessage(error, {
        showDetails: true,
        showSuggestions: true,
        logToConsole: false,
      });

      expect(result).toContain("Invalid input");
      expect(result).toContain("Validation errors:");
      expect(result).toContain("Email is required");
      expect(result).toContain("Suggestions:");
      expect(result).toContain("Check all fields");
      expect(result).toContain("Error Code: VALIDATION_ERROR");
    });

    it("should format error message without details when disabled", () => {
      const error: DetailedAuthError = {
        code: "VALIDATION_ERROR",
        message: "Invalid input",
        details: {
          validation: ["Email is required"],
          suggestions: ["Check all fields"],
        },
        statusCode: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const result = AuthErrorHandler.formatErrorMessage(error, {
        showDetails: false,
        showSuggestions: false,
        logToConsole: false,
      });

      expect(result).toBe("Invalid input");
      expect(result).not.toContain("Validation errors:");
      expect(result).not.toContain("Suggestions:");
    });
  });

  describe("getErrorSuggestions", () => {
    it("should return appropriate suggestions for invalid credentials", () => {
      const error: DetailedAuthError = {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
        statusCode: 401,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const suggestions = AuthErrorHandler.getErrorSuggestions(error);

      expect(suggestions).toContain("Double-check your email and password");
      expect(suggestions).toContain("Make sure Caps Lock is not enabled");
      expect(suggestions).toContain(
        "Try resetting your password if you forgot it"
      );
    });

    it("should return appropriate suggestions for email already exists", () => {
      const error: DetailedAuthError = {
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email is already registered",
        statusCode: 409,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const suggestions = AuthErrorHandler.getErrorSuggestions(error);

      expect(suggestions).toContain("Try logging in instead of registering");
      expect(suggestions).toContain("Use a different email address");
    });

    it("should return appropriate suggestions for account deactivated", () => {
      const error: DetailedAuthError = {
        code: "ACCOUNT_DEACTIVATED",
        message: "Your account has been deactivated",
        statusCode: 403,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const suggestions = AuthErrorHandler.getErrorSuggestions(error);

      expect(suggestions).toContain(
        "Contact support to reactivate your account"
      );
      expect(suggestions).toContain(
        "Check your email for account status updates"
      );
    });
  });

  describe("categorizeError", () => {
    it("should categorize network errors correctly", () => {
      const error: DetailedAuthError = {
        code: "NETWORK_ERROR",
        message: "Network error",
        statusCode: 0,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const category = AuthErrorHandler.categorizeError(error);
      expect(category).toBe("network");
    });

    it("should categorize validation errors correctly", () => {
      const error: DetailedAuthError = {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { validation: ["Email is required"] },
        statusCode: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const category = AuthErrorHandler.categorizeError(error);
      expect(category).toBe("validation");
    });

    it("should categorize authentication errors correctly", () => {
      const error: DetailedAuthError = {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
        statusCode: 401,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const category = AuthErrorHandler.categorizeError(error);
      expect(category).toBe("authentication");
    });

    it("should categorize server errors correctly", () => {
      const error: DetailedAuthError = {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        statusCode: 500,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const category = AuthErrorHandler.categorizeError(error);
      expect(category).toBe("server");
    });
  });

  describe("getErrorTitle", () => {
    it("should return appropriate titles for different error categories", () => {
      const validationError: DetailedAuthError = {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        statusCode: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const authError: DetailedAuthError = {
        code: "INVALID_CREDENTIALS",
        message: "Invalid credentials",
        statusCode: 401,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const networkError: DetailedAuthError = {
        code: "NETWORK_ERROR",
        message: "Network error",
        statusCode: 0,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      expect(AuthErrorHandler.getErrorTitle(validationError)).toBe(
        "Validation Error"
      );
      expect(AuthErrorHandler.getErrorTitle(authError)).toBe(
        "Authentication Failed"
      );
      expect(AuthErrorHandler.getErrorTitle(networkError)).toBe(
        "Connection Error"
      );
    });
  });

  describe("logError", () => {
    it("should log error details in development mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const error: DetailedAuthError = {
        code: "TEST_ERROR",
        message: "Test error message",
        statusCode: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      AuthErrorHandler.logError(error, "Test Context");

      expect(console.group).toHaveBeenCalledWith(
        "🚨 Auth Error - Test Context"
      );
      expect(console.error).toHaveBeenCalledWith("Error Code:", "TEST_ERROR");
      expect(console.error).toHaveBeenCalledWith(
        "Message:",
        "Test error message"
      );
      expect(console.groupEnd).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });

    it("should not log in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      const error: DetailedAuthError = {
        code: "TEST_ERROR",
        message: "Test error message",
        statusCode: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      // Clear previous calls
      jest.clearAllMocks();

      AuthErrorHandler.logError(error, "Test Context");

      expect(console.group).not.toHaveBeenCalled();
      expect(console.error).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("shouldHighlightField", () => {
    it("should return field name when field error is present", () => {
      const error: DetailedAuthError = {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details: { field: "email" },
        statusCode: 400,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const result = AuthErrorHandler.shouldHighlightField(error);
      expect(result).toBe("email");
    });

    it("should return null when no field error is present", () => {
      const error: DetailedAuthError = {
        code: "NETWORK_ERROR",
        message: "Network error",
        statusCode: 0,
        timestamp: "2024-01-01T00:00:00.000Z",
      };

      const result = AuthErrorHandler.shouldHighlightField(error);
      expect(result).toBeNull();
    });
  });
});
