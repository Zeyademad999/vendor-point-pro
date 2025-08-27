#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const knex = require("knex");
const config = require("../src/config/config");

async function setupDatabase() {
    console.log("🚀 Setting up FlokiPOS Backend...\n");

    try {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, "../data");
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log("✅ Created data directory");
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(__dirname, "../uploads");
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log("✅ Created uploads directory");
        }

        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, "../logs");
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
            console.log("✅ Created logs directory");
        }

        // Initialize database connection
        const db = knex(config.database);

        // Test database connection
        await db.raw("SELECT 1");
        console.log("✅ Database connection successful");

        // Run migrations
        console.log("\n📦 Running database migrations...");
        await db.migrate.latest();
        console.log("✅ Database migrations completed");

        // Create default admin user if it doesn't exist
        const adminExists = await db("users")
            .where({ email: "admin@flokipos.com" })
            .first();
        if (!adminExists) {
            const bcrypt = require("bcryptjs");
            const hashedPassword = await bcrypt.hash("admin123", 12);

            await db("users").insert({
                name: "Super Admin",
                email: "admin@flokipos.com",
                password: hashedPassword,
                role: "admin",
                status: "active",
                settings: JSON.stringify({
                    businessType: "admin",
                    currency: "EGP",
                    timezone: "Africa/Cairo",
                    language: "en",
                }),
            });
            console.log(
                "✅ Created default admin user (admin@flokipos.com / admin123)"
            );
        }

        // Create demo client user if it doesn't exist
        const clientExists = await db("users")
            .where({ email: "client@demo.com" })
            .first();
        if (!clientExists) {
            const bcrypt = require("bcryptjs");
            const hashedPassword = await bcrypt.hash("client123", 12);

            await db("users").insert({
                name: "Demo Client",
                email: "client@demo.com",
                password: hashedPassword,
                role: "client",
                status: "active",
                subdomain: "demo",
                settings: JSON.stringify({
                    businessType: "retail",
                    currency: "EGP",
                    timezone: "Africa/Cairo",
                    language: "en",
                }),
            });
                    console.log("✅ Created demo client user (client@demo.com / client123)");
    }

    // Create demo staff members for the demo client
    const demoClient = await db("users")
        .where({ email: "client@demo.com" })
        .first();
    
    if (demoClient) {
        const bcrypt = require("bcryptjs");
        
        // Check if demo staff already exist
        const staffExists = await db("staff")
            .where({ client_id: demoClient.id, username: "staff1" })
            .first();
        
        if (!staffExists) {
            const hashedPassword = await bcrypt.hash("staff123", 12);
            
            // Create demo staff members
            const demoStaff = [
                {
                    client_id: demoClient.id,
                    name: "Demo Staff Member",
                    email: "staff@demo.com",
                    phone: "+1234567890",
                    salary: 2500,
                    working_hours: "Mon-Fri 9AM-6PM",
                    username: "staff1",
                    portal_access: "staff",
                    can_login: true,
                    password: hashedPassword,
                    active: true,
                    hire_date: new Date().toISOString().split("T")[0],
                    notes: "Demo staff member for testing"
                },
                {
                    client_id: demoClient.id,
                    name: "Demo Cashier",
                    email: "cashier@demo.com",
                    phone: "+1234567891",
                    salary: 2200,
                    working_hours: "Mon-Sat 10AM-8PM",
                    username: "cashier1",
                    portal_access: "cashier",
                    can_login: true,
                    password: hashedPassword,
                    active: true,
                    hire_date: new Date().toISOString().split("T")[0],
                    notes: "Demo cashier for testing"
                },
                {
                    client_id: demoClient.id,
                    name: "Demo Admin",
                    email: "admin@demo.com",
                    phone: "+1234567892",
                    salary: 3500,
                    working_hours: "Mon-Fri 8AM-6PM",
                    username: "admin1",
                    portal_access: "admin",
                    can_login: true,
                    password: hashedPassword,
                    active: true,
                    hire_date: new Date().toISOString().split("T")[0],
                    notes: "Demo admin for testing"
                }
            ];
            
            await db("staff").insert(demoStaff);
            console.log("✅ Created demo staff members:");
            console.log("   - Staff: staff1 / staff123");
            console.log("   - Cashier: cashier1 / staff123");
            console.log("   - Admin: admin1 / staff123");
        }
    }

    console.log("\n🎉 Setup completed successfully!");
        console.log("\n📋 Next steps:");
        console.log(
            "1. Copy env.example to .env and configure your environment variables"
        );
        console.log("2. Run: npm run dev (to start the development server)");
        console.log("3. The API will be available at: http://localhost:3001");
        console.log("4. Health check: http://localhost:3001/health");
        console.log("\n🔑 Default credentials:");
        console.log("- Admin: admin@flokipos.com / admin123");
        console.log("- Client: client@demo.com / client123");
    } catch (error) {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase;