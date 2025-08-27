const express = require("express");
const { body } = require("express-validator");
const { auth } = require("../middleware/auth");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);

// Get all categories
router.get("/", categoryController.getCategories);

// Get single category
router.get("/:id", categoryController.getCategory);

// Create new category
router.post(
    "/",
    categoryController.categoryValidation,
    categoryController.createCategory
);

// Update category
router.put(
    "/:id",
    categoryController.categoryValidation,
    categoryController.updateCategory
);

// Delete category
router.delete("/:id", categoryController.deleteCategory);

module.exports = router;