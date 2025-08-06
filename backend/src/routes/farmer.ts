import { Router } from "express";
import { ResponseUtil } from "../utils/response";
import { logger } from "../utils/logger";
import prisma from "../lib/prisma";
import { Request } from "express";

const router = Router();

/**
 * GET /api/farmer/listings
 * Get farmer's own listings
 */
router.get("/listings", async (req: Request, res) => {
  try {
    const { farmerId } = req.query;

    if (!farmerId) {
      return ResponseUtil.badRequest(res, "farmerId is required");
    }

    const listings = await prisma.produceListing.findMany({
      where: { farmerId: farmerId as string },
      orderBy: { createdAt: "desc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        interactions: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            buyer: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5, // Latest 5 interactions per listing
        },
      },
    });

    logger.info("Farmer listings retrieved", {
      farmerId: farmerId,
      count: listings.length,
    });

    ResponseUtil.success(res, listings);
  } catch (error) {
    logger.error("Failed to get farmer listings", error);
    ResponseUtil.internalError(res, "Failed to retrieve listings");
  }
});

/**
 * POST /api/farmer/listings
 * Create new produce listing
 */
router.post("/listings", async (req: Request, res) => {
  try {
    const {
      farmerId,
      cropType,
      quantity,
      unit,
      pricePerUnit,
      harvestDate,
      location,
      description,
      categoryId,
    } = req.body;

    // Validate required fields
    if (
      !farmerId ||
      !cropType ||
      !quantity ||
      !unit ||
      !pricePerUnit ||
      !harvestDate ||
      !location
    ) {
      return ResponseUtil.badRequest(res, "Missing required fields");
    }

    // Validate numeric fields
    if (quantity <= 0 || pricePerUnit <= 0) {
      return ResponseUtil.badRequest(
        res,
        "Quantity and price must be positive numbers"
      );
    }

    // Validate harvest date
    const harvestDateTime = new Date(harvestDate);
    if (isNaN(harvestDateTime.getTime())) {
      return ResponseUtil.badRequest(res, "Invalid harvest date");
    }

    // Create listing
    const listing = await prisma.produceListing.create({
      data: {
        farmerId: farmerId,
        cropType,
        quantity: parseFloat(quantity),
        unit,
        pricePerUnit: parseFloat(pricePerUnit),
        harvestDate: harvestDateTime,
        location,
        description,
        categoryId,
        isActive: true,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info("Farmer listing created", {
      farmerId: farmerId,
      listingId: listing.id,
      cropType,
    });

    ResponseUtil.success(res, listing, 201);
  } catch (error) {
    logger.error("Failed to create listing", error);
    ResponseUtil.internalError(res, "Failed to create listing");
  }
});

/**
 * PUT /api/farmer/listings/:id
 * Update farmer's listing
 */
router.put("/listings/:id", async (req: Request, res) => {
  try {
    const { id } = req.params;
    const {
      farmerId,
      cropType,
      quantity,
      unit,
      pricePerUnit,
      harvestDate,
      location,
      description,
      categoryId,
      isActive,
    } = req.body;

    if (!farmerId) {
      return ResponseUtil.badRequest(res, "farmerId is required");
    }

    // Check if listing exists and belongs to farmer
    const existingListing = await prisma.produceListing.findFirst({
      where: {
        id,
        farmerId: farmerId,
      },
    });

    if (!existingListing) {
      return ResponseUtil.notFound(res, "Listing not found or access denied");
    }

    // Prepare update data
    const updateData: any = {};
    if (cropType !== undefined) updateData.cropType = cropType;
    if (quantity !== undefined) {
      if (quantity <= 0) {
        return ResponseUtil.badRequest(res, "Quantity must be positive");
      }
      updateData.quantity = parseFloat(quantity);
    }
    if (unit !== undefined) updateData.unit = unit;
    if (pricePerUnit !== undefined) {
      if (pricePerUnit <= 0) {
        return ResponseUtil.badRequest(res, "Price must be positive");
      }
      updateData.pricePerUnit = parseFloat(pricePerUnit);
    }
    if (harvestDate !== undefined) {
      const harvestDateTime = new Date(harvestDate);
      if (isNaN(harvestDateTime.getTime())) {
        return ResponseUtil.badRequest(res, "Invalid harvest date");
      }
      updateData.harvestDate = harvestDateTime;
    }
    if (location !== undefined) updateData.location = location;
    if (description !== undefined) updateData.description = description;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update listing
    const updatedListing = await prisma.produceListing.update({
      where: { id },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info("Farmer listing updated", {
      farmerId: farmerId,
      listingId: id,
      updates: Object.keys(updateData),
    });

    ResponseUtil.success(res, updatedListing);
  } catch (error) {
    logger.error("Failed to update listing", error);
    ResponseUtil.internalError(res, "Failed to update listing");
  }
});

/**
 * DELETE /api/farmer/listings/:id
 * Soft delete farmer's listing
 */
router.delete("/listings/:id", async (req: Request, res) => {
  try {
    const { id } = req.params;
    const { farmerId } = req.body;

    if (!farmerId) {
      return ResponseUtil.badRequest(res, "farmerId is required");
    }

    // Check if listing exists and belongs to farmer
    const existingListing = await prisma.produceListing.findFirst({
      where: {
        id,
        farmerId: farmerId,
      },
    });

    if (!existingListing) {
      return ResponseUtil.notFound(res, "Listing not found or access denied");
    }

    // Soft delete by setting isActive to false
    await prisma.produceListing.update({
      where: { id },
      data: { isActive: false },
    });

    logger.info("Farmer listing deleted", {
      farmerId: farmerId,
      listingId: id,
    });

    ResponseUtil.success(res, { message: "Listing deleted successfully" });
  } catch (error) {
    logger.error("Failed to delete listing", error);
    ResponseUtil.internalError(res, "Failed to delete listing");
  }
});

/**
 * GET /api/farmer/dashboard
 * Get farmer dashboard data
 */
router.get("/dashboard", async (req: Request, res) => {
  try {
    const { farmerId } = req.query;

    if (!farmerId) {
      return ResponseUtil.badRequest(res, "farmerId is required");
    }

    // Get listing stats
    const listingStats = await prisma.produceListing.groupBy({
      by: ["isActive"],
      where: { farmerId: farmerId as string },
      _count: { isActive: true },
    });

    // Get recent interactions on farmer's listings
    const recentInteractions = await prisma.interaction.findMany({
      where: { farmerId: farmerId as string },
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
          },
        },
        buyer: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    // Get interaction stats by type
    const interactionStats = await prisma.interaction.groupBy({
      by: ["type"],
      where: { farmerId: farmerId as string },
      _count: { type: true },
    });

    // Get top performing listings (by interaction count)
    const topListings = await prisma.produceListing.findMany({
      where: {
        farmerId: farmerId as string,
        isActive: true,
      },
      include: {
        _count: {
          select: { interactions: true },
        },
      },
      orderBy: {
        interactions: {
          _count: "desc",
        },
      },
      take: 5,
    });

    const dashboardData = {
      stats: {
        totalListings: listingStats.reduce(
          (acc, stat) => acc + stat._count.isActive,
          0
        ),
        activeListings:
          listingStats.find((stat) => stat.isActive)?._count.isActive || 0,
        inactiveListings:
          listingStats.find((stat) => !stat.isActive)?._count.isActive || 0,
        totalInteractions: recentInteractions.length,
        interactionsByType: interactionStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.type;
          return acc;
        }, {} as Record<string, number>),
      },
      recentInteractions,
      topListings,
    };

    logger.info("Farmer dashboard data retrieved", { farmerId: farmerId });
    ResponseUtil.success(res, dashboardData);
  } catch (error) {
    logger.error("Failed to get farmer dashboard", error);
    ResponseUtil.internalError(res, "Failed to retrieve dashboard data");
  }
});

export default router;
