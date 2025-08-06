import { AxiosError } from "axios";

export interface DetailedAuthError {
  code: string;
  message: string;
  details?: {
    field?: string;
    validation?: string[];
    suggestions?: string[];
  };
  statusCode: number;
  timestamp: string;
  originalError?: any;
}

export interface ErrorDisplayOptions {
  showDetails: boolean;
  showSuggestions: boolean;
  logToConsole: boolean;
}

export class AuthErrorHandler {
  /**
   * Process any error into a detailed auth error structure
   */
  static processError(error: any): DetailedAuthError {
    const timestamp = new Date().toISOString();

    // Handle Axios errors (API responses)
    if (error.response) {
      const axiosError = error as AxiosError<any>;
      const responseData = axiosError.response?.data;

      return {
        code: responseData?.error?.code || "API_ERROR",
        message: responseData?.error?.message || "An API error occurred",
        details: {
          field: responseData?.error?.field,
          validation:
            responseData?.error?.validation ||
            responseData?.error?.details?.validation,
          suggestions: this.generateSuggestions(
            axiosError.response?.status,
            responseData?.error?.code
          ),
        },
        statusCode: axiosError.response?.status || 500,
        timestamp: responseData?.timestamp || timestamp,
        originalError: error,
      };
    }

    // Handle network errors
    if (error.request) {
      const networkError = this.analyzeNetworkError(error);
      return {
        code: networkError.code,
        message: networkError.message,
        details: {
          suggestions: networkError.suggestions,
        },
        statusCode: 0,
        timestamp,
        originalError: error,
      };
    }

    // Handle other errors
    return {
      code: "UNKNOWN_ERROR",
      message: error.message || "An unexpected error occurred",
      details: {
        suggestions: [
          "Please try again or contact support if the problem persists",
        ],
      },
      statusCode: 500,
      timestamp,
      originalError: error,
    };
  }

  /**
   * Format error message for user display
   */
  static formatErrorMessage(
    error: DetailedAuthError,
    options: ErrorDisplayOptions = {
      showDetails: true,
      showSuggestions: true,
      logToConsole: false,
    }
  ): string {
    let message = error.message;

    // Add validation details if available
    if (options.showDetails && error.details?.validation?.length) {
      message +=
        "\n\nValidation errors:\n• " + error.details.validation.join("\n• ");
    }

    // Add suggestions if available
    if (options.showSuggestions && error.details?.suggestions?.length) {
      message +=
        "\n\nSuggestions:\n• " + error.details.suggestions.join("\n• ");
    }

    // Add error code for technical users
    if (options.showDetails && error.code !== "UNKNOWN_ERROR") {
      message += `\n\nError Code: ${error.code}`;
    }

    return message;
  }

  /**
   * Generate contextual suggestions based on error type
   */
  static getErrorSuggestions(error: DetailedAuthError): string[] {
    const suggestions: string[] = [];

    switch (error.code) {
      case "INVALID_CREDENTIALS":
        suggestions.push(
          "Double-check your email and password",
          "Make sure Caps Lock is not enabled",
          "Try resetting your password if you forgot it"
        );
        break;

      case "EMAIL_ALREADY_EXISTS":
        suggestions.push(
          "Try logging in instead of registering",
          "Use a different email address",
          "Reset your password if you forgot it"
        );
        break;

      case "VALIDATION_ERROR":
        suggestions.push(
          "Check all required fields are filled",
          "Ensure email format is correct",
          "Password must meet security requirements"
        );
        break;

      case "ACCOUNT_DEACTIVATED":
        suggestions.push(
          "Contact support to reactivate your account",
          "Check your email for account status updates"
        );
        break;

      case "NETWORK_ERROR":
        suggestions.push(
          "Check your internet connection",
          "Try refreshing the page",
          "Contact support if the problem persists"
        );
        break;

      default:
        suggestions.push(
          "Please try again or contact support if the problem persists"
        );
    }

    return suggestions;
  }

  /**
   * Analyze network errors for specific guidance
   */
  private static analyzeNetworkError(error: any): {
    code: string;
    message: string;
    suggestions: string[];
  } {
    // Check if it's a timeout error
    if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
      return {
        code: "NETWORK_TIMEOUT",
        message: "Request timed out - the server is taking too long to respond",
        suggestions: [
          "Check your internet connection speed",
          "Try again in a few moments",
          "The server may be experiencing high load",
          "Contact support if the problem persists",
        ],
      };
    }

    // Check if it's a connection refused error
    if (
      error.code === "ECONNREFUSED" ||
      error.message?.includes("ECONNREFUSED")
    ) {
      return {
        code: "SERVER_UNAVAILABLE",
        message: "Cannot connect to the server - it may be down or unreachable",
        suggestions: [
          "Check if the server is running",
          "Verify the server URL is correct",
          "Check your network connection",
          "Try again later or contact support",
        ],
      };
    }

    // Check if it's a DNS resolution error
    if (error.code === "ENOTFOUND" || error.message?.includes("ENOTFOUND")) {
      return {
        code: "DNS_ERROR",
        message: "Cannot resolve server address - DNS lookup failed",
        suggestions: [
          "Check your internet connection",
          "Verify the server URL is correct",
          "Try using a different DNS server",
          "Contact your network administrator",
        ],
      };
    }

    // Check if it's a network unreachable error
    if (
      error.code === "ENETUNREACH" ||
      error.message?.includes("network is unreachable")
    ) {
      return {
        code: "NETWORK_UNREACHABLE",
        message: "Network is unreachable - cannot connect to the internet",
        suggestions: [
          "Check your internet connection",
          "Verify your network settings",
          "Try connecting to a different network",
          "Contact your internet service provider",
        ],
      };
    }

    // Generic network error
    return {
      code: "NETWORK_ERROR",
      message: "Unable to connect to the server",
      suggestions: [
        "Check your internet connection",
        "Verify the server is running",
        "Try again in a few moments",
        "Contact support if the problem continues",
      ],
    };
  }

  /**
   * Check network connectivity
   */
  static async checkNetworkConnectivity(): Promise<boolean> {
    try {
      // Try to fetch a small resource to test connectivity
      const response = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Generate suggestions based on HTTP status and error code
   */
  private static generateSuggestions(
    statusCode?: number,
    errorCode?: string
  ): string[] {
    if (errorCode) {
      return this.getErrorSuggestions({ code: errorCode } as DetailedAuthError);
    }

    switch (statusCode) {
      case 400:
        return [
          "Check your input and try again",
          "Ensure all required fields are filled",
        ];
      case 401:
        return ["Check your credentials", "Try logging in again"];
      case 403:
        return [
          "You may not have permission for this action",
          "Contact support if needed",
        ];
      case 404:
        return [
          "The requested resource was not found",
          "Check the URL and try again",
        ];
      case 429:
        return ["Too many requests", "Please wait a moment and try again"];
      case 500:
        return ["Server error occurred", "Please try again later"];
      default:
        return ["Please try again or contact support if the problem persists"];
    }
  }

  /**
   * Log detailed error information for debugging
   */
  static logError(error: DetailedAuthError, context: string): void {
    if (process.env.NODE_ENV === "development") {
      console.group(`🚨 Auth Error - ${context}`);
      console.error("Error Code:", error.code);
      console.error("Message:", error.message);
      console.error("Status Code:", error.statusCode);
      console.error("Timestamp:", error.timestamp);

      if (error.details) {
        console.error("Details:", error.details);
      }

      if (error.originalError) {
        console.error("Original Error:", error.originalError);
      }

      console.groupEnd();
    }
  }

  /**
   * Categorize error type for different handling
   */
  static categorizeError(
    error: DetailedAuthError
  ): "validation" | "authentication" | "network" | "server" | "unknown" {
    if (error.code === "NETWORK_ERROR") return "network";
    if (error.code === "VALIDATION_ERROR" || error.details?.validation?.length)
      return "validation";
    if (
      ["INVALID_CREDENTIALS", "ACCOUNT_DEACTIVATED", "TOKEN_EXPIRED"].includes(
        error.code
      )
    )
      return "authentication";
    if (error.statusCode >= 500) return "server";
    return "unknown";
  }

  /**
   * Check if error should trigger specific UI behavior
   */
  static shouldHighlightField(error: DetailedAuthError): string | null {
    return error.details?.field || null;
  }

  /**
   * Get user-friendly title for error toast
   */
  static getErrorTitle(error: DetailedAuthError): string {
    const category = this.categorizeError(error);

    switch (category) {
      case "validation":
        return "Validation Error";
      case "authentication":
        return "Authentication Failed";
      case "network":
        return "Connection Error";
      case "server":
        return "Server Error";
      default:
        return "Error";
    }
  }
}
