const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerAnalytics,
  customerValidation,
} = require("../controllers/customerController");

// All routes require authentication
router.use(auth);

// GET /api/customers - Get all customers with pagination and filters
router.get("/", getCustomers);

// GET /api/customers/analytics - Get customer analytics
router.get("/analytics", getCustomerAnalytics);

// GET /api/customers/:id - Get single customer
router.get("/:id", getCustomer);

// POST /api/customers - Create new customer
router.post("/", customerValidation, createCustomer);

// PUT /api/customers/:id - Update customer
router.put("/:id", customerValidation, updateCustomer);

// DELETE /api/customers/:id - Delete customer
router.delete("/:id", deleteCustomer);

module.exports = router;
