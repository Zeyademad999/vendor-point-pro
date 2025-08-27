const knex = require("knex");
const config = require("./config");

const db = knex(config.database);

// Test database connection
const testConnection = async() => {
    try {
        await db.raw("SELECT 1");
        console.log("✅ Database connection successful");
    } catch (error) {
        console.error("❌ Database connection failed:", error);
        process.exit(1);
    }
};

module.exports = {
    db,
    testConnection,
};