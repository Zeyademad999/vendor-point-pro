const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  checkAvailability,
  getServiceCategories,
  serviceValidation,
} = require("../controllers/serviceController");

// All routes require authentication
router.use(auth);

// GET /api/services - Get all services with pagination and filters
router.get("/", getServices);

// GET /api/services/categories - Get service categories
router.get("/categories", getServiceCategories);

// GET /api/services/availability - Check service availability
router.get("/availability", checkAvailability);

// GET /api/services/:id - Get single service
router.get("/:id", getService);

// POST /api/services - Create new service
router.post("/", serviceValidation, createService);

// PUT /api/services/:id - Update service
router.put("/:id", serviceValidation, updateService);

// DELETE /api/services/:id - Delete service
router.delete("/:id", deleteService);

module.exports = router;
