const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");

// Validation rules for receipt creation
const receiptValidation = [
  body("customer_id")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true; // Allow null/empty values
      }
      return Number.isInteger(Number(value));
    })
    .withMessage("Customer ID must be a valid integer or null"),
  body("staff_id")
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === "") {
        return true; // Allow null/empty values
      }
      return Number.isInteger(Number(value));
    })
    .withMessage("Staff ID must be a valid integer or null"),
  body("subtotal")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),
  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a positive number"),
  body("total")
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),
  body("payment_method")
    .isIn(["cash", "card", "mobile", "other", "cod"])
    .withMessage("Invalid payment method"),
  body("payment_status")
    .optional()
    .isIn(["pending", "completed", "failed", "refunded", "paid"])
    .withMessage("Invalid payment status"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.product_id")
    .optional()
    .isInt()
    .withMessage("Product ID must be a valid integer"),
  body("items.*.service_id")
    .optional()
    .isInt()
    .withMessage("Service ID must be a valid integer"),
  body("items.*.name").notEmpty().withMessage("Item name is required"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Item price must be a positive number"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),
  body("items.*.total")
    .isFloat({ min: 0 })
    .withMessage("Item total must be a positive number"),
];

// Validation rules for public receipt creation (no auth required)
const publicReceiptValidation = [
  body("client_id").isInt().withMessage("Client ID must be a valid integer"),
  body("customer_name").notEmpty().withMessage("Customer name is required"),
  body("customer_email")
    .isEmail()
    .withMessage("Valid customer email is required"),
  body("customer_phone").notEmpty().withMessage("Customer phone is required"),
  body("customer_address")
    .notEmpty()
    .withMessage("Customer address is required"),
  body("subtotal")
    .isFloat({ min: 0 })
    .withMessage("Subtotal must be a positive number"),
  body("tax")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Tax must be a positive number"),
  body("discount")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Discount must be a positive number"),
  body("total")
    .isFloat({ min: 0 })
    .withMessage("Total must be a positive number"),
  body("payment_method")
    .isIn(["cash", "card", "mobile", "other", "cod"])
    .withMessage("Invalid payment method"),
  body("payment_status")
    .optional()
    .isIn(["pending", "completed", "failed", "refunded", "paid"])
    .withMessage("Invalid payment status"),
  body("items")
    .isArray({ min: 1 })
    .withMessage("At least one item is required"),
  body("items.*.product_id")
    .optional()
    .isInt()
    .withMessage("Product ID must be a valid integer"),
  body("items.*.service_id")
    .optional()
    .isInt()
    .withMessage("Service ID must be a valid integer"),
  body("items.*.name").notEmpty().withMessage("Item name is required"),
  body("items.*.price")
    .isFloat({ min: 0 })
    .withMessage("Item price must be a positive number"),
  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Item quantity must be at least 1"),
  body("items.*.total")
    .isFloat({ min: 0 })
    .withMessage("Item total must be a positive number"),
];

// Generate unique receipt number
const generateReceiptNumber = async (clientId) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `R${dateStr}`;

  // Get the last receipt number for today (across all clients)
  const lastReceipt = await db("receipts")
    .where("receipt_number", "like", `${prefix}%`)
    .orderBy("receipt_number", "desc")
    .first();

  if (lastReceipt) {
    const lastNumber = parseInt(lastReceipt.receipt_number.slice(-4));
    const newNumber = (lastNumber + 1).toString().padStart(4, "0");
    return `${prefix}${newNumber}`;
  } else {
    return `${prefix}0001`;
  }
};

// Create a new receipt/transaction for public customers (no auth required)
const createPublicReceipt = async (req, res) => {
  try {
    console.log(
      "Public receipt request body:",
      JSON.stringify(req.body, null, 2)
    );
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Public receipt validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const receiptData = req.body;
    const clientId = receiptData.client_id;

    // Verify that the client exists
    const client = await db("users").where({ id: clientId }).first();
    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(clientId);

    // Determine order and payment status based on payment method for website orders
    let orderStatus = "pending";
    let paymentStatus = "pending";

    if (receiptData.payment_method === "card") {
      orderStatus = "delivered"; // Changed from "completed" to "delivered"
      paymentStatus = "paid";
    } else if (receiptData.payment_method === "cod") {
      orderStatus = "pending";
      paymentStatus = "pending";
    }

    // Prepare receipt data with items as JSON
    const receipt = {
      client_id: clientId,
      receipt_number: receiptNumber,
      subtotal: receiptData.subtotal || 0,
      tax: receiptData.tax || 0,
      discount: receiptData.discount || 0,
      total: receiptData.total,
      total_amount: receiptData.total, // Add total_amount for compatibility
      payment_method: receiptData.payment_method,
      payment_status: receiptData.payment_status || paymentStatus,
      order_status: receiptData.order_status || orderStatus,
      source: "website", // Public receipts are always from website
      notes: receiptData.notes || `Online order from ${client.name}`,
      send_invoice: receiptData.send_invoice || false,
      customer_name: receiptData.customer_name,
      customer_email: receiptData.customer_email,
      customer_phone: receiptData.customer_phone,
      customer_address: receiptData.customer_address,
      items: JSON.stringify(receiptData.items), // Store items as JSON in receipts table
    };

    // Insert receipt
    const [receiptId] = await db("receipts").insert(receipt);

    // Get the complete receipt with items
    const completeReceipt = await db("receipts")
      .where({ id: receiptId })
      .first();

    // Parse items from JSON
    completeReceipt.items = JSON.parse(completeReceipt.items || "[]");

    res.status(201).json({
      success: true,
      message: "Receipt created successfully",
      data: {
        receipt: completeReceipt,
        receipt_number: receiptNumber,
      },
    });
  } catch (error) {
    console.error("Error creating public receipt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create receipt",
      error: error.message,
    });
  }
};

// Create a new receipt/transaction
const createReceipt = async (req, res) => {
  try {
    console.log("=== CREATE RECEIPT REQUEST ===");
    console.log("User:", req.user);
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("Validation errors:", errors.array());
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    // For staff members and cashiers, use business_id instead of their own id
    const clientId = req.user.business_id || req.user.id;
    const receiptData = req.body;

    // Set staff_id if user is staff/cashier
    let staffId = receiptData.staff_id;
    if (req.user.role === "staff" || req.user.role === "cashier") {
      staffId = req.user.id;
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(clientId);

    // Determine order and payment status based on payment method
    let orderStatus = "delivered"; // Changed from "completed" to "delivered"
    let paymentStatus = "completed";

    if (receiptData.payment_method === "cod") {
      orderStatus = "pending";
      paymentStatus = "pending";
    } else if (receiptData.payment_method === "card") {
      orderStatus = "delivered"; // Changed from "completed" to "delivered"
      paymentStatus = "paid";
    }

    // Prepare receipt data
    const receipt = {
      client_id: clientId,
      customer_id: receiptData.customer_id || null,
      staff_id: staffId || null,
      receipt_number: receiptNumber,
      subtotal: receiptData.subtotal,
      tax: receiptData.tax || 0,
      discount: receiptData.discount || 0,
      total: receiptData.total,
      total_amount: receiptData.total, // Add total_amount for compatibility
      payment_method: receiptData.payment_method,
      payment_status: receiptData.payment_status || paymentStatus,
      order_status: receiptData.order_status || orderStatus,
      source: receiptData.source || "pos",
      items: JSON.stringify(receiptData.items),
      notes: receiptData.notes || null,
      send_invoice: receiptData.send_invoice || false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Start transaction
    const trx = await db.transaction();

    try {
      // Insert receipt
      const [receiptId] = await trx("receipts").insert(receipt);

      // Update product stock for products in the transaction
      for (const item of receiptData.items) {
        if (item.product_id) {
          await trx("products")
            .where("id", item.product_id)
            .where("client_id", clientId)
            .decrement("stock", item.quantity);
        }
      }

      // Update customer total spent if customer is selected
      if (receiptData.customer_id) {
        await trx("customers")
          .where("id", receiptData.customer_id)
          .where("client_id", clientId)
          .increment("total_spent", receiptData.total);
      }

      await trx.commit();

      // Get the created receipt with customer and staff details
      const createdReceipt = await db("receipts")
        .select(
          "receipts.*",
          "customers.name as customer_name",
          "customers.email as customer_email",
          "staff.name as staff_name"
        )
        .leftJoin("customers", "receipts.customer_id", "customers.id")
        .leftJoin("staff", "receipts.staff_id", "staff.id")
        .where("receipts.id", receiptId)
        .first();

      res.status(201).json({
        success: true,
        message: "Receipt created successfully",
        data: {
          receipt: createdReceipt,
          receipt_number: receiptNumber,
        },
      });
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  } catch (error) {
    console.error("=== CREATE RECEIPT ERROR ===");
    console.error("Create receipt error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("=== CREATE RECEIPT ERROR END ===");
    res.status(500).json({
      success: false,
      message: "Failed to create receipt: " + error.message,
    });
  }
};

// Get all receipts with pagination and filters
const getReceipts = async (req, res) => {
  try {
    console.log("=== GET RECEIPTS REQUEST ===");
    console.log("User:", req.user);
    console.log("User ID:", req.user.id);
    console.log("Business ID:", req.user.business_id);
    const clientId = req.user.business_id || req.user.id;
    console.log("Using Client ID:", clientId);
    const {
      page = 1,
      limit = 20,
      search,
      startDate,
      endDate,
      paymentStatus,
    } = req.query;
    const offset = (page - 1) * limit;

    let query = db("receipts")
      .select(
        "receipts.*",
        "customers.name as customer_name",
        "customers.email as customer_email",
        "staff.name as staff_name"
      )
      .leftJoin("customers", "receipts.customer_id", "customers.id")
      .leftJoin("staff", "receipts.staff_id", "staff.id")
      .where("receipts.client_id", clientId);

    // Apply filters
    if (search) {
      query = query.where(function () {
        this.where("receipts.receipt_number", "like", `%${search}%`)
          .orWhere("customers.name", "like", `%${search}%`)
          .orWhere("customers.email", "like", `%${search}%`);
      });
    }

    if (startDate && endDate) {
      query = query.whereBetween("receipts.created_at", [startDate, endDate]);
    }

    if (paymentStatus) {
      query = query.where("receipts.payment_status", paymentStatus);
    }

    // Get total count for pagination
    const totalQuery = query.clone();
    const totalResult = await totalQuery.count("* as total").first();
    const total = totalResult.total;

    // Get paginated results
    const receipts = await query
      .orderBy("receipts.created_at", "desc")
      .limit(limit)
      .offset(offset);

    // Parse items JSON for each receipt
    const receiptsWithItems = receipts.map((receipt) => {
      console.log("Raw receipt items:", receipt.items);
      const parsedItems = JSON.parse(receipt.items || "[]");
      console.log("Parsed items:", parsedItems);
      return {
        ...receipt,
        items: parsedItems,
      };
    });

    res.json({
      success: true,
      message: "Receipts fetched successfully",
      data: {
        receipts: receiptsWithItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get receipts error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch receipts",
    });
  }
};

// Get a single receipt by ID
const getReceipt = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const receiptId = req.params.id;

    const receipt = await db("receipts")
      .select(
        "receipts.*",
        "customers.name as customer_name",
        "customers.email as customer_email",
        "customers.phone as customer_phone",
        "staff.name as staff_name"
      )
      .leftJoin("customers", "receipts.customer_id", "customers.id")
      .leftJoin("staff", "receipts.staff_id", "staff.id")
      .where("receipts.id", receiptId)
      .where("receipts.client_id", clientId)
      .first();

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    // Parse items JSON
    receipt.items = JSON.parse(receipt.items || "[]");

    res.json({
      success: true,
      message: "Receipt fetched successfully",
      data: receipt,
    });
  } catch (error) {
    console.error("Get receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch receipt",
    });
  }
};

// Update receipt status
const updateReceipt = async (req, res) => {
  try {
    const clientId = req.user.id;
    const receiptId = req.params.id;
    const { payment_status, notes } = req.body;

    const receipt = await db("receipts")
      .where("id", receiptId)
      .where("client_id", clientId)
      .first();

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const updateData = {
      payment_status: payment_status || receipt.payment_status,
      notes: notes !== undefined ? notes : receipt.notes,
      updated_at: new Date(),
    };

    await db("receipts").where("id", receiptId).update(updateData);

    const updatedReceipt = await db("receipts")
      .select(
        "receipts.*",
        "customers.name as customer_name",
        "customers.email as customer_email",
        "staff.name as staff_name"
      )
      .leftJoin("customers", "receipts.customer_id", "customers.id")
      .leftJoin("staff", "receipts.staff_id", "staff.id")
      .where("receipts.id", receiptId)
      .first();

    // Parse items JSON
    updatedReceipt.items = JSON.parse(updatedReceipt.items || "[]");

    res.json({
      success: true,
      message: "Receipt updated successfully",
      data: updatedReceipt,
    });
  } catch (error) {
    console.error("Update receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update receipt",
    });
  }
};

// Update receipt status (for orders/transactions)
const updateReceiptStatus = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const receiptId = req.params.id;
    const { order_status, payment_status } = req.body;

    const receipt = await db("receipts")
      .where("id", receiptId)
      .where("client_id", clientId)
      .first();

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    const updateData = {
      order_status: order_status || receipt.order_status,
      payment_status: payment_status || receipt.payment_status,
      updated_at: new Date(),
    };

    await db("receipts").where("id", receiptId).update(updateData);

    const updatedReceipt = await db("receipts")
      .select(
        "receipts.*",
        "customers.name as customer_name",
        "customers.email as customer_email",
        "staff.name as staff_name"
      )
      .leftJoin("customers", "receipts.customer_id", "customers.id")
      .leftJoin("staff", "receipts.staff_id", "staff.id")
      .where("receipts.id", receiptId)
      .first();

    // Parse items JSON
    updatedReceipt.items = JSON.parse(updatedReceipt.items || "[]");

    res.json({
      success: true,
      message: "Receipt status updated successfully",
      data: updatedReceipt,
    });
  } catch (error) {
    console.error("Update receipt status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update receipt status",
    });
  }
};

// Delete receipt (soft delete or hard delete)
const deleteReceipt = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const receiptId = req.params.id;

    const receipt = await db("receipts")
      .where("id", receiptId)
      .where("client_id", clientId)
      .first();

    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found",
      });
    }

    // For now, we'll do a hard delete
    // In production, you might want to implement soft delete
    await db("receipts").where("id", receiptId).del();

    res.json({
      success: true,
      message: "Receipt deleted successfully",
    });
  } catch (error) {
    console.error("Delete receipt error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete receipt",
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const { source } = req.query; // Get source filter from query params

    // Build base query with source filter if provided
    const baseQuery = db("receipts").where("client_id", clientId);
    if (source && source !== "all") {
      baseQuery.where("source", source);
    }

    // Get pending orders count
    const pendingOrders = await baseQuery
      .clone()
      .where("order_status", "pending")
      .count("* as count")
      .first();

    // Get expected cash (sum of all non-delivered orders)
    const expectedCash = await baseQuery
      .clone()
      .whereNot("order_status", "delivered")
      .sum("total_amount as total")
      .first();

    // Get collected cash (sum of delivered orders)
    const collectedCash = await baseQuery
      .clone()
      .where("order_status", "delivered")
      .sum("total_amount as total")
      .first();

    res.json({
      success: true,
      data: {
        pendingOrders: pendingOrders.count || 0,
        expectedCash: expectedCash.total || 0,
        collectedCash: collectedCash.total || 0,
      },
    });
  } catch (error) {
    console.error("Get order stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get order statistics",
    });
  }
};

// Bulk delete orders
const bulkDeleteOrders = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const { orderIds } = req.body;

    console.log("Bulk delete request:", { clientId, orderIds });

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid order IDs",
      });
    }

    // Verify all orders belong to the client
    const existingOrders = await db("receipts")
      .where("client_id", clientId)
      .whereIn("id", orderIds)
      .select("id");

    console.log(
      "Existing orders found:",
      existingOrders.length,
      "Requested:",
      orderIds.length
    );

    if (existingOrders.length !== orderIds.length) {
      return res.status(400).json({
        success: false,
        message: `Some orders not found or don't belong to your business. Found: ${existingOrders.length}, Requested: ${orderIds.length}`,
      });
    }

    // Delete the orders
    await db("receipts").whereIn("id", orderIds).del();

    res.json({
      success: true,
      message: `${orderIds.length} orders deleted successfully`,
    });
  } catch (error) {
    console.error("Bulk delete orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete orders",
    });
  }
};

// Clean up test orders (for development/testing)
const cleanupTestOrders = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;

    // Delete orders that might be test data (you can customize this condition)
    const deletedOrders = await db("receipts")
      .where("client_id", clientId)
      .where(function () {
        this.where("customer_name", "like", "%test%")
          .orWhere("customer_name", "like", "%demo%")
          .orWhere("customer_name", "like", "%admin%")
          .orWhere("customer_email", "like", "%test%")
          .orWhere("customer_email", "like", "%demo%");
      })
      .del();

    res.json({
      success: true,
      message: `Cleaned up ${deletedOrders} test orders`,
    });
  } catch (error) {
    console.error("Cleanup test orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cleanup test orders",
    });
  }
};

// Get receipt statistics
const getReceiptStats = async (req, res) => {
  try {
    const clientId = req.user.business_id || req.user.id;
    const { period = "30" } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get total sales
    const totalSalesResult = await db("receipts")
      .where("client_id", clientId)
      .whereBetween("created_at", [startDate, endDate])
      .sum("total as totalSales")
      .first();

    // Get total transactions
    const totalTransactionsResult = await db("receipts")
      .where("client_id", clientId)
      .whereBetween("created_at", [startDate, endDate])
      .count("* as totalTransactions")
      .first();

    // Get average transaction value
    const avgTransactionResult = await db("receipts")
      .where("client_id", clientId)
      .whereBetween("created_at", [startDate, endDate])
      .avg("total as avgTransaction")
      .first();

    // Get sales by payment method
    const salesByPaymentMethod = await db("receipts")
      .select(
        "payment_method",
        db.raw("COUNT(*) as count"),
        db.raw("SUM(total) as total")
      )
      .where("client_id", clientId)
      .whereBetween("created_at", [startDate, endDate])
      .groupBy("payment_method");

    res.json({
      success: true,
      message: "Receipt statistics fetched successfully",
      data: {
        totalSales: parseFloat(totalSalesResult.totalSales) || 0,
        totalTransactions:
          parseInt(totalTransactionsResult.totalTransactions) || 0,
        avgTransaction: parseFloat(avgTransactionResult.avgTransaction) || 0,
        salesByPaymentMethod,
      },
    });
  } catch (error) {
    console.error("Get receipt stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch receipt statistics",
    });
  }
};

module.exports = {
  createReceipt,
  createPublicReceipt,
  getReceipts,
  getReceipt,
  updateReceipt,
  updateReceiptStatus,
  deleteReceipt,
  getOrderStats,
  bulkDeleteOrders,
  cleanupTestOrders,
  getReceiptStats,
  receiptValidation,
  publicReceiptValidation,
};
