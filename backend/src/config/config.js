require("dotenv").config();

module.exports = {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || "development",

    // Database
    database: {
        client: "sqlite3",
        connection: {
            filename: process.env.DATABASE_URL || "./data/database.sqlite",
        },
        useNullAsDefault: true,
        migrations: {
            directory: "./src/models/migrations",
        },
        seeds: {
            directory: "./src/models/seeds",
        },
    },

    // JWT
    jwt: {
        secret: process.env.JWT_SECRET ||
            "your-super-secret-jwt-key-change-in-production",
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    },

    // File Upload
    upload: {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
        uploadDir: "./uploads",
    },

    // Email
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === "true",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    },

    // Payment (Kashier.io)
    payment: {
        apiKey: process.env.KASHIER_API_KEY,
        apiSecret: process.env.KASHIER_API_SECRET,
        merchantId: process.env.KASHIER_MERCHANT_ID,
        webhookSecret: process.env.KASHIER_WEBHOOK_SECRET,
    },

    // CORS
    cors: {
        origin: process.env.CORS_ORIGIN || [
            "http://localhost:5173",
            "http://localhost:8080",
        ],
        credentials: true,
    },

    // Rate Limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || "info",
        file: process.env.LOG_FILE || "./logs/app.log",
    },
};