const jwt = require("jsonwebtoken");
const { db } = require("../config/config");
const config = require("../config/config");

// Staff authentication middleware
const staffAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }

        const token = authHeader.substring(7); // Remove "Bearer " prefix

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret);

        // Check if token has staff information
        if (!decoded.staffId || !decoded.clientId) {
            return res.status(401).json({
                success: false,
                message: "Invalid token format",
            });
        }

        // Get staff information
        const staff = await db("staff")
            .select("staff.*", "users.name as business_name", "users.subdomain")
            .join("users", "staff.client_id", "users.id")
            .where({
                "staff.id": decoded.staffId,
                "staff.active": true,
                "staff.can_login": true
            })
            .first();

        if (!staff) {
            return res.status(401).json({
                success: false,
                message: "Staff account not found or inactive",
            });
        }

        // Verify client ID matches
        if (staff.client_id !== decoded.clientId) {
            return res.status(401).json({
                success: false,
                message: "Invalid business context",
            });
        }

        // Check if token is expired (basic check)
        if (decoded.exp && decoded.exp < Date.now() / 1000) {
            return res.status(401).json({
                success: false,
                message: "Token expired",
            });
        }

        // Add staff and business info to request
        req.staff = {
            id: staff.id,
            name: staff.name,
            email: staff.email,
            client_id: staff.client_id,
            portal_access: staff.portal_access,
            permissions: staff.permissions ? JSON.parse(staff.permissions) : {},
            username: staff.username,
        };

        req.business = {
            id: staff.client_id,
            name: staff.business_name,
            subdomain: staff.subdomain,
        };

        next();
    } catch (error) {
        console.error("Staff auth error:", error);
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                success: false,
                message: "Invalid token",
            });
        }
        
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Token expired",
            });
        }

        res.status(500).json({
            success: false,
            message: "Authentication error",
        });
    }
};

// Portal access middleware
const requirePortalAccess = (requiredPortal) => {
    return (req, res, next) => {
        if (!req.staff) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const staffPortal = req.staff.portal_access;
        
        // Check if staff has access to required portal
        if (staffPortal !== requiredPortal && staffPortal !== "all") {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required portal: ${requiredPortal}`,
            });
        }

        next();
    };
};

// Permission middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.staff) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const permissions = req.staff.permissions || {};
        
        if (!permissions[permission]) {
            return res.status(403).json({
                success: false,
                message: `Permission denied: ${permission}`,
            });
        }

        next();
    };
};

// Multiple permissions middleware
const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.staff) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const staffPermissions = req.staff.permissions || {};
        
        const hasPermission = permissions.some(permission => staffPermissions[permission]);
        
        if (!hasPermission) {
            return res.status(403).json({
                success: false,
                message: `Permission denied. Required one of: ${permissions.join(", ")}`,
            });
        }

        next();
    };
};

// All permissions middleware
const requireAllPermissions = (permissions) => {
    return (req, res, next) => {
        if (!req.staff) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }

        const staffPermissions = req.staff.permissions || {};
        
        const hasAllPermissions = permissions.every(permission => staffPermissions[permission]);
        
        if (!hasAllPermissions) {
            return res.status(403).json({
                success: false,
                message: `Permission denied. Required all: ${permissions.join(", ")}`,
            });
        }

        next();
    };
};

module.exports = {
    staffAuth,
    requirePortalAccess,
    requirePermission,
    requireAnyPermission,
    requireAllPermissions,
};