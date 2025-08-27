const { body, validationResult } = require("express-validator");
const { db } = require("../config/database");

// Validation rules
const customerValidation = [
    body("name").trim().notEmpty().withMessage("Customer name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Valid phone number is required"),
];

// Get all customers with pagination and filters
const getCustomers = async(req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;
        const offset = (page - 1) * limit;

        // For staff members and cashiers, use business_id; for business owners, use id
        let clientId = req.user.business_id || req.user.id;

        if (req.user.business_id) {
            console.log(
                `${req.user.role} ${req.user.id} accessing customers for business owner ${clientId}`
            );
        }

        let query = db("customers").where("client_id", clientId);
        let countQuery = db("customers").where("client_id", clientId);

        // Apply filters
        if (search) {
            query = query.where(function() {
                this.where("name", "like", `%${search}%`)
                    .orWhere("email", "like", `%${search}%`)
                    .orWhere("phone", "like", `%${search}%`);
            });
            countQuery = countQuery.where(function() {
                this.where("name", "like", `%${search}%`)
                    .orWhere("email", "like", `%${search}%`)
                    .orWhere("phone", "like", `%${search}%`);
            });
        }

        if (status) {
            query = query.where("status", status);
            countQuery = countQuery.where("status", status);
        }

        // Get total count
        const total = await countQuery.count("* as count").first();

        // Get customers with pagination
        const customers = await query
            .select("*")
            .orderBy("created_at", "desc")
            .limit(limit)
            .offset(offset);

        res.json({
            success: true,
            data: customers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total.count,
                totalPages: Math.ceil(total.count / limit),
            },
        });
    } catch (error) {
        console.error("Get customers error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customers",
        });
    }
};

// Get single customer by ID
const getCustomer = async(req, res) => {
    try {
        const { id } = req.params;

        const customer = await db("customers")
            .where({ id, client_id: req.user.id })
            .first();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        res.json({
            success: true,
            data: customer,
        });
    } catch (error) {
        console.error("Get customer error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer",
        });
    }
};

// Create new customer
const createCustomer = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const customerData = {
            ...req.body,
            client_id: req.user.id,
            created_at: new Date(),
            updated_at: new Date(),
        };

        const [customerId] = await db("customers").insert(customerData);
        const customer = await db("customers").where("id", customerId).first();

        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer,
        });
    } catch (error) {
        console.error("Create customer error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create customer",
        });
    }
};

// Update customer
const updateCustomer = async(req, res) => {
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

        const customer = await db("customers")
            .where({ id, client_id: req.user.id })
            .first();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const updateData = {
            ...req.body,
            updated_at: new Date(),
        };

        await db("customers")
            .where({ id, client_id: req.user.id })
            .update(updateData);

        const updatedCustomer = await db("customers").where("id", id).first();

        res.json({
            success: true,
            message: "Customer updated successfully",
            data: updatedCustomer,
        });
    } catch (error) {
        console.error("Update customer error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update customer",
        });
    }
};

// Delete customer
const deleteCustomer = async(req, res) => {
    try {
        const { id } = req.params;

        const customer = await db("customers")
            .where({ id, client_id: req.user.id })
            .first();

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        await db("customers").where({ id, client_id: req.user.id }).del();

        res.json({
            success: true,
            message: "Customer deleted successfully",
        });
    } catch (error) {
        console.error("Delete customer error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete customer",
        });
    }
};

// Get customer analytics
const getCustomerAnalytics = async(req, res) => {
    try {
        const { period = "month" } = req.query;

        // Get total customers
        const totalCustomers = await db("customers")
            .where("client_id", req.user.id)
            .count("* as count")
            .first();

        // Get new customers in period
        let newCustomersQuery = db("customers").where("client_id", req.user.id);
        if (period === "week") {
            newCustomersQuery = newCustomersQuery.where(
                "created_at",
                ">=",
                db.raw("date('now', '-7 days')")
            );
        } else if (period === "month") {
            newCustomersQuery = newCustomersQuery.where(
                "created_at",
                ">=",
                db.raw("date('now', '-30 days')")
            );
        } else if (period === "year") {
            newCustomersQuery = newCustomersQuery.where(
                "created_at",
                ">=",
                db.raw("date('now', '-365 days')")
            );
        }

        const newCustomers = await newCustomersQuery.count("* as count").first();

        // Get top customers by total spent
        const topCustomers = await db("receipts")
            .join("customers", "receipts.customer_id", "customers.id")
            .where("receipts.client_id", req.user.id)
            .select("customers.name", "customers.email")
            .sum("receipts.total_amount as total_spent")
            .groupBy("customers.id", "customers.name", "customers.email")
            .orderBy("total_spent", "desc")
            .limit(5);

        // Get customer growth over time
        const growthData = await db("customers")
            .where("client_id", req.user.id)
            .select(db.raw("date(created_at) as date"))
            .count("* as count")
            .groupBy(db.raw("date(created_at)"))
            .orderBy("date", "desc")
            .limit(30);

        res.json({
            success: true,
            data: {
                totalCustomers: totalCustomers.count,
                newCustomers: newCustomers.count,
                topCustomers,
                growthData,
            },
        });
    } catch (error) {
        console.error("Get customer analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer analytics",
        });
    }
};

module.exports = {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getCustomerAnalytics,
    customerValidation,
};