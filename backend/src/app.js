const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
const config = require("./config/config");

// Import routes
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const customerRoutes = require("./routes/customers");
const staffRoutes = require("./routes/staff");
const serviceRoutes = require("./routes/services");
const bookingRoutes = require("./routes/bookings");
const categoryRoutes = require("./routes/categories");
const reportRoutes = require("./routes/reports");
const dashboardRoutes = require("./routes/dashboard");
const receiptRoutes = require("./routes/receipts");
const clientRoutes = require("./routes/clients");
const uploadRoutes = require("./routes/upload");
const walletRoutes = require("./routes/wallets");
const costsRoutes = require("./routes/costs");
const revenueRoutes = require("./routes/revenue");

// Import middleware
const { testConnection } = require("./config/database");

const app = express();

// Security middleware
app.use(
    helmet({
        contentSecurityPolicy: false, // Disable CSP for development to avoid image loading issues
        crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing
    })
);

// CORS configuration
app.use(
    cors({
        origin: function(origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);

            const allowedOrigins = [
                "http://localhost:5173",
                "http://localhost:8080",
                "http://localhost:8081",
                "http://localhost:8082",
                // Add your deployed frontend URL here
                process.env.FRONTEND_URL,
                process.env.CORS_ORIGIN,
            ].filter(Boolean); // Remove undefined values

            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log("CORS blocked origin:", origin);
                console.log("Allowed origins:", allowedOrigins);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again later.",
    },
});
app.use("/api/", limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Compression middleware
app.use(compression());

// Logging middleware
if (config.nodeEnv === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}

// Static files with CORS for uploads
app.use(
    "/uploads",
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, X-Requested-With, Content-Type, Accept"
        );
        next();
    },
    express.static(path.join(__dirname, "../uploads"))
);
app.use("/public", express.static(path.join(__dirname, "../public")));

// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        success: true,
        message: "FlokiPOS API is running",
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/costs", costsRoutes);
app.use("/api/revenue", revenueRoutes);

// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error("Global error handler:", error);

    // Default error
    let statusCode = 500;
    let message = "Internal server error";

    // Handle specific error types
    if (error.name === "ValidationError") {
        statusCode = 400;
        message = error.message;
    } else if (error.name === "UnauthorizedError") {
        statusCode = 401;
        message = "Unauthorized";
    } else if (error.name === "ForbiddenError") {
        statusCode = 403;
        message = "Forbidden";
    } else if (error.name === "NotFoundError") {
        statusCode = 404;
        message = "Resource not found";
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.nodeEnv === "development" && { stack: error.stack }),
    });
});

// Initialize database connection
const initializeApp = async() => {
    try {
        await testConnection();
        console.log("✅ Database connection established");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
};

module.exports = { app, initializeApp };