const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const { db } = require("../config/database");

// Register new client and create account
const registerClient = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const {
            businessName,
            ownerName,
            email,
            phone,
            password,
            businessType,
            subdomain,
            plan,
        } = req.body;

        // Check if email already exists
        const existingUser = await db("users").where("email", email).first();

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Check if subdomain is available
        const existingSubdomain = await db("users")
            .where("subdomain", subdomain)
            .first();

        if (existingSubdomain) {
            return res.status(400).json({
                success: false,
                message: "Subdomain already taken",
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user account
        const [userId] = await db("users").insert({
            email,
            password: hashedPassword,
            name: ownerName,
            phone,
            role: "client",
            status: "active",
            subdomain,
            subscription_plan: plan,
            subscription_status: "active",
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
            settings: JSON.stringify({
                businessName,
                businessType,
                plan,
                website: {
                    theme: "default",
                    colors: {
                        primary: "#3b82f6",
                        secondary: "#64748b",
                    },
                    logo: null,
                    hero: {
                        title: `Welcome to ${businessName}`,
                        subtitle: "Professional services at your fingertips",
                    },
                },
            }),
        });

        // Create default categories for the client
        const defaultCategories = [
            { name: "General", type: "product" },
            { name: "Services", type: "service" },
        ];

        for (const category of defaultCategories) {
            await db("categories").insert({
                client_id: userId,
                name: category.name,
                type: category.type,
                description: `Default ${category.type} category`,
            });
        }

        // Create default staff member (the owner)
        await db("staff").insert({
            client_id: userId,
            name: ownerName,
            email,
            phone,
            active: true,
            notes: "Business owner",
        });

        // Get the created user with settings
        const newUser = await db("users").where("id", userId).first();

        res.status(201).json({
            success: true,
            message: "Client registered successfully",
            data: {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    role: newUser.role,
                    status: newUser.status,
                    subdomain: newUser.subdomain,
                    subscription_plan: newUser.subscription_plan,
                    trial_ends_at: newUser.trial_ends_at,
                },
                website: `${subdomain}.flokipos.com`,
            },
        });
    } catch (error) {
        console.error("Error registering client:", error);
        res.status(500).json({
            success: false,
            message: "Failed to register client",
            error: error.message,
        });
    }
};

// Get client website configuration
const getWebsiteConfig = async(req, res) => {
    try {
        const { subdomain } = req.params;

        const client = await db("users")
            .where("subdomain", subdomain)
            .where("role", "client")
            .where("status", "active")
            .first();

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Website not found",
            });
        }

        const settings = JSON.parse(client.settings || "{}");
        const websiteConfig = settings.website || {};

        // Get client's services and products
        const services = await db("services")
            .where("client_id", client.id)
            .where("active", true)
            .select("id", "name", "description", "price", "duration", "images");

        const products = await db("products")
            .where("client_id", client.id)
            .where("active", true)
            .select("id", "name", "description", "price", "stock", "images");

        // Parse images for each product
        const productsWithParsedImages = products.map((product) => {
            if (product.images) {
                try {
                    product.images = JSON.parse(product.images);
                } catch (e) {
                    product.images = [];
                }
            } else {
                product.images = [];
            }
            return product;
        });

        const staff = await db("staff")
            .where("client_id", client.id)
            .where("active", true)
            .select("id", "name", "email", "phone", "photo");

        res.json({
            success: true,
            data: {
                id: client.id, // Include client ID for public orders
                business: {
                    name: settings.businessName || client.name,
                    type: settings.businessType,
                    email: client.email,
                    phone: client.phone,
                    subdomain: client.subdomain,
                },
                website: {
                    ...websiteConfig,
                    url: `${subdomain}.flokipos.com`,
                },
                services,
                products: productsWithParsedImages,
                staff,
            },
        });
    } catch (error) {
        console.error("Error fetching website config:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch website configuration",
            error: error.message,
        });
    }
};

// Get client website settings
const getWebsiteSettings = async(req, res) => {
    try {
        // For staff members, use business_id; for business owners, use id
        const clientId = req.user.business_id || req.user.id;

        const client = await db("users")
            .where("id", clientId)
            .where("role", "client")
            .first();

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const settings = JSON.parse(client.settings || "{}");
        const websiteConfig = settings.website || {};

        res.json({
            success: true,
            data: {
                hero: {
                    title:
                        (websiteConfig.hero && websiteConfig.hero.title) ||
                        "Transform Your Look with Professional Salon Services",
                    subtitle:
                        (websiteConfig.hero && websiteConfig.hero.subtitle) ||
                        "Experience luxury hair styling, beauty treatments, and premium salon products. Our expert stylists and beauty professionals are here to enhance your natural beauty and boost your confidence.",
                },
                theme: {
                    primaryColor:
                        (websiteConfig.colors && websiteConfig.colors.primary) || "#1e40af",
                    secondaryColor:
                        (websiteConfig.colors && websiteConfig.colors.secondary) ||
                        "#64748b",
                    backgroundColor:
                        (websiteConfig.colors && websiteConfig.colors.backgroundColor) ||
                        "#ffffff",
                    textColor:
                        (websiteConfig.colors && websiteConfig.colors.textColor) ||
                        "#1f2937",
                    buttonColor:
                        (websiteConfig.colors && websiteConfig.colors.buttonColor) ||
                        "#1e40af",
                    buttonTextColor:
                        (websiteConfig.colors && websiteConfig.colors.buttonTextColor) ||
                        "#ffffff",
                    accentColor:
                        (websiteConfig.colors && websiteConfig.colors.accentColor) ||
                        "#3b82f6",
                    borderColor:
                        (websiteConfig.colors && websiteConfig.colors.borderColor) ||
                        "#e5e7eb",
                },
            },
        });
    } catch (error) {
        console.error("Error fetching website settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch website settings",
            error: error.message,
        });
    }
};

// Update client website settings
const updateWebsiteSettings = async(req, res) => {
    try {
        // For staff members, use business_id; for business owners, use id
        const clientId = req.user.business_id || req.user.id;
        const updateData = req.body;

        const client = await db("users")
            .where("id", clientId)
            .where("role", "client")
            .first();

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const currentSettings = JSON.parse(client.settings || "{}");
        const currentWebsite = currentSettings.website || {};

        // Update hero settings
        if (updateData.hero) {
            currentWebsite.hero = {
                ...currentWebsite.hero,
                ...updateData.hero,
            };
        }

        // Update theme settings
        if (updateData.theme) {
            currentWebsite.colors = {
                ...currentWebsite.colors,
                primary: updateData.theme.primaryColor,
                secondary: updateData.theme.secondaryColor,
                backgroundColor: updateData.theme.backgroundColor,
                textColor: updateData.theme.textColor,
                buttonColor: updateData.theme.buttonColor,
                buttonTextColor: updateData.theme.buttonTextColor,
                accentColor: updateData.theme.accentColor,
                borderColor: updateData.theme.borderColor,
            };
        }

        const updatedSettings = {
            ...currentSettings,
            website: currentWebsite,
        };

        await db("users")
            .where("id", clientId)
            .update({
                settings: JSON.stringify(updatedSettings),
            });

        res.json({
            success: true,
            message: "Website settings updated successfully",
            data: updatedSettings.website,
        });
    } catch (error) {
        console.error("Error updating website settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update website settings",
            error: error.message,
        });
    }
};

// Get client dashboard data
const getClientDashboard = async(req, res) => {
    try {
        // For staff members, use business_id; for business owners, use id
        const clientId = req.user.business_id || req.user.id;

        // Get basic stats
        const stats = await Promise.all([
            // Total customers
            db("customers").where("client_id", clientId).count("id as count").first(),
            // Total products
            db("products").where("client_id", clientId).count("id as count").first(),
            // Total services
            db("services").where("client_id", clientId).count("id as count").first(),
            // Total staff
            db("staff").where("client_id", clientId).count("id as count").first(),
            // Today's sales
            db("receipts")
            .where("client_id", clientId)
            .whereRaw("DATE(created_at) = DATE('now')")
            .sum("total as total")
            .first(),
            // Today's bookings
            db("bookings")
            .where("client_id", clientId)
            .whereRaw("DATE(booking_date) = DATE('now')")
            .count("id as count")
            .first(),
        ]);

        // Get recent transactions
        const recentTransactions = await db("receipts")
            .where("receipts.client_id", clientId)
            .leftJoin("customers", "receipts.customer_id", "customers.id")
            .select("receipts.*", "customers.name as customer_name")
            .orderBy("receipts.created_at", "desc")
            .limit(5);

        // Get recent bookings
        const recentBookings = await db("bookings")
            .where("bookings.client_id", clientId)
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .leftJoin("services", "bookings.service_id", "services.id")
            .select(
                "bookings.*",
                "customers.name as customer_name",
                "services.name as service_name"
            )
            .orderBy("bookings.booking_date", "desc")
            .limit(5);

        res.json({
            success: true,
            data: {
                stats: {
                    customers: stats[0].count,
                    products: stats[1].count,
                    services: stats[2].count,
                    staff: stats[3].count,
                    todaySales: parseFloat(stats[4].total || 0),
                    todayBookings: stats[5].count,
                },
                recentTransactions,
                recentBookings,
            },
        });
    } catch (error) {
        console.error("Error fetching client dashboard:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: error.message,
        });
    }
};

// Get client portals
const getClientPortals = async(req, res) => {
    try {
        // For staff members, use business_id; for business owners, use id
        const clientId = req.user.business_id || req.user.id;

        const client = await db("users").where("id", clientId).first();

        if (!client) {
            return res.status(404).json({
                success: false,
                message: "Client not found",
            });
        }

        const portals = [{
                id: "admin",
                name: "Admin Portal",
                description: "Manage your business settings, users, and system configuration",
                url: `/dashboard?subdomain=${client.subdomain}`,
                icon: "settings",
            },
            {
                id: "staff",
                name: "Staff Portal",
                description: "Staff management and scheduling",
                url: `/staff?subdomain=${client.subdomain}`,
                icon: "users",
            },
            {
                id: "cashier",
                name: "Cashier Portal",
                description: "Point of sale system for processing transactions",
                url: `/cashier?subdomain=${client.subdomain}`,
                icon: "shopping-cart",
            },
            {
                id: "customer",
                name: "Customer Website",
                description: "Your public-facing website for customers",
                url: `/website/${client.subdomain}`,
                icon: "globe",
            },
        ];

        res.json({
            success: true,
            data: {
                client: {
                    name: client.name,
                    subdomain: client.subdomain,
                    subscription_plan: client.subscription_plan,
                    trial_ends_at: client.trial_ends_at,
                },
                portals,
            },
        });
    } catch (error) {
        console.error("Error fetching client portals:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch portals",
            error: error.message,
        });
    }
};

module.exports = {
    registerClient,
    getWebsiteConfig,
    getWebsiteSettings,
    updateWebsiteSettings,
    getClientDashboard,
    getClientPortals,
};