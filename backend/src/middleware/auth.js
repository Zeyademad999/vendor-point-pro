const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const config = require("../config/config");

const auth = async(req, res, next) => {
    try {
        const token = req.header("Authorization") ?
            req.header("Authorization").replace("Bearer ", "") :
            null;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided.",
            });
        }

        const decoded = jwt.verify(token, config.jwt.secret);
        console.log("Auth middleware - Token decoded:", decoded);

        // Handle both userId (for regular users) and staffId (for staff members)
        const userId = decoded.userId || decoded.staffId;
        console.log("Auth middleware - Using userId:", userId);

        // First check if user exists in users table
        let user = await db("users").where({ id: userId }).first();

        if (!user) {
            // If not found in users table, check staff table
            const staffUser = await db("staff")
                .select("staff.*", "users.name as business_name", "users.subdomain")
                .join("users", "staff.client_id", "users.id")
                .where({ "staff.id": userId })
                .first();
            if (staffUser) {
                user = {
                    id: staffUser.id,
                    name: staffUser.name,
                    email: staffUser.username, // Use username as email
                    phone: staffUser.phone,
                    role: staffUser.portal_access || "staff", // Use portal_access as role
                    status: staffUser.active ? "active" : "suspended", // Map active to status
                    business_id: staffUser.client_id, // Use client_id as business_id
                    business_name: staffUser.business_name,
                    portal_access: staffUser.portal_access,
                    permissions: staffUser.permissions, // Include permissions
                    created_at: staffUser.created_at,
                    updated_at: staffUser.updated_at,
                };
                console.log("Auth middleware - Found user in staff table:", user);
                console.log(
                    "Auth middleware - Staff permissions from DB:",
                    staffUser.permissions
                );
            } else {
                return res.status(401).json({
                    success: false,
                    message: "Invalid token. User not found.",
                });
            }
        } else {
            console.log("Auth middleware - Found user in users table:", user);

            // For cashiers in users table, get additional business data
            if (user.role === "cashier") {
                const cashierData = await db("staff")
                    .where({ user_id: user.id })
                    .first();

                if (cashierData) {
                    user = {
                        ...user,
                        business_id: cashierData.business_id,
                        business_name: cashierData.business_name,
                        portal_access: cashierData.portal_access,
                    };
                    console.log("Auth middleware - Enhanced cashier data:", user);
                }
            }
        }

        if (user.status !== "active") {
            return res.status(401).json({
                success: false,
                message: "Account is not active. Please contact support.",
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token.",
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired. Please login again.",
            });
        }

        console.error("Auth middleware error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
    }
};

const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }

        if (roles.length > 0 && !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Insufficient permissions.",
            });
        }

        next();
    };
};

const requireClient = (req, res, next) => {
    if (req.user.role !== "client") {
        return res.status(403).json({
            success: false,
            message: "Client access required.",
        });
    }
    next();
};

const requireAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({
            success: false,
            message: "Admin access required.",
        });
    }
    next();
};

module.exports = {
    auth,
    authorize,
    requireClient,
    requireAdmin,
};