const express = require("express");
const { auth } = require("../middleware/auth");
const reportController = require("../controllers/reportController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get comprehensive reports
router.get("/", reportController.getReports);

// Get sales analytics
router.get("/sales", reportController.getSalesAnalytics);

// Get booking analytics
router.get("/bookings", reportController.getBookingAnalytics);

// Get performance metrics
router.get("/performance", reportController.getPerformanceMetrics);

// Get customer analytics
router.get("/customers", reportController.getCustomerAnalytics);

// Get product analytics
router.get("/products", reportController.getProductAnalytics);

// Get financial analytics
router.get("/financial", reportController.getFinancialAnalytics);

// Get transactions with pagination and filters
router.get("/transactions", reportController.getTransactions);

// Update transaction
router.put("/transactions/:id", reportController.updateTransaction);

// Delete transaction
router.delete("/transactions/:id", reportController.deleteTransaction);

// Bulk delete transactions
router.delete("/transactions/bulk", reportController.bulkDeleteTransactions);

// Get dashboard summary
router.get("/dashboard", reportController.getDashboardSummary);

// Export report
router.get("/export", reportController.exportReport);

// Get real-time analytics
router.get("/realtime", reportController.getRealTimeAnalytics);

// Get comparative analytics
router.get("/comparative", reportController.getComparativeAnalytics);

module.exports = router;