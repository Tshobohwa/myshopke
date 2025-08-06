import { Router } from "express";
import { ResponseUtil } from "../utils/response";
import { logger } from "../utils/logger";
import prisma from "../lib/prisma";

const router = Router();

/**
 * GET /api/public/categories
 * Get all active categories
 */
router.get("/categories", async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    logger.info("Public categories retrieved", { count: categories.length });
    ResponseUtil.success(res, categories);
  } catch (error) {
    logger.error("Failed to get categories", error);
    ResponseUtil.internalError(res, "Failed to retrieve categories");
  }
});

/**
 * GET /api/public/locations
 * Get all active locations
 */
router.get("/locations", async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: { county: "asc" },
      select: {
        id: true,
        county: true,
        region: true,
      },
    });

    logger.info("Public locations retrieved", { count: locations.length });
    ResponseUtil.success(res, locations);
  } catch (error) {
    logger.error("Failed to get locations", error);
    ResponseUtil.internalError(res, "Failed to retrieve locations");
  }
});

/**
 * GET /api/public/listings
 * Get limited public listings (for landing page)
 */
router.get("/listings", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const maxLimit = Math.min(limit, 20); // Cap at 20 for public access

    const listings = await prisma.produceListing.findMany({
      where: { isActive: true },
      take: maxLimit,
      orderBy: { createdAt: "desc" },
      include: {
        farmer: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info("Public listings retrieved", {
      count: listings.length,
      limit: maxLimit,
    });
    ResponseUtil.success(res, listings);
  } catch (error) {
    logger.error("Failed to get public listings", error);
    ResponseUtil.internalError(res, "Failed to retrieve listings");
  }
});

export default router;
