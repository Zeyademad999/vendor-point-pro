const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");

// Validation rules
const categoryValidation = [
    body("name").trim().notEmpty().withMessage("Category name is required"),
];

// Get all categories
const getCategories = async(req, res) => {
    try {
        const categories = await db("categories")
            .where("client_id", req.user.id)
            .orderBy("name", "asc");

        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        console.error("Get categories error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch categories",
        });
    }
};

// Get single category by ID
const getCategory = async(req, res) => {
    try {
        const { id } = req.params;

        const category = await db("categories")
            .where({ id, client_id: req.user.id })
            .first();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error("Get category error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch category",
        });
    }
};

// Create new category
const createCategory = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const categoryData = {
            ...req.body,
            client_id: req.user.id,
            type: "service", // Set default type for service categories
            created_at: new Date(),
            updated_at: new Date(),
        };

        const [categoryId] = await db("categories").insert(categoryData);
        const category = await db("categories").where("id", categoryId).first();

        res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        console.error("Create category error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create category",
        });
    }
};

// Update category
const updateCategory = async(req, res) => {
    try {
        const { id } = req.params;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const category = await db("categories")
            .where({ id, client_id: req.user.id })
            .first();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        const updateData = {
            ...req.body,
            updated_at: new Date(),
        };

        await db("categories")
            .where({ id, client_id: req.user.id })
            .update(updateData);

        const updatedCategory = await db("categories").where("id", id).first();

        res.json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory,
        });
    } catch (error) {
        console.error("Update category error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update category",
        });
    }
};

// Delete category
const deleteCategory = async(req, res) => {
    try {
        const { id } = req.params;

        const category = await db("categories")
            .where({ id, client_id: req.user.id })
            .first();

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found",
            });
        }

        // Check if category is being used by any services
        const servicesUsingCategory = await db("services")
            .where({ category_id: id, client_id: req.user.id })
            .first();

        if (servicesUsingCategory) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete category that is being used by services",
            });
        }

        await db("categories").where({ id, client_id: req.user.id }).del();

        res.json({
            success: true,
            message: "Category deleted successfully",
        });
    } catch (error) {
        console.error("Delete category error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete category",
        });
    }
};

module.exports = {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory,
    categoryValidation,
};