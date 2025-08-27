const express = require("express");
const { auth } = require("../middleware/auth");
const receiptController = require("../controllers/receiptController");

const router = express.Router();

// Public route for customer orders (no auth required)
router.post(
    "/public",
    receiptController.publicReceiptValidation,
    receiptController.createPublicReceipt
);

// Apply auth middleware to all other routes
router.use(auth);

// Create a new receipt/transaction
router.post(
    "/",
    receiptController.receiptValidation,
    receiptController.createReceipt
);

// Get all receipts with pagination and filters
router.get("/", receiptController.getReceipts);

// Get receipt statistics
router.get("/stats", receiptController.getReceiptStats);

// Get order statistics
router.get("/orders/stats", receiptController.getOrderStats);

// Bulk delete orders
router.delete("/orders/bulk", receiptController.bulkDeleteOrders);

// Clean up test orders
router.delete("/orders/cleanup", receiptController.cleanupTestOrders);

// Get a single receipt by ID
router.get("/:id", receiptController.getReceipt);

// Update receipt
router.put("/:id", receiptController.updateReceipt);
router.put("/:id/status", receiptController.updateReceiptStatus);

// Delete receipt
router.delete("/:id", receiptController.deleteReceipt);

module.exports = router;