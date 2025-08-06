/**
 * Simplified authentication utilities
 */
export class AuthUtils {
  /**
   * Basic email validation
   */
  static validateEmail(email: string): boolean {
    return email.includes("@") && email.length > 3;
  }

  /**
   * Generate simple random string
   */
  static generateRandomString(length: number = 8): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
