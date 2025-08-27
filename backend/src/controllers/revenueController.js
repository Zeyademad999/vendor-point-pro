const { db } = require("../config/database");

// Get all revenue for a client
const getRevenue = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;

        const {
            page = 1,
                limit = 20,
                category,
                source,
                status,
                search,
        } = req.query;

        let query = db("revenue")
            .where("client_id", clientId)
            .orderBy("created_at", "desc");

        // Apply filters
        if (category && category !== "all") {
            query = query.where("category", category);
        }

        if (source && source !== "all") {
            query = query.where("source", source);
        }

        if (status && status !== "all") {
            query = query.where("status", status);
        }

        if (search) {
            query = query.where(function() {
                this.where("title", "like", `%${search}%`)
                    .orWhere("description", "like", `%${search}%`)
                    .orWhere("reference_number", "like", `%${search}%`);
            });
        }

        // Get total count
        const totalQuery = query.clone();
        const totalResult = await totalQuery.count("* as total").first();
        const total = parseInt(totalResult.total);

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const revenue = await query.limit(parseInt(limit)).offset(offset);

        res.json({
            success: true,
            data: {
                revenue,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error("Get revenue error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get revenue",
        });
    }
};

// Get revenue by ID
const getRevenueById = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const revenueId = req.params.id;

        const revenue = await db("revenue")
            .where("id", revenueId)
            .where("client_id", clientId)
            .first();

        if (!revenue) {
            return res.status(404).json({
                success: false,
                message: "Revenue not found",
            });
        }

        res.json({
            success: true,
            data: revenue,
        });
    } catch (error) {
        console.error("Get revenue error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get revenue",
        });
    }
};

// Create new revenue
const createRevenue = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;

        const {
            title,
            amount,
            category,
            source,
            payment_method,
            status,
            received_date,
            description,
            is_recurring,
            recurrence_type,
        } = req.body;

        if (!title || !amount || !category || !source) {
            return res.status(400).json({
                success: false,
                message: "Title, amount, category, and source are required",
            });
        }

        // Generate reference number
        const referenceNumber = `REV-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

        const revenueData = {
            client_id: clientId,
            title,
            amount: parseFloat(amount),
            currency: "EGP",
            category,
            source,
            payment_method: payment_method || "cash",
            status: status || "received",
            received_date: received_date || new Date().toISOString().split("T")[0],
            description,
            reference_number: referenceNumber,
            is_recurring: is_recurring || false,
            recurrence_type: recurrence_type || null,
        };

        const [revenueId] = await db("revenue").insert(revenueData);
        const newRevenue = await db("revenue").where("id", revenueId).first();

        res.json({
            success: true,
            message: "Revenue created successfully",
            data: newRevenue,
        });
    } catch (error) {
        console.error("Create revenue error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create revenue",
        });
    }
};

// Update revenue
const updateRevenue = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const revenueId = req.params.id;
        const updateData = req.body;

        // Check if revenue exists and belongs to client
        const existingRevenue = await db("revenue")
            .where("id", revenueId)
            .where("client_id", clientId)
            .first();

        if (!existingRevenue) {
            return res.status(404).json({
                success: false,
                message: "Revenue not found",
            });
        }

        // Update revenue
        await db("revenue")
            .where("id", revenueId)
            .update({
                ...updateData,
                updated_at: new Date(),
            });

        const updatedRevenue = await db("revenue").where("id", revenueId).first();

        res.json({
            success: true,
            message: "Revenue updated successfully",
            data: updatedRevenue,
        });
    } catch (error) {
        console.error("Update revenue error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update revenue",
        });
    }
};

// Delete revenue
const deleteRevenue = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const revenueId = req.params.id;

        // Check if revenue exists and belongs to client
        const existingRevenue = await db("revenue")
            .where("id", revenueId)
            .where("client_id", clientId)
            .first();

        if (!existingRevenue) {
            return res.status(404).json({
                success: false,
                message: "Revenue not found",
            });
        }

        await db("revenue").where("id", revenueId).del();

        res.json({
            success: true,
            message: "Revenue deleted successfully",
        });
    } catch (error) {
        console.error("Delete revenue error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete revenue",
        });
    }
};

// Get revenue statistics
const getRevenueStats = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const { dateRange = "30" } = req.query;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get total revenue
        const totalRevenue = await db("revenue")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .sum("amount as total")
            .first();

        // Get revenue by category
        const revenueByCategory = await db("revenue")
            .select("category")
            .sum("amount as total")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .groupBy("category")
            .orderBy("total", "desc");

        // Get revenue by source
        const revenueBySource = await db("revenue")
            .select("source")
            .sum("amount as total")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .groupBy("source")
            .orderBy("total", "desc");

        // Get revenue by status
        const revenueByStatus = await db("revenue")
            .select("status")
            .sum("amount as total")
            .count("* as count")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .groupBy("status");

        // Get monthly revenue (last 6 months)
        const monthlyRevenue = await db("revenue")
            .select(
                db.raw("strftime('%Y-%m', created_at) as month"),
                db.raw("SUM(amount) as total")
            )
            .where("client_id", clientId)
            .whereBetween("created_at", [
                new Date(new Date().setMonth(new Date().getMonth() - 6)),
                endDate,
            ])
            .groupBy("month")
            .orderBy("month", "asc");

        // Get all-time stats (not filtered by date)
        const allTimeTotalRevenue = await db("revenue")
            .where("client_id", clientId)
            .sum("amount as total")
            .first();

        const allTimeRevenueByStatus = await db("revenue")
            .select("status")
            .sum("amount as total")
            .count("* as count")
            .where("client_id", clientId)
            .groupBy("status");

        res.json({
            success: true,
            data: {
                totalRevenue: parseFloat(totalRevenue.total) || 0,
                revenueByCategory,
                revenueBySource,
                revenueByStatus,
                monthlyRevenue,
                period: `${startDate.toISOString().split("T")[0]} to ${
          endDate.toISOString().split("T")[0]
        }`,
                // All-time stats for stat cards
                allTimeTotalRevenue: parseFloat(allTimeTotalRevenue.total) || 0,
                allTimeRevenueByStatus,
            },
        });
    } catch (error) {
        console.error("Get revenue stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get revenue statistics",
        });
    }
};

// Bulk delete revenue
const bulkDeleteRevenue = async(req, res) => {
    try {
        console.log("Backend: Bulk delete request body:", req.body);
        const clientId = req.user.business_id || req.user.id;
        const { revenueIds } = req.body;
        console.log("Backend: Client ID:", clientId);
        console.log("Backend: Revenue IDs:", revenueIds);

        if (!revenueIds || !Array.isArray(revenueIds) || revenueIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide valid revenue IDs",
            });
        }

        // Verify all revenue belong to the client
        const existingRevenue = await db("revenue")
            .whereIn("id", revenueIds)
            .where("client_id", clientId);

        if (existingRevenue.length !== revenueIds.length) {
            return res.status(400).json({
                success: false,
                message: "Some revenue not found or don't belong to your business",
            });
        }

        await db("revenue")
            .whereIn("id", revenueIds)
            .where("client_id", clientId)
            .del();

        res.json({
            success: true,
            message: `${revenueIds.length} revenue entries deleted successfully`,
        });
    } catch (error) {
        console.error("Bulk delete revenue error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete revenue",
        });
    }
};

module.exports = {
    getRevenue,
    getRevenueById,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    getRevenueStats,
    bulkDeleteRevenue,
};