import { Router } from "express";
import { ResponseUtil } from "../utils/response";
import { logger } from "../utils/logger";
import prisma from "../lib/prisma";
import { Request } from "express";

const router = Router();

/**
 * GET /api/buyer/listings
 * Get all active listings with filtering and pagination
 */
router.get("/listings", async (req: Request, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const skip = (page - 1) * limit;

    // Filter parameters
    const search = req.query.search as string;
    const location = req.query.location as string;
    const crop = req.query.crop as string;
    const status = req.query.status as string;

    // Build where clause
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { cropType: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    if (location && location !== "all-counties") {
      where.location = location;
    }

    if (crop && crop !== "all-crops") {
      where.cropType = crop;
    }

    // Get total count for pagination
    const total = await prisma.produceListing.count({ where });

    // Get listings
    const listings = await prisma.produceListing.findMany({
      where,
      skip,
      take: limit,
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

    const totalPages = Math.ceil(total / limit);

    logger.info("Buyer listings retrieved", {
      count: listings.length,
      page,
      total,
      filters: { search, location, crop, status },
    });

    ResponseUtil.success(res, {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    logger.error("Failed to get buyer listings", error);
    ResponseUtil.internalError(res, "Failed to retrieve listings");
  }
});

/**
 * GET /api/buyer/listings/search
 * Advanced search for listings
 */
router.get("/listings/search", async (req: Request, res) => {
  try {
    const {
      query,
      location,
      cropType,
      minPrice,
      maxPrice,
      harvestDateFrom,
      harvestDateTo,
    } = req.query;

    // Build where clause
    const where: any = { isActive: true };

    if (query) {
      where.OR = [
        { cropType: { contains: query as string, mode: "insensitive" } },
        { description: { contains: query as string, mode: "insensitive" } },
        { location: { contains: query as string, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.location = { contains: location as string, mode: "insensitive" };
    }

    if (cropType) {
      where.cropType = { contains: cropType as string, mode: "insensitive" };
    }

    if (minPrice || maxPrice) {
      where.pricePerUnit = {};
      if (minPrice) where.pricePerUnit.gte = parseFloat(minPrice as string);
      if (maxPrice) where.pricePerUnit.lte = parseFloat(maxPrice as string);
    }

    if (harvestDateFrom || harvestDateTo) {
      where.harvestDate = {};
      if (harvestDateFrom)
        where.harvestDate.gte = new Date(harvestDateFrom as string);
      if (harvestDateTo)
        where.harvestDate.lte = new Date(harvestDateTo as string);
    }

    const listings = await prisma.produceListing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50, // Limit search results
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

    const total = await prisma.produceListing.count({ where });

    logger.info("Buyer search completed", {
      count: listings.length,
      total,
      searchParams: req.query,
    });

    ResponseUtil.success(res, { listings, total });
  } catch (error) {
    logger.error("Failed to search listings", error);
    ResponseUtil.internalError(res, "Failed to search listings");
  }
});

/**
 * GET /api/buyer/preferences
 * Get buyer preferences
 */
router.get("/preferences", async (req: Request, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return ResponseUtil.badRequest(res, "userId is required");
    }

    const preferences = await prisma.userPreference.findUnique({
      where: { userId: userId as string },
    });

    logger.info("Buyer preferences retrieved", { userId: userId });
    ResponseUtil.success(res, preferences || {});
  } catch (error) {
    logger.error("Failed to get preferences", error);
    ResponseUtil.internalError(res, "Failed to retrieve preferences");
  }
});

/**
 * POST /api/buyer/preferences
 * Save buyer preferences
 */
router.post("/preferences", async (req: Request, res) => {
  try {
    const { userId, searchFilters, savedListings } = req.body;

    if (!userId) {
      return ResponseUtil.badRequest(res, "userId is required");
    }

    const preferences = await prisma.userPreference.upsert({
      where: { userId: userId },
      update: {
        searchFilters,
        savedListings,
        updatedAt: new Date(),
      },
      create: {
        userId: userId,
        searchFilters,
        savedListings,
      },
    });

    logger.info("Buyer preferences saved", { userId: userId });
    ResponseUtil.success(res, preferences);
  } catch (error) {
    logger.error("Failed to save preferences", error);
    ResponseUtil.internalError(res, "Failed to save preferences");
  }
});

/**
 * POST /api/buyer/interactions
 * Log buyer-farmer interactions
 */
router.post("/interactions", async (req: Request, res) => {
  try {
    const { buyerId, listingId, type, metadata } = req.body;

    if (!buyerId) {
      return ResponseUtil.badRequest(res, "buyerId is required");
    }

    // Validate listing exists and get farmer ID
    const listing = await prisma.produceListing.findUnique({
      where: { id: listingId },
      select: { farmerId: true, isActive: true },
    });

    if (!listing) {
      return ResponseUtil.notFound(res, "Listing not found");
    }

    if (!listing.isActive) {
      return ResponseUtil.badRequest(res, "Listing is no longer active");
    }

    // Create interaction
    const interaction = await prisma.interaction.create({
      data: {
        buyerId: buyerId,
        farmerId: listing.farmerId,
        listingId,
        type,
        metadata,
      },
    });

    logger.info("Buyer interaction logged", {
      buyerId: buyerId,
      listingId,
      type,
      interactionId: interaction.id,
    });

    ResponseUtil.success(res, interaction, 201);
  } catch (error) {
    logger.error("Failed to log interaction", error);
    ResponseUtil.internalError(res, "Failed to log interaction");
  }
});

/**
 * GET /api/buyer/dashboard
 * Get buyer dashboard data
 */
router.get("/dashboard", async (req: Request, res) => {
  try {
    const { buyerId } = req.query;

    if (!buyerId) {
      return ResponseUtil.badRequest(res, "buyerId is required");
    }

    // Get recent interactions
    const recentInteractions = await prisma.interaction.findMany({
      where: { buyerId: buyerId as string },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        listing: {
          select: {
            id: true,
            cropType: true,
            quantity: true,
            unit: true,
            pricePerUnit: true,
            location: true,
          },
        },
        farmer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Get saved preferences
    const preferences = await prisma.userPreference.findUnique({
      where: { userId: buyerId as string },
    });

    // Get interaction stats
    const interactionStats = await prisma.interaction.groupBy({
      by: ["type"],
      where: { buyerId: buyerId as string },
      _count: { type: true },
    });

    const dashboardData = {
      recentInteractions,
      preferences,
      stats: {
        totalInteractions: recentInteractions.length,
        interactionsByType: interactionStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.type;
          return acc;
        }, {} as Record<string, number>),
      },
    };

    logger.info("Buyer dashboard data retrieved", { buyerId: buyerId });
    ResponseUtil.success(res, dashboardData);
  } catch (error) {
    logger.error("Failed to get buyer dashboard", error);
    ResponseUtil.internalError(res, "Failed to retrieve dashboard data");
  }
});

export default router;
