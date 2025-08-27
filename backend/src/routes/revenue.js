const express = require("express");
const { auth } = require("../middleware/auth");
const revenueController = require("../controllers/revenueController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Debug middleware to log all requests
router.use((req, res, next) => {
    console.log(`Revenue route: ${req.method} ${req.path}`);
    console.log("Request body:", req.body);
    console.log("Request params:", req.params);
    console.log("Request query:", req.query);
    next();
});

// Get all revenue with pagination and filters
router.get("/", revenueController.getRevenue);

// Get revenue statistics
router.get("/stats", revenueController.getRevenueStats);

// Create new revenue
router.post("/", revenueController.createRevenue);

// Bulk delete revenue
router.delete("/bulk", revenueController.bulkDeleteRevenue);

// Get revenue by ID
router.get("/:id", revenueController.getRevenueById);

// Update revenue
router.put("/:id", revenueController.updateRevenue);

// Delete revenue
router.delete("/:id", revenueController.deleteRevenue);

module.exports = router;