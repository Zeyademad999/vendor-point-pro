const express = require("express");
const { auth } = require("../middleware/auth");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get comprehensive dashboard data
router.get("/", dashboardController.getDashboardData);

// Get today's stats only
router.get("/today", dashboardController.getTodayStats);

module.exports = router;