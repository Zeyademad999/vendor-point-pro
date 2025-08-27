const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");

// Validation rules
const serviceValidation = [
    body("name").trim().notEmpty().withMessage("Service name is required"),
    body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
    body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer"),
    body("category_id")
    .optional()
    .custom((value) => {
        if (value === null || value === undefined || value === "") {
            return true; // Allow null/empty values
        }
        return Number.isInteger(Number(value)); // Check if it's a valid integer
    })
    .withMessage("Category ID must be a valid integer"),
    body("booking_enabled")
    .optional()
    .isBoolean()
    .withMessage("Booking enabled must be a boolean"),
    body("active").optional().isBoolean().withMessage("Active must be a boolean"),
];

// Get all services with pagination and filters
const getServices = async(req, res) => {
    try {
        const { page = 1, limit = 10, search, category, status } = req.query;
        const offset = (page - 1) * limit;

        // For staff members and cashiers, use business_id; for business owners, use id
        let clientId = req.user.business_id || req.user.id;

        if (req.user.business_id) {
            console.log(
                `${req.user.role} ${req.user.id} accessing services for business owner ${clientId}`
            );
        }

        let query = db("services").where("services.client_id", clientId);
        let countQuery = db("services").where("services.client_id", clientId);

        // Apply filters
        if (search) {
            query = query.where(function() {
                this.where("services.name", "like", `%${search}%`)
                    .orWhere("categories.name", "like", `%${search}%`)
                    .orWhere("services.description", "like", `%${search}%`);
            });
            countQuery = countQuery.where(function() {
                this.where("services.name", "like", `%${search}%`)
                    .orWhere("categories.name", "like", `%${search}%`)
                    .orWhere("services.description", "like", `%${search}%`);
            });
        }

        if (category) {
            query = query.where("categories.name", category);
            countQuery = countQuery.where("categories.name", category);
        }

        if (status) {
            query = query.where("services.active", status === "active");
            countQuery = countQuery.where("services.active", status === "active");
        }

        // Get total count
        const total = await countQuery
            .leftJoin("categories", "services.category_id", "categories.id")
            .count("* as count")
            .first();

        // Get services with pagination
        const services = await query
            .select("services.*", "categories.name as category_name")
            .leftJoin("categories", "services.category_id", "categories.id")
            .orderBy("services.created_at", "desc")
            .limit(limit)
            .offset(offset);

        res.json({
            success: true,
            data: services,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total.count,
                totalPages: Math.ceil(total.count / limit),
            },
        });
    } catch (error) {
        console.error("Get services error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch services",
        });
    }
};

// Get single service by ID
const getService = async(req, res) => {
    try {
        const { id } = req.params;

        const service = await db("services")
            .select("services.*", "categories.name as category_name")
            .leftJoin("categories", "services.category_id", "categories.id")
            .where({ "services.id": id, "services.client_id": req.user.id })
            .first();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        res.json({
            success: true,
            data: service,
        });
    } catch (error) {
        console.error("Get service error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch service",
        });
    }
};

// Create new service
const createService = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const serviceData = {
            ...req.body,
            client_id: req.user.id,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const [serviceId] = await db("services").insert(serviceData);
        const service = await db("services")
            .select("services.*", "categories.name as category_name")
            .leftJoin("categories", "services.category_id", "categories.id")
            .where("services.id", serviceId)
            .first();

        res.status(201).json({
            success: true,
            message: "Service created successfully",
            data: service,
        });
    } catch (error) {
        console.error("Create service error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create service",
        });
    }
};

// Update service
const updateService = async(req, res) => {
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

        const service = await db("services")
            .where({ id, client_id: req.user.id })
            .first();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        const updateData = {
            ...req.body,
            updated_at: new Date(),
        };

        await db("services")
            .where({ id, client_id: req.user.id })
            .update(updateData);

        const updatedService = await db("services")
            .select("services.*", "categories.name as category_name")
            .leftJoin("categories", "services.category_id", "categories.id")
            .where("services.id", id)
            .first();

        res.json({
            success: true,
            message: "Service updated successfully",
            data: updatedService,
        });
    } catch (error) {
        console.error("Update service error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update service",
        });
    }
};

// Delete service
const deleteService = async(req, res) => {
    try {
        const { id } = req.params;

        const service = await db("services")
            .where({ id, client_id: req.user.id })
            .first();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        await db("services").where({ id, client_id: req.user.id }).del();

        res.json({
            success: true,
            message: "Service deleted successfully",
        });
    } catch (error) {
        console.error("Delete service error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete service",
        });
    }
};

// Check service availability
const checkAvailability = async(req, res) => {
    try {
        const { serviceId, date, time } = req.query;

        if (!serviceId || !date || !time) {
            return res.status(400).json({
                success: false,
                message: "Service ID, date, and time are required",
            });
        }

        // Get service details
        const service = await db("services")
            .where({ id: serviceId, client_id: req.user.id })
            .first();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        // Check existing bookings for this time slot
        const existingBookings = await db("bookings")
            .where({
                service_id: serviceId,
                client_id: req.user.id,
                date: date,
                status: "confirmed",
            })
            .where(function() {
                this.where("start_time", "<=", time).andWhere("end_time", ">", time);
            });

        const isAvailable = existingBookings.length === 0;

        res.json({
            success: true,
            data: {
                isAvailable,
                service,
                conflictingBookings: existingBookings,
            },
        });
    } catch (error) {
        console.error("Check availability error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check availability",
        });
    }
};

// Get service categories
const getServiceCategories = async(req, res) => {
    try {
        const categories = await db("categories")
            .where("client_id", req.user.id)
            .orderBy("name", "asc");

        res.json({
            success: true,
            message: "Categories fetched successfully",
            data: categories,
        });
    } catch (error) {
        console.error("Get service categories error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch service categories",
        });
    }
};

module.exports = {
    getServices,
    getService,
    createService,
    updateService,
    deleteService,
    checkAvailability,
    getServiceCategories,
    serviceValidation,
};