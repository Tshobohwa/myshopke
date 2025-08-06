import { Router } from "express";
import { AuthController } from "../controllers/auth";

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user (farmer or buyer)
 * @access Public
 */
router.post("/register", AuthController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user with plain text password comparison
 * @access Public
 */
router.post("/login", AuthController.login);

/**
 * @route GET /api/auth/profile
 * @desc Get user profile by ID
 * @access Public
 */
router.get("/profile", AuthController.getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Update user profile
 * @access Public
 */
router.put("/profile", AuthController.updateProfile);

/**
 * @route PUT /api/auth/change-password
 * @desc Change user password
 * @access Public
 */
router.put("/change-password", AuthController.changePassword);

export default router;
