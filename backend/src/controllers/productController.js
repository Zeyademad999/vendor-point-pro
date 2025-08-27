const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");

// Validation rules
const productValidation = [
    body("name").trim().notEmpty().withMessage("Product name is required"),
    body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
    body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer"),
    body("alert_level")
    .isInt({ min: 0 })
    .withMessage("Alert level must be a non-negative integer"),
];

// Get all products with pagination and filters
const getProducts = async(req, res) => {
    try {
        const { page = 1, limit = 10, search, category, status } = req.query;
        const offset = (page - 1) * limit;

        // For staff members and cashiers, use business_id; for business owners, use id
        let clientId = req.user.business_id || req.user.id;

        console.log("Product API - User object:", {
            id: req.user.id,
            role: req.user.role,
            business_id: req.user.business_id,
            business_name: req.user.business_name,
        });

        if (req.user.business_id) {
            console.log(
                `${req.user.role} ${req.user.id} accessing products for business owner ${clientId}`
            );
        }

        let query = db("products").where("client_id", clientId);
        let countQuery = db("products").where("client_id", clientId);

        // Apply filters
        if (search) {
            query = query.where(function() {
                this.where("name", "like", `%${search}%`).orWhere(
                    "description",
                    "like",
                    `%${search}%`
                );
            });
            countQuery = countQuery.where(function() {
                this.where("name", "like", `%${search}%`).orWhere(
                    "description",
                    "like",
                    `%${search}%`
                );
            });
        }

        if (category) {
            query = query.where("category_id", category);
            countQuery = countQuery.where("category_id", category);
        }

        if (status) {
            query = query.where("status", status);
            countQuery = countQuery.where("status", status);
        }

        // Get total count
        const total = await countQuery.count("* as count").first();

        // Get products with pagination
        const products = await query
            .select("*")
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);

        // Parse images for each product
        const productsWithParsedImages = products.map((product) => {
            if (product.images) {
                try {
                    product.images = JSON.parse(product.images);
                } catch (e) {
                    product.images = [];
                }
            } else {
                product.images = [];
            }
            return product;
        });

        res.json({
            success: true,
            data: productsWithParsedImages,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total.count,
                totalPages: Math.ceil(total.count / limit),
            },
        });
    } catch (error) {
        console.error("Get products error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
};

// Get single product by ID
const getProduct = async(req, res) => {
    try {
        const { id } = req.params;

        const product = await db("products")
            .where({ id, client_id: req.user.id })
            .first();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Parse images for the product
        if (product.images) {
            try {
                product.images = JSON.parse(product.images);
            } catch (e) {
                product.images = [];
            }
        } else {
            product.images = [];
        }

        res.json({
            success: true,
            data: product,
        });
    } catch (error) {
        console.error("Get product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product",
        });
    }
};

// Create new product
const createProduct = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const productData = {
            ...req.body,
            client_id: req.user.id,
            created_at: new Date(),
            updated_at: new Date(),
        };

        // Ensure images is properly serialized as JSON
        if (productData.images && Array.isArray(productData.images)) {
            productData.images = JSON.stringify(productData.images);
        }

        const [productId] = await db("products").insert(productData);
        const product = await db("products").where("id", productId).first();

        // Parse images back to array for response
        if (product.images) {
            try {
                product.images = JSON.parse(product.images);
            } catch (e) {
                product.images = [];
            }
        }

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        console.error("Create product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create product",
        });
    }
};

// Update product
const updateProduct = async(req, res) => {
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

        const product = await db("products")
            .where({ id, client_id: req.user.id })
            .first();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const updateData = {
            ...req.body,
            updated_at: new Date(),
        };

        // Ensure images is properly serialized as JSON
        if (updateData.images && Array.isArray(updateData.images)) {
            updateData.images = JSON.stringify(updateData.images);
        }

        await db("products")
            .where({ id, client_id: req.user.id })
            .update(updateData);

        const updatedProduct = await db("products").where("id", id).first();

        // Parse images back to array for response
        if (updatedProduct.images) {
            try {
                updatedProduct.images = JSON.parse(updatedProduct.images);
            } catch (e) {
                updatedProduct.images = [];
            }
        }

        res.json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });
    } catch (error) {
        console.error("Update product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update product",
        });
    }
};

// Delete product
const deleteProduct = async(req, res) => {
    try {
        const { id } = req.params;

        const product = await db("products")
            .where({ id, client_id: req.user.id })
            .first();

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        await db("products").where({ id, client_id: req.user.id }).del();

        res.json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete product error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete product",
        });
    }
};

// Bulk import products
const bulkImportProducts = async(req, res) => {
    try {
        const { products } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Products array is required",
            });
        }

        const productsToInsert = products.map((product) => ({
            ...product,
            client_id: req.user.id,
            created_at: new Date(),
            updated_at: new Date(),
        }));

        await db("products").insert(productsToInsert);

        res.json({
            success: true,
            message: `${products.length} products imported successfully`,
        });
    } catch (error) {
        console.error("Bulk import products error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to import products",
        });
    }
};

// Get categories list
const getCategories = async(req, res) => {
    try {
        const categories = await db("categories")
            .where("client_id", req.user.id)
            .where("type", "product")
            .select("id", "name");

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

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    bulkImportProducts,
    getCategories,
    productValidation,
};