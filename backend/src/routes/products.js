const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkImportProducts,
  getCategories,
  productValidation,
} = require("../controllers/productController");

// All routes require authentication
router.use(auth);

// GET /api/products - Get all products with pagination and filters
router.get("/", getProducts);

// GET /api/products/categories - Get categories list
router.get("/categories", getCategories);

// GET /api/products/:id - Get single product
router.get("/:id", getProduct);

// POST /api/products - Create new product
router.post("/", productValidation, createProduct);

// POST /api/products/bulk-import - Bulk import products
router.post("/bulk-import", bulkImportProducts);

// PUT /api/products/:id - Update product
router.put("/:id", productValidation, updateProduct);

// DELETE /api/products/:id - Delete product
router.delete("/:id", deleteProduct);

module.exports = router;
