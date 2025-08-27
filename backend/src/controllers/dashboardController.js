const { db } = require("../config/database");

// Get comprehensive dashboard data
const getDashboardData = async(req, res) => {
    try {
        console.log("=== DASHBOARD REQUEST START ===");
        console.log("Dashboard request from user:", req.user);
        console.log("User ID:", req.user.id);
        console.log("User role:", req.user.role);

        // For staff members, use business_id; for business owners, use id
        const clientId = req.user.business_id || req.user.id;
        console.log("Client ID:", clientId);
        console.log("Business ID:", req.user.business_id);
        console.log("User ID:", req.user.id);

        // Simple test query first
        console.log("Testing basic query...");
        let testResult;
        try {
            testResult = await db("receipts")
                .where("client_id", clientId)
                .count("* as count")
                .first();
            console.log("Test result:", testResult);
        } catch (error) {
            console.error("Error in test query:", error);
            return res.status(500).json({
                success: false,
                message: "Database connection error: " + error.message,
            });
        }

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get yesterday's date range for comparison
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

        // Get today's sales
        console.log("Fetching today's sales...");
        let todaySalesResult;
        try {
            todaySalesResult = await db("receipts")
                .where("client_id", clientId)
                .whereBetween("created_at", [today, tomorrow])
                .sum("total_amount as totalSales")
                .first();
            console.log("Today's sales result:", todaySalesResult);
        } catch (error) {
            console.error("Error fetching today's sales:", error);
            todaySalesResult = { totalSales: 0 };
        }

        // Get today's orders
        console.log("Fetching today's orders...");
        let todayOrdersResult;
        try {
            todayOrdersResult = await db("receipts")
                .where("client_id", clientId)
                .whereBetween("created_at", [today, tomorrow])
                .count("* as totalOrders")
                .first();
            console.log("Today's orders result:", todayOrdersResult);
        } catch (error) {
            console.error("Error fetching today's orders:", error);
            todayOrdersResult = { totalOrders: 0 };
        }

        // Get yesterday's sales for comparison
        console.log("Fetching yesterday's sales...");
        let yesterdaySalesResult;
        try {
            yesterdaySalesResult = await db("receipts")
                .where("client_id", clientId)
                .whereBetween("created_at", [yesterday, yesterdayEnd])
                .sum("total_amount as totalSales")
                .first();
            console.log("Yesterday's sales result:", yesterdaySalesResult);
        } catch (error) {
            console.error("Error fetching yesterday's sales:", error);
            yesterdaySalesResult = { totalSales: 0 };
        }

        // Get yesterday's orders for comparison
        console.log("Fetching yesterday's orders...");
        let yesterdayOrdersResult;
        try {
            yesterdayOrdersResult = await db("receipts")
                .where("client_id", clientId)
                .whereBetween("created_at", [yesterday, yesterdayEnd])
                .count("* as totalOrders")
                .first();
            console.log("Yesterday's orders result:", yesterdayOrdersResult);
        } catch (error) {
            console.error("Error fetching yesterday's orders:", error);
            yesterdayOrdersResult = { totalOrders: 0 };
        }

        // Get total customers
        console.log("Fetching customers...");
        let totalCustomersResult;
        try {
            totalCustomersResult = await db("customers")
                .where("client_id", clientId)
                .count("* as totalCustomers")
                .first();
            console.log("Customers result:", totalCustomersResult);
        } catch (error) {
            console.error("Error fetching customers:", error);
            totalCustomersResult = { totalCustomers: 0 };
        }

        // Get yesterday's customers for comparison
        console.log("Fetching yesterday's customers...");
        let yesterdayCustomersResult;
        try {
            yesterdayCustomersResult = await db("customers")
                .where("client_id", clientId)
                .whereBetween("created_at", [yesterday, yesterdayEnd])
                .count("* as totalCustomers")
                .first();
            console.log("Yesterday's customers result:", yesterdayCustomersResult);
        } catch (error) {
            console.error("Error fetching yesterday's customers:", error);
            yesterdayCustomersResult = { totalCustomers: 0 };
        }

        // Get total products
        console.log("Fetching products...");
        let totalProductsResult;
        try {
            totalProductsResult = await db("products")
                .where("client_id", clientId)
                .where("active", true)
                .count("* as totalProducts")
                .first();
            console.log("Products result:", totalProductsResult);
        } catch (error) {
            console.error("Error fetching products:", error);
            totalProductsResult = { totalProducts: 0 };
        }

        // Get yesterday's products for comparison
        console.log("Fetching yesterday's products...");
        let yesterdayProductsResult;
        try {
            yesterdayProductsResult = await db("products")
                .where("client_id", clientId)
                .where("active", true)
                .whereBetween("created_at", [yesterday, yesterdayEnd])
                .count("* as totalProducts")
                .first();
            console.log("Yesterday's products result:", yesterdayProductsResult);
        } catch (error) {
            console.error("Error fetching yesterday's products:", error);
            yesterdayProductsResult = { totalProducts: 0 };
        }

        // Get total services
        console.log("Fetching services...");
        let totalServicesResult;
        try {
            totalServicesResult = await db("services")
                .where("client_id", clientId)
                .where("active", true)
                .count("* as totalServices")
                .first();
            console.log("Services result:", totalServicesResult);
        } catch (error) {
            console.error("Error fetching services:", error);
            totalServicesResult = { totalServices: 0 };
        }

        // Get total bookings
        console.log("Fetching bookings...");
        let totalBookingsResult;
        try {
            totalBookingsResult = await db("bookings")
                .where("client_id", clientId)
                .count("* as totalBookings")
                .first();
            console.log("Bookings result:", totalBookingsResult);
        } catch (error) {
            console.error("Error fetching bookings:", error);
            totalBookingsResult = { totalBookings: 0 };
        }

        // Get total sales (all time)
        console.log("Fetching total sales...");
        let totalSalesResult;
        try {
            totalSalesResult = await db("receipts")
                .where("client_id", clientId)
                .sum("total_amount as totalSales")
                .first();
            console.log("Total sales result:", totalSalesResult);
        } catch (error) {
            console.error("Error fetching total sales:", error);
            totalSalesResult = { totalSales: 0 };
        }

        // Get total transactions (all time) - includes both POS and website
        console.log("Fetching total transactions...");
        let totalTransactionsResult;
        try {
            totalTransactionsResult = await db("receipts")
                .where("client_id", clientId)
                .count("* as totalTransactions")
                .first();
            console.log("Total transactions result:", totalTransactionsResult);
        } catch (error) {
            console.error("Error fetching total transactions:", error);
            totalTransactionsResult = { totalTransactions: 0 };
        }

        // Get total website orders (all time)
        console.log("Fetching total website orders...");
        let totalWebsiteOrdersResult;
        try {
            totalWebsiteOrdersResult = await db("receipts")
                .where("client_id", clientId)
                .where("source", "website")
                .count("* as totalWebsiteOrders")
                .first();
            console.log("Total website orders result:", totalWebsiteOrdersResult);
        } catch (error) {
            console.error("Error fetching total website orders:", error);
            totalWebsiteOrdersResult = { totalWebsiteOrders: 0 };
        }

        // Get low stock products (less than 10 in stock)
        console.log("Fetching low stock...");
        let lowStockResult;
        try {
            lowStockResult = await db("products")
                .where("client_id", clientId)
                .where("active", true)
                .where("stock", "<", 10)
                .count("* as lowStock")
                .first();
            console.log("Low stock result:", lowStockResult);
        } catch (error) {
            console.error("Error fetching low stock:", error);
            lowStockResult = { lowStock: 0 };
        }

        // Get new bookings today
        console.log("Fetching new bookings...");
        let newBookingsResult;
        try {
            newBookingsResult = await db("bookings")
                .where("client_id", clientId)
                .whereBetween("created_at", [today, tomorrow])
                .count("* as newBookings")
                .first();
            console.log("New bookings result:", newBookingsResult);
        } catch (error) {
            console.error("Error fetching new bookings:", error);
            newBookingsResult = { newBookings: 0 };
        }

        // Get recent POS transactions only
        console.log("Fetching recent POS transactions...");
        let recentSales = [];
        try {
            recentSales = await db("receipts")
                .select(
                    db.raw("'sale' as type"),
                    "receipts.id",
                    "customers.name as customer",
                    "receipts.total_amount as amount",
                    "receipts.payment_status as status",
                    "receipts.created_at as date"
                )
                .leftJoin("customers", "receipts.customer_id", "customers.id")
                .where("receipts.client_id", clientId)
                .where("receipts.source", "pos") // Only POS transactions
                .orderBy("receipts.created_at", "desc")
                .limit(3);
            console.log("Recent POS transactions result:", recentSales);
        } catch (error) {
            console.error("Error fetching recent POS transactions:", error);
            recentSales = [];
        }

        let recentBookings = [];
        try {
            recentBookings = await db("bookings")
                .select(
                    db.raw("'booking' as type"),
                    "bookings.id",
                    "customers.name as customer",
                    "bookings.price as amount",
                    "bookings.status",
                    "bookings.created_at as date"
                )
                .leftJoin("customers", "bookings.customer_id", "customers.id")
                .where("bookings.client_id", clientId)
                .orderBy("bookings.created_at", "desc")
                .limit(3);
            console.log("Recent bookings result:", recentBookings);
        } catch (error) {
            console.error("Error fetching recent bookings:", error);
            recentBookings = [];
        }

        // Combine and sort recent transactions
        const recentTransactions = [...recentSales, ...recentBookings]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 4)
            .map((transaction) => {
                const timeDiff = Date.now() - new Date(transaction.date).getTime();
                const minutes = Math.floor(timeDiff / (1000 * 60));
                const hours = Math.floor(timeDiff / (1000 * 60 * 60));
                const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                let timeAgo = "";
                if (days > 0) {
                    timeAgo = `${days} day${days > 1 ? "s" : ""} ago`;
                } else if (hours > 0) {
                    timeAgo = `${hours} hour${hours > 1 ? "s" : ""} ago`;
                } else {
                    timeAgo = `${minutes} min ago`;
                }

                return {
                    id: `${transaction.type}-${transaction.id}`,
                    customer: transaction.customer || "Walk-in Customer",
                    amount: parseFloat(transaction.amount || 0),
                    type: transaction.type,
                    date: new Date(transaction.date).toISOString().split("T")[0],
                    status: transaction.status,
                    time: timeAgo,
                };
            });

        // Calculate changes
        const todaySales = parseFloat(todaySalesResult.totalSales) || 0;
        const todayOrders = parseInt(todayOrdersResult.totalOrders) || 0;
        const yesterdaySales = parseFloat(yesterdaySalesResult.totalSales) || 0;
        const yesterdayOrders = parseInt(yesterdayOrdersResult.totalOrders) || 0;
        const yesterdayCustomers =
            parseInt(yesterdayCustomersResult.totalCustomers) || 0;
        const yesterdayProducts =
            parseInt(yesterdayProductsResult.totalProducts) || 0;

        const salesChange =
            yesterdaySales > 0 ?
            ((todaySales - yesterdaySales) / yesterdaySales) * 100 :
            0;
        const ordersChange =
            yesterdayOrders > 0 ?
            ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100 :
            0;
        const customersChange =
            yesterdayCustomers > 0 ?
            ((parseInt(totalCustomersResult.totalCustomers) -
                    yesterdayCustomers) /
                yesterdayCustomers) *
            100 :
            0;
        const productsChange =
            yesterdayProducts > 0 ?
            ((parseInt(totalProductsResult.totalProducts) - yesterdayProducts) /
                yesterdayProducts) *
            100 :
            0;

        const dashboardData = {
            stats: {
                totalSales: parseFloat(totalSalesResult.totalSales) || 0,
                totalTransactions: parseInt(totalTransactionsResult.totalTransactions) || 0,
                totalWebsiteOrders: parseInt(totalWebsiteOrdersResult.totalWebsiteOrders) || 0,
                totalCustomers: parseInt(totalCustomersResult.totalCustomers) || 0,
                totalProducts: parseInt(totalProductsResult.totalProducts) || 0,
                totalServices: parseInt(totalServicesResult.totalServices) || 0,
                totalBookings: parseInt(totalBookingsResult.totalBookings) || 0,
                todaySales: todaySales,
                todayOrders: todayOrders,
                salesChange: Math.round(salesChange * 100) / 100,
                ordersChange: Math.round(ordersChange * 100) / 100,
                customersChange: Math.round(customersChange * 100) / 100,
                productsChange: Math.round(productsChange * 100) / 100,
            },
            recentTransactions: recentTransactions,
            alerts: {
                lowStock: parseInt(lowStockResult.lowStock) || 0,
                newBookings: parseInt(newBookingsResult.newBookings) || 0,
            },
        };

        console.log("Dashboard data prepared:", dashboardData);
        console.log("=== DASHBOARD REQUEST END ===");

        res.json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: dashboardData,
        });
    } catch (error) {
        console.error("=== DASHBOARD ERROR ===");
        console.error("Get dashboard data error:", error);
        console.error("Error stack:", error.stack);
        console.error("=== DASHBOARD ERROR END ===");
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data: " + error.message,
        });
    }
};

// Get today's stats only
const getTodayStats = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get today's sales
        const todaySalesResult = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [today, tomorrow])
            .sum("total_amount as totalSales")
            .first();

        // Get today's orders
        const todayOrdersResult = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [today, tomorrow])
            .count("* as totalOrders")
            .first();

        const todayData = {
            stats: {
                todaySales: parseFloat(todaySalesResult.totalSales) || 0,
                todayOrders: parseInt(todayOrdersResult.totalOrders) || 0,
            },
        };

        res.json({
            success: true,
            message: "Today's stats fetched successfully",
            data: todayData,
        });
    } catch (error) {
        console.error("Get today stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch today's stats",
        });
    }
};

module.exports = {
    getDashboardData,
    getTodayStats,
};