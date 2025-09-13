const { db } = require("../config/database");

// Get all costs for a client
const getCosts = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const { page = 1, limit = 20, category, status, search } = req.query;

    let query = db("costs")
      .where("client_id", clientId)
      .orderBy("created_at", "desc");

    // Apply filters
    if (category && category !== "all") {
      query = query.where("category", category);
    }

    if (status && status !== "all") {
      query = query.where("status", status);
    }

    if (search) {
      query = query.where(function () {
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
    const costs = await query.limit(parseInt(limit)).offset(offset);

    res.json({
      success: true,
      data: {
        costs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Get costs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get costs",
    });
  }
};

// Get cost by ID
const getCost = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const costId = req.params.id;

    const cost = await db("costs")
      .where("id", costId)
      .where("client_id", clientId)
      .first();

    if (!cost) {
      return res.status(404).json({
        success: false,
        message: "Cost not found",
      });
    }

    res.json({
      success: true,
      data: cost,
    });
  } catch (error) {
    console.error("Get cost error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cost",
    });
  }
};

// Create new cost
const createCost = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const {
      title,
      amount,
      category,
      payment_method,
      status,
      due_date,
      description,
      is_recurring,
      recurrence_type,
    } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, amount, and category are required",
      });
    }

    // Generate reference number
    const referenceNumber = `COST-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    const costData = {
      client_id: clientId,
      title,
      amount: parseFloat(amount),
      currency: "EGP",
      category,
      payment_method: payment_method || "cash",
      status: status || "paid",
      due_date: due_date || null,
      description,
      reference_number: referenceNumber,
      is_recurring: is_recurring || false,
      recurrence_type: recurrence_type || null,
    };

    const [costId] = await db("costs").insert(costData);
    const newCost = await db("costs").where("id", costId).first();

    res.json({
      success: true,
      message: "Cost created successfully",
      data: newCost,
    });
  } catch (error) {
    console.error("Create cost error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create cost",
    });
  }
};

// Update cost
const updateCost = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const costId = req.params.id;
    const updateData = req.body;

    // Check if cost exists and belongs to client
    const existingCost = await db("costs")
      .where("id", costId)
      .where("client_id", clientId)
      .first();

    if (!existingCost) {
      return res.status(404).json({
        success: false,
        message: "Cost not found",
      });
    }

    // Update cost
    await db("costs")
      .where("id", costId)
      .update({
        ...updateData,
        updated_at: new Date(),
      });

    const updatedCost = await db("costs").where("id", costId).first();

    res.json({
      success: true,
      message: "Cost updated successfully",
      data: updatedCost,
    });
  } catch (error) {
    console.error("Update cost error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update cost",
    });
  }
};

// Delete cost
const deleteCost = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const costId = req.params.id;

    // Check if cost exists and belongs to client
    const existingCost = await db("costs")
      .where("id", costId)
      .where("client_id", clientId)
      .first();

    if (!existingCost) {
      return res.status(404).json({
        success: false,
        message: "Cost not found",
      });
    }

    await db("costs").where("id", costId).del();

    res.json({
      success: true,
      message: "Cost deleted successfully",
    });
  } catch (error) {
    console.error("Delete cost error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete cost",
    });
  }
};

// Get cost statistics
const getCostStats = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const { dateRange = "30" } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(dateRange));

    // Get total costs
    const totalCosts = await db("costs")
      .where("client_id", clientId)
      .whereBetween("created_at", [startDate, endDate])
      .sum("amount as total")
      .first();

    // Get costs by category
    const costsByCategory = await db("costs")
      .select("category")
      .sum("amount as total")
      .where("client_id", clientId)
      .whereBetween("created_at", [startDate, endDate])
      .groupBy("category")
      .orderBy("total", "desc");

    // Get costs by status
    const costsByStatus = await db("costs")
      .select("status")
      .sum("amount as total")
      .count("* as count")
      .where("client_id", clientId)
      .whereBetween("created_at", [startDate, endDate])
      .groupBy("status");

    // Get monthly costs (last 6 months)
    const monthlyCosts = await db("costs")
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
    const allTimeTotalCosts = await db("costs")
      .where("client_id", clientId)
      .sum("amount as total")
      .first();

    const allTimeCostsByStatus = await db("costs")
      .select("status")
      .sum("amount as total")
      .count("* as count")
      .where("client_id", clientId)
      .groupBy("status");

    res.json({
      success: true,
      data: {
        totalCosts: parseFloat(totalCosts.total) || 0,
        costsByCategory,
        costsByStatus,
        monthlyCosts,
        period: `${startDate.toISOString().split("T")[0]} to ${
          endDate.toISOString().split("T")[0]
        }`,
        // All-time stats for stat cards
        allTimeTotalCosts: parseFloat(allTimeTotalCosts.total) || 0,
        allTimeCostsByStatus,
      },
    });
  } catch (error) {
    console.error("Get cost stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get cost statistics",
    });
  }
};

// Bulk delete costs
const bulkDeleteCosts = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const { costIds } = req.body;

    if (!costIds || !Array.isArray(costIds) || costIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid cost IDs",
      });
    }

    // Verify all costs belong to the client
    const existingCosts = await db("costs")
      .whereIn("id", costIds)
      .where("client_id", clientId);

    if (existingCosts.length !== costIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some costs not found or don't belong to your business",
      });
    }

    await db("costs").whereIn("id", costIds).where("client_id", clientId).del();

    res.json({
      success: true,
      message: `${costIds.length} costs deleted successfully`,
    });
  } catch (error) {
    console.error("Bulk delete costs error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete costs",
    });
  }
};

module.exports = {
  getCosts,
  getCost,
  createCost,
  updateCost,
  deleteCost,
  getCostStats,
  bulkDeleteCosts,
};
