import { Request, Response } from "express";
import { UserRole } from "../types";
import prisma from "../lib/prisma";

export class AuthController {
  /**
   * User registration - simplified with plain text password storage
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const {
        email,
        password,
        fullName,
        phoneNumber,
        role,
        location,
        farmSize,
      } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.json({
          success: false,
          message: "User with this email already exists",
        });
        return;
      }

      // Create user with profile - store password in plain text
      const user = await prisma.user.create({
        data: {
          email,
          password, // Plain text storage
          fullName,
          phoneNumber,
          role: role as UserRole,
          profile: {
            create: {
              location: location || null,
              farmSize: farmSize || null,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // Return complete user object including password
      res.json({ success: true, user });
    } catch (error) {
      res.json({ success: false, message: "Registration failed" });
    }
  }

  /**
   * User login - simplified with plain text password comparison
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user with direct password comparison
      const user = await prisma.user.findFirst({
        where: {
          email,
          password, // Direct plain text comparison
        },
        include: { profile: true },
      });

      if (user && user.isActive) {
        res.json({ success: true, user });
      } else {
        res.json({ success: false, message: "Invalid credentials" });
      }
    } catch (error) {
      res.json({ success: false, message: "Login failed" });
    }
  }

  /**
   * Get user profile by ID
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.query;

      if (!userId) {
        res.json({ success: false, message: "userId is required" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId as string },
        include: { profile: true },
      });

      if (user) {
        res.json({ success: true, user });
      } else {
        res.json({ success: false, message: "User not found" });
      }
    } catch (error) {
      res.json({ success: false, message: "Failed to get profile" });
    }
  }

  /**
   * Update user profile - no authentication required
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const { userId, fullName, phoneNumber, location, farmSize } = req.body;

      if (!userId) {
        res.json({ success: false, message: "userId is required" });
        return;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName && { fullName }),
          ...(phoneNumber && { phoneNumber }),
          profile: {
            upsert: {
              create: {
                location: location || null,
                farmSize: farmSize || null,
              },
              update: {
                ...(location !== undefined && { location }),
                ...(farmSize !== undefined && { farmSize }),
              },
            },
          },
        },
        include: { profile: true },
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      res.json({ success: false, message: "Profile update failed" });
    }
  }

  /**
   * Change password - no validation or hashing
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId, newPassword } = req.body;

      if (!userId || !newPassword) {
        res.json({
          success: false,
          message: "userId and newPassword are required",
        });
        return;
      }

      // Update password directly without validation
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { password: newPassword }, // Plain text storage
        include: { profile: true },
      });

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      res.json({ success: false, message: "Password change failed" });
    }
  }
}
