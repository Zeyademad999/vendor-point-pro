const express = require("express");
const { auth } = require("../middleware/auth");
const costsController = require("../controllers/costsController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all costs with pagination and filters
router.get("/", costsController.getCosts);

// Get cost statistics
router.get("/stats", costsController.getCostStats);

// Create new cost
router.post("/", costsController.createCost);

// Bulk delete costs
router.delete("/bulk", costsController.bulkDeleteCosts);

// Get cost by ID
router.get("/:id", costsController.getCost);

// Update cost
router.put("/:id", costsController.updateCost);

// Delete cost
router.delete("/:id", costsController.deleteCost);

module.exports = router;