import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic CORS - allow all origins
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString(),
  });
});

// Import routes
import authRoutes from "./routes/auth";
import publicRoutes from "./routes/public";
import buyerRoutes from "./routes/buyer";
import farmerRoutes from "./routes/farmer";

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/buyer", buyerRoutes);
app.use("/api/farmer", farmerRoutes);

app.get("/api", (req, res) => {
  res.json({
    success: true,
    data: {
      message: "MyShopKE API is running",
      version: "1.0.0",
      endpoints: {
        auth: "/api/auth",
        public: "/api/public",
        buyer: "/api/buyer",
        farmer: "/api/farmer",
        health: "/health",
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.originalUrl} not found`,
    },
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);

    res.status(err.status || 500).json({
      success: false,
      error: {
        code: err.code || "INTERNAL_SERVER_ERROR",
        message: err.message || "Something went wrong",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      },
      timestamp: new Date().toISOString(),
    });
  }
);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MyShopKE Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;
