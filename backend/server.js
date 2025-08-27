require("dotenv").config();
const { app, initializeApp } = require("./src/app");
const config = require("./src/config/config");

const PORT = config.port;

const startServer = async() => {
    try {
        // Initialize database connection
        await initializeApp();

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 FlokiPOS API Server running on port ${PORT}`);
            console.log(`📊 Environment: ${config.nodeEnv}`);
            console.log(`🔗 Health check: http://localhost:${PORT}/health`);
            console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
    console.error("❌ Uncaught Exception:", error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM received, shutting down gracefully");
    process.exit(0);
});

process.on("SIGINT", () => {
    console.log("🛑 SIGINT received, shutting down gracefully");
    process.exit(0);
});

// Start the server
startServer();