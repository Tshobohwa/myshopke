"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("🌱 Starting database seeding...");
    if (process.env.NODE_ENV === "development") {
        console.log("🧹 Clearing existing data...");
        await prisma.auditLog.deleteMany();
        await prisma.session.deleteMany();
        await prisma.userPreference.deleteMany();
        await prisma.interaction.deleteMany();
        await prisma.produceListing.deleteMany();
        await prisma.category.deleteMany();
        await prisma.location.deleteMany();
        await prisma.userProfile.deleteMany();
        await prisma.user.deleteMany();
    }
    console.log("📦 Seeding categories...");
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                name: "Cereals",
                description: "Maize, wheat, rice, barley, and other grain crops",
            },
        }),
        prisma.category.create({
            data: {
                name: "Vegetables",
                description: "Tomatoes, onions, cabbages, kales, and other vegetables",
            },
        }),
        prisma.category.create({
            data: {
                name: "Fruits",
                description: "Bananas, oranges, mangoes, avocados, and other fruits",
            },
        }),
        prisma.category.create({
            data: {
                name: "Legumes",
                description: "Beans, peas, lentils, and other leguminous crops",
            },
        }),
        prisma.category.create({
            data: {
                name: "Root Tubers",
                description: "Potatoes, sweet potatoes, cassava, and other root crops",
            },
        }),
    ]);
    console.log("🗺️ Seeding locations...");
    const locations = await Promise.all([
        prisma.location.create({
            data: { county: "Nairobi", region: "Central Kenya" },
        }),
        prisma.location.create({
            data: { county: "Kiambu", region: "Central Kenya" },
        }),
        prisma.location.create({
            data: { county: "Murang'a", region: "Central Kenya" },
        }),
        prisma.location.create({
            data: { county: "Nyeri", region: "Central Kenya" },
        }),
        prisma.location.create({
            data: { county: "Kirinyaga", region: "Central Kenya" },
        }),
        prisma.location.create({
            data: { county: "Nakuru", region: "Rift Valley" },
        }),
        prisma.location.create({
            data: { county: "Uasin Gishu", region: "Rift Valley" },
        }),
        prisma.location.create({
            data: { county: "Meru", region: "Eastern Kenya" },
        }),
        prisma.location.create({
            data: { county: "Embu", region: "Eastern Kenya" },
        }),
        prisma.location.create({
            data: { county: "Machakos", region: "Eastern Kenya" },
        }),
        prisma.location.create({
            data: { county: "Kisumu", region: "Western Kenya" },
        }),
        prisma.location.create({
            data: { county: "Kakamega", region: "Western Kenya" },
        }),
    ]);
    const hashedPassword = await bcryptjs_1.default.hash("password123", 12);
    console.log("👥 Seeding users...");
    const farmer1 = await prisma.user.create({
        data: {
            email: "john.farmer@example.com",
            password: hashedPassword,
            role: client_1.UserRole.FARMER,
            fullName: "John Mwangi",
            phoneNumber: "+254712345678",
            profile: {
                create: {
                    location: "Kiambu",
                    farmSize: 5.5,
                },
            },
        },
        include: { profile: true },
    });
    const farmer2 = await prisma.user.create({
        data: {
            email: "mary.farmer@example.com",
            password: hashedPassword,
            role: client_1.UserRole.FARMER,
            fullName: "Mary Wanjiku",
            phoneNumber: "+254723456789",
            profile: {
                create: {
                    location: "Nakuru",
                    farmSize: 12.0,
                },
            },
        },
        include: { profile: true },
    });
    const farmer3 = await prisma.user.create({
        data: {
            email: "peter.farmer@example.com",
            password: hashedPassword,
            role: client_1.UserRole.FARMER,
            fullName: "Peter Kimani",
            phoneNumber: "+254734567890",
            profile: {
                create: {
                    location: "Meru",
                    farmSize: 8.2,
                },
            },
        },
        include: { profile: true },
    });
    const buyer1 = await prisma.user.create({
        data: {
            email: "jane.buyer@example.com",
            password: hashedPassword,
            role: client_1.UserRole.BUYER,
            fullName: "Jane Achieng",
            phoneNumber: "+254745678901",
            profile: {
                create: {
                    location: "Nairobi",
                },
            },
        },
        include: { profile: true },
    });
    const buyer2 = await prisma.user.create({
        data: {
            email: "david.buyer@example.com",
            password: hashedPassword,
            role: client_1.UserRole.BUYER,
            fullName: "David Ochieng",
            phoneNumber: "+254756789012",
            profile: {
                create: {
                    location: "Kisumu",
                },
            },
        },
        include: { profile: true },
    });
    console.log("🌾 Seeding produce listings...");
    const listings = await Promise.all([
        prisma.produceListing.create({
            data: {
                farmerId: farmer1.id,
                cropType: "Maize",
                quantity: 500,
                unit: "kg",
                pricePerUnit: 45,
                harvestDate: new Date("2024-03-15"),
                location: "Kiambu",
                description: "High quality yellow maize, well dried and stored",
                categoryId: categories[0].id,
            },
        }),
        prisma.produceListing.create({
            data: {
                farmerId: farmer1.id,
                cropType: "Tomatoes",
                quantity: 200,
                unit: "kg",
                pricePerUnit: 80,
                harvestDate: new Date("2024-02-20"),
                location: "Kiambu",
                description: "Fresh organic tomatoes, perfect for cooking",
                categoryId: categories[1].id,
            },
        }),
        prisma.produceListing.create({
            data: {
                farmerId: farmer2.id,
                cropType: "Wheat",
                quantity: 1000,
                unit: "kg",
                pricePerUnit: 55,
                harvestDate: new Date("2024-04-10"),
                location: "Nakuru",
                description: "Premium wheat grain, suitable for flour production",
                categoryId: categories[0].id,
            },
        }),
        prisma.produceListing.create({
            data: {
                farmerId: farmer2.id,
                cropType: "Potatoes",
                quantity: 800,
                unit: "kg",
                pricePerUnit: 35,
                harvestDate: new Date("2024-02-28"),
                location: "Nakuru",
                description: "Fresh potatoes, various sizes available",
                categoryId: categories[4].id,
            },
        }),
        prisma.produceListing.create({
            data: {
                farmerId: farmer3.id,
                cropType: "Bananas",
                quantity: 300,
                unit: "bunches",
                pricePerUnit: 150,
                harvestDate: new Date("2024-02-15"),
                location: "Meru",
                description: "Sweet bananas, ready for market",
                categoryId: categories[2].id,
            },
        }),
        prisma.produceListing.create({
            data: {
                farmerId: farmer3.id,
                cropType: "Beans",
                quantity: 400,
                unit: "kg",
                pricePerUnit: 120,
                harvestDate: new Date("2024-03-05"),
                location: "Meru",
                description: "High protein beans, well cleaned and sorted",
                categoryId: categories[3].id,
            },
        }),
    ]);
    console.log("⚙️ Seeding user preferences...");
    await prisma.userPreference.create({
        data: {
            userId: buyer1.id,
            searchFilters: {
                cropType: "Maize",
                location: "Central Kenya",
                maxPrice: 50,
            },
            savedListings: [listings[0].id, listings[2].id],
        },
    });
    await prisma.userPreference.create({
        data: {
            userId: buyer2.id,
            searchFilters: {
                cropType: "Vegetables",
                location: "Rift Valley",
            },
            savedListings: [listings[1].id, listings[3].id],
        },
    });
    console.log("🤝 Seeding interactions...");
    await Promise.all([
        prisma.interaction.create({
            data: {
                buyerId: buyer1.id,
                farmerId: farmer1.id,
                listingId: listings[0].id,
                type: "VIEW",
                metadata: { viewDuration: 45 },
            },
        }),
        prisma.interaction.create({
            data: {
                buyerId: buyer1.id,
                farmerId: farmer1.id,
                listingId: listings[0].id,
                type: "CONTACT",
                metadata: { contactMethod: "phone" },
            },
        }),
        prisma.interaction.create({
            data: {
                buyerId: buyer2.id,
                farmerId: farmer2.id,
                listingId: listings[2].id,
                type: "BOOKMARK",
            },
        }),
        prisma.interaction.create({
            data: {
                buyerId: buyer2.id,
                farmerId: farmer3.id,
                listingId: listings[4].id,
                type: "VIEW",
                metadata: { viewDuration: 30 },
            },
        }),
    ]);
    console.log("✅ Database seeding completed successfully!");
    console.log(`📊 Created:`);
    console.log(`   - ${categories.length} categories`);
    console.log(`   - ${locations.length} locations`);
    console.log(`   - 5 users (3 farmers, 2 buyers)`);
    console.log(`   - ${listings.length} produce listings`);
    console.log(`   - 2 user preferences`);
    console.log(`   - 4 interactions`);
}
main()
    .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map