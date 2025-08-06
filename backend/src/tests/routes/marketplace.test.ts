import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../../server";
import { createTestPrismaClient, createTestListing } from "../setup";
import {
  cleanDatabase,
  createTestUserWithProfile,
  generateJWT,
  createAuthHeaders,
  expectApiSuccess,
  expectApiError,
} from "../helpers";

describe("Marketplace Routes", () => {
  let prisma: PrismaClient;
  let farmer: any;
  let buyer: any;
  let farmerToken: string;
  let buyerToken: string;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);

    // Create test users
    farmer = await createTestUserWithProfile(prisma, {
      email: "farmer@example.com",
      role: "FARMER",
      profile: {
        location: "Kiambu County",
        farmSize: 5.0,
      },
    });

    buyer = await createTestUserWithProfile(prisma, {
      email: "buyer@example.com",
      role: "BUYER",
    });

    farmerToken = generateJWT(farmer.id, "FARMER");
    buyerToken = generateJWT(buyer.id, "BUYER");

    // Create test categories and locations
    await prisma.category.create({
      data: { name: "Vegetables", description: "Fresh vegetables" },
    });

    await prisma.location.create({
      data: { county: "Kiambu County", region: "Central Kenya" },
    });
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await prisma.$disconnect();
  });

  describe("Farmer Listing Management", () => {
    describe("POST /api/farmer/listings", () => {
      const validListingData = {
        cropType: "Tomatoes",
        quantity: 100,
        unit: "kg",
        pricePerUnit: 50,
        harvestDate: "2025-03-01",
        location: "Kiambu County",
        description: "Fresh organic tomatoes",
      };

      it("should create listing successfully for farmer", async () => {
        const response = await request(app)
          .post("/api/farmer/listings")
          .set(createAuthHeaders(farmerToken))
          .send(validListingData);

        expectApiSuccess(response, 201);
        expect(response.body.data.cropType).toBe(validListingData.cropType);
        expect(response.body.data.farmerId).toBe(farmer.id);
        expect(response.body.data.isActive).toBe(true);

        // Verify in database
        const listing = await prisma.produceListing.findFirst({
          where: { farmerId: farmer.id },
        });
        expect(listing).toBeTruthy();
      });

      it("should reject listing creation for buyer", async () => {
        const response = await request(app)
          .post("/api/farmer/listings")
          .set(createAuthHeaders(buyerToken))
          .send(validListingData);

        expectApiError(response, 403);
      });

      it("should reject listing with invalid data", async () => {
        const response = await request(app)
          .post("/api/farmer/listings")
          .set(createAuthHeaders(farmerToken))
          .send({ cropType: "Tomatoes" }); // Missing required fields

        expectApiError(response, 400);
      });

      it("should reject listing with negative quantity", async () => {
        const response = await request(app)
          .post("/api/farmer/listings")
          .set(createAuthHeaders(farmerToken))
          .send({ ...validListingData, quantity: -10 });

        expectApiError(response, 400);
      });
    });

    describe("GET /api/farmer/listings", () => {
      beforeEach(async () => {
        // Create test listings
        await prisma.produceListing.createMany({
          data: [
            createTestListing(farmer.id, { cropType: "Tomatoes" }),
            createTestListing(farmer.id, {
              cropType: "Carrots",
              isActive: false,
            }),
          ],
        });

        // Create listing for another farmer
        const otherFarmer = await createTestUserWithProfile(prisma, {
          email: "other@example.com",
          role: "FARMER",
        });
        await prisma.produceListing.create({
          data: createTestListing(otherFarmer.id, { cropType: "Onions" }),
        });
      });

      it("should get farmer own listings only", async () => {
        const response = await request(app)
          .get("/api/farmer/listings")
          .set(createAuthHeaders(farmerToken));

        expectApiSuccess(response);
        expect(response.body.data).toHaveLength(2);
        expect(
          response.body.data.every(
            (listing: any) => listing.farmerId === farmer.id
          )
        ).toBe(true);
      });

      it("should reject request from buyer", async () => {
        const response = await request(app)
          .get("/api/farmer/listings")
          .set(createAuthHeaders(buyerToken));

        expectApiError(response, 403);
      });
    });

    describe("PUT /api/farmer/listings/:id", () => {
      let testListing: any;

      beforeEach(async () => {
        testListing = await prisma.produceListing.create({
          data: createTestListing(farmer.id),
        });
      });

      it("should update own listing successfully", async () => {
        const updateData = {
          quantity: 200,
          pricePerUnit: 60,
          description: "Updated description",
        };

        const response = await request(app)
          .put(`/api/farmer/listings/${testListing.id}`)
          .set(createAuthHeaders(farmerToken))
          .send(updateData);

        expectApiSuccess(response);
        expect(response.body.data.quantity).toBe(updateData.quantity);
        expect(response.body.data.pricePerUnit).toBe(updateData.pricePerUnit);
      });

      it("should reject update of non-existent listing", async () => {
        const response = await request(app)
          .put("/api/farmer/listings/non-existent-id")
          .set(createAuthHeaders(farmerToken))
          .send({ quantity: 200 });

        expectApiError(response, 404);
      });

      it("should reject update of another farmer listing", async () => {
        const otherFarmer = await createTestUserWithProfile(prisma, {
          email: "other@example.com",
          role: "FARMER",
        });
        const otherToken = generateJWT(otherFarmer.id, "FARMER");

        const response = await request(app)
          .put(`/api/farmer/listings/${testListing.id}`)
          .set(createAuthHeaders(otherToken))
          .send({ quantity: 200 });

        expectApiError(response, 403);
      });
    });

    describe("DELETE /api/farmer/listings/:id", () => {
      let testListing: any;

      beforeEach(async () => {
        testListing = await prisma.produceListing.create({
          data: createTestListing(farmer.id),
        });
      });

      it("should soft delete own listing successfully", async () => {
        const response = await request(app)
          .delete(`/api/farmer/listings/${testListing.id}`)
          .set(createAuthHeaders(farmerToken));

        expectApiSuccess(response);

        // Verify soft delete (isActive = false)
        const listing = await prisma.produceListing.findUnique({
          where: { id: testListing.id },
        });
        expect(listing?.isActive).toBe(false);
      });

      it("should reject delete of another farmer listing", async () => {
        const otherFarmer = await createTestUserWithProfile(prisma, {
          email: "other@example.com",
          role: "FARMER",
        });
        const otherToken = generateJWT(otherFarmer.id, "FARMER");

        const response = await request(app)
          .delete(`/api/farmer/listings/${testListing.id}`)
          .set(createAuthHeaders(otherToken));

        expectApiError(response, 403);
      });
    });
  });

  describe("Buyer Marketplace Access", () => {
    beforeEach(async () => {
      // Create test listings
      await prisma.produceListing.createMany({
        data: [
          createTestListing(farmer.id, {
            cropType: "Tomatoes",
            location: "Kiambu County",
            pricePerUnit: 50,
          }),
          createTestListing(farmer.id, {
            cropType: "Carrots",
            location: "Nakuru County",
            pricePerUnit: 40,
          }),
          createTestListing(farmer.id, {
            cropType: "Onions",
            isActive: false,
          }),
        ],
      });
    });

    describe("GET /api/buyer/listings", () => {
      it("should get active listings for buyers", async () => {
        const response = await request(app)
          .get("/api/buyer/listings")
          .set(createAuthHeaders(buyerToken));

        expectApiSuccess(response);
        expect(response.body.data.listings).toHaveLength(2);
        expect(
          response.body.data.listings.every((listing: any) => listing.isActive)
        ).toBe(true);
        expect(response.body.data.total).toBe(2);
        expect(response.body.data.page).toBe(1);
      });

      it("should filter listings by location", async () => {
        const response = await request(app)
          .get("/api/buyer/listings?location=Kiambu County")
          .set(createAuthHeaders(buyerToken));

        expectApiSuccess(response);
        expect(response.body.data.listings).toHaveLength(1);
        expect(response.body.data.listings[0].location).toBe("Kiambu County");
      });

      it("should filter listings by crop type", async () => {
        const response = await request(app)
          .get("/api/buyer/listings?crop=Tomatoes")
          .set(createAuthHeaders(buyerToken));

        expectApiSuccess(response);
        expect(response.body.data.listings).toHaveLength(1);
        expect(response.body.data.listings[0].cropType).toBe("Tomatoes");
      });

      it("should paginate listings", async () => {
        const response = await request(app)
          .get("/api/buyer/listings?page=1&limit=1")
          .set(createAuthHeaders(buyerToken));

        expectApiSuccess(response);
        expect(response.body.data.listings).toHaveLength(1);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.totalPages).toBe(2);
      });

      it("should allow public access to limited listings", async () => {
        const response = await request(app).get("/api/public/listings?limit=5");

        expectApiSuccess(response);
        expect(response.body.data).toHaveLength(2);
      });
    });

    describe("GET /api/buyer/listings/search", () => {
      it("should search listings by query", async () => {
        const response = await request(app)
          .get("/api/buyer/listings/search?query=tomato")
          .set(createAuthHeaders(buyerToken));

        expectApiSuccess(response);
        expect(response.body.data.listings).toHaveLength(1);
        expect(response.body.data.listings[0].cropType.toLowerCase()).toContain(
          "tomato"
        );
      });

      it("should search with price range", async () => {
        const response = await request(app)
          .get("/api/buyer/listings/search?minPrice=45&maxPrice=55")
          .set(createAuthHeaders(buyerToken));

        expectApiSuccess(response);
        expect(response.body.data.listings).toHaveLength(1);
        expect(response.body.data.listings[0].pricePerUnit).toBe(50);
      });
    });
  });

  describe("User Interactions", () => {
    let testListing: any;

    beforeEach(async () => {
      testListing = await prisma.produceListing.create({
        data: createTestListing(farmer.id),
      });
    });

    describe("POST /api/buyer/interactions", () => {
      it("should log buyer interaction successfully", async () => {
        const interactionData = {
          listingId: testListing.id,
          type: "VIEW",
          metadata: { source: "search" },
        };

        const response = await request(app)
          .post("/api/buyer/interactions")
          .set(createAuthHeaders(buyerToken))
          .send(interactionData);

        expectApiSuccess(response, 201);

        // Verify interaction was logged
        const interaction = await prisma.interaction.findFirst({
          where: {
            buyerId: buyer.id,
            listingId: testListing.id,
          },
        });
        expect(interaction).toBeTruthy();
        expect(interaction?.type).toBe("VIEW");
      });

      it("should reject interaction from farmer", async () => {
        const response = await request(app)
          .post("/api/buyer/interactions")
          .set(createAuthHeaders(farmerToken))
          .send({
            listingId: testListing.id,
            type: "VIEW",
          });

        expectApiError(response, 403);
      });
    });
  });
});
