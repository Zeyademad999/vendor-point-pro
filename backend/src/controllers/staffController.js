const bcrypt = require("bcryptjs");
const { db } = require("../config/database");

// Get all staff for a client
const getStaff = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;

        const staff = await db("staff")
            .where({ client_id: clientId })
            .select(
                "id",
                "name",
                "email",
                "phone",
                "salary",
                "working_hours",
                "notes",
                "active",
                "hire_date",
                "username",
                "portal_access",
                "can_login",
                "permissions",
                "last_login",
                "created_at",
                "updated_at"
            )
            .orderBy("name");

        console.log(
            "Backend: Staff data being returned:",
            staff.map((s) => ({
                name: s.name,
                can_login: s.can_login,
                portal_access: s.portal_access,
            }))
        );
        res.json({
            success: true,
            data: staff,
        });
    } catch (error) {
        console.error("Get staff error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Create new staff member
const createStaff = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const {
            name,
            email,
            phone,
            salary,
            working_hours,
            notes,
            username,
            portal_access,
            can_login,
            password,
            permissions,
        } = req.body;

        // Validate required fields
        if (!name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Staff name is required",
            });
        }

        // Check if username is already taken (if provided)
        if (username) {
            const existingUsername = await db("staff").where({ username }).first();

            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Username already taken",
                });
            }
        }

        // Hash password if provided
        let hashedPassword = null;
        if (password && can_login) {
            const saltRounds = 12;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        // Default permissions based on portal access
        let defaultPermissions = {
            view_dashboard: true,
            manage_bookings: true,
            manage_customers: true,
            manage_products: true,
            manage_services: true,
            view_reports: true,
            pos_access: true,
            manage_staff: false,
            manage_settings: false,
        };

        // Set permissions based on portal access
        if (portal_access === "cashier") {
            defaultPermissions = {
                view_dashboard: true,
                manage_bookings: false,
                manage_customers: false,
                manage_products: false,
                manage_services: false,
                view_reports: false,
                pos_access: true,
                manage_staff: false,
                manage_settings: false,
            };
        } else if (portal_access === "admin") {
            defaultPermissions = {
                view_dashboard: true,
                manage_bookings: true,
                manage_customers: true,
                manage_products: true,
                manage_services: true,
                view_reports: true,
                pos_access: true,
                manage_staff: true,
                manage_settings: true,
            };
        } else if (portal_access === "all") {
            defaultPermissions = {
                view_dashboard: true,
                manage_bookings: true,
                manage_customers: true,
                manage_products: true,
                manage_services: true,
                view_reports: true,
                pos_access: true,
                manage_staff: true,
                manage_settings: true,
            };
        }

        // Merge with provided permissions
        const finalPermissions = {...defaultPermissions, ...permissions };

        const [staffId] = await db("staff").insert({
            client_id: clientId,
            name: name.trim(),
            email: (email && email.trim()) || null,
            phone: (phone && phone.trim()) || null,
            salary: parseFloat(salary) || 0,
            working_hours: (working_hours && working_hours.trim()) || null,
            notes: (notes && notes.trim()) || null,
            active: true,
            hire_date: new Date().toISOString().split("T")[0],
            username: (username && username.trim()) || null,
            portal_access: portal_access || "staff",
            can_login: can_login || false,
            password: hashedPassword,
            permissions: JSON.stringify(finalPermissions),
        });

        const newStaff = await db("staff")
            .where({ id: staffId })
            .select(
                "id",
                "name",
                "email",
                "phone",
                "salary",
                "working_hours",
                "notes",
                "active",
                "hire_date",
                "username",
                "portal_access",
                "can_login",
                "permissions",
                "created_at",
                "updated_at"
            )
            .first();

        res.status(201).json({
            success: true,
            message: "Staff member created successfully",
            data: newStaff,
        });
    } catch (error) {
        console.error("Create staff error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update staff member
const updateStaff = async(req, res) => {
    try {
        const clientId = req.user.id;
        const staffId = req.params.id;
        const {
            name,
            email,
            phone,
            salary,
            working_hours,
            notes,
            active,
            username,
            portal_access,
            can_login,
            password,
            permissions,
        } = req.body;

        // Check if staff belongs to client
        const existingStaff = await db("staff")
            .where({ id: staffId, client_id: clientId })
            .first();

        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found",
            });
        }

        // Validate required fields
        if (!name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Staff name is required",
            });
        }

        // Check if username is already taken by another staff member
        if (username && username !== existingStaff.username) {
            const existingUsername = await db("staff")
                .where({ username })
                .whereNot({ id: staffId })
                .first();

            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    message: "Username already taken",
                });
            }
        }

        // Hash password if provided
        let hashedPassword = existingStaff.password;
        if (password && can_login) {
            const saltRounds = 12;
            hashedPassword = await bcrypt.hash(password, saltRounds);
        }

        // Update permissions if portal access changed
        let finalPermissions = existingStaff.permissions ?
            JSON.parse(existingStaff.permissions) :
            {};

        if (portal_access && portal_access !== existingStaff.portal_access) {
            // Reset permissions based on new portal access
            let defaultPermissions = {
                view_dashboard: true,
                manage_bookings: false,
                manage_customers: false,
                manage_products: false,
                manage_services: false,
                view_reports: false,
                manage_staff: false,
                manage_settings: false,
                pos_access: false,
                admin_access: false,
            };

            if (portal_access === "cashier") {
                defaultPermissions = {
                    ...defaultPermissions,
                    pos_access: true,
                    manage_customers: true,
                    view_reports: true,
                };
            } else if (portal_access === "admin") {
                defaultPermissions = {
                    ...defaultPermissions,
                    manage_bookings: true,
                    manage_customers: true,
                    manage_products: true,
                    manage_services: true,
                    view_reports: true,
                    manage_staff: true,
                    manage_settings: true,
                    pos_access: true,
                    admin_access: true,
                };
            } else if (portal_access === "all") {
                defaultPermissions = {
                    view_dashboard: true,
                    manage_bookings: true,
                    manage_customers: true,
                    manage_products: true,
                    manage_services: true,
                    view_reports: true,
                    manage_staff: true,
                    manage_settings: true,
                    pos_access: true,
                    admin_access: true,
                };
            }

            finalPermissions = {...defaultPermissions, ...permissions };
        } else if (permissions) {
            finalPermissions = {...finalPermissions, ...permissions };
        }

        await db("staff")
            .where({ id: staffId, client_id: clientId })
            .update({
                name: name.trim(),
                email: (email && email.trim()) || null,
                phone: (phone && phone.trim()) || null,
                salary: parseFloat(salary) || 0,
                working_hours: (working_hours && working_hours.trim()) || null,
                notes: (notes && notes.trim()) || null,
                active: active !== undefined ? active : existingStaff.active,
                username: (username && username.trim()) || null,
                portal_access: portal_access || existingStaff.portal_access,
                can_login: can_login !== undefined ? can_login : existingStaff.can_login,
                password: hashedPassword,
                permissions: JSON.stringify(finalPermissions),
                updated_at: new Date(),
            });

        const updatedStaff = await db("staff")
            .where({ id: staffId })
            .select(
                "id",
                "name",
                "email",
                "phone",
                "salary",
                "working_hours",
                "notes",
                "active",
                "hire_date",
                "username",
                "portal_access",
                "can_login",
                "permissions",
                "created_at",
                "updated_at"
            )
            .first();

        res.json({
            success: true,
            message: "Staff member updated successfully",
            data: updatedStaff,
        });
    } catch (error) {
        console.error("Update staff error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Delete staff member
const deleteStaff = async(req, res) => {
    try {
        const clientId = req.user.id;
        const staffId = req.params.id;

        // Check if staff belongs to client
        const existingStaff = await db("staff")
            .where({ id: staffId, client_id: clientId })
            .first();

        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found",
            });
        }

        // Check if staff has active sessions
        const activeSessions = await db("staff_sessions")
            .where({ staff_id: staffId, active: true })
            .first();

        if (activeSessions) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete staff member with active sessions. Please log them out first.",
            });
        }

        await db("staff").where({ id: staffId, client_id: clientId }).del();

        res.json({
            success: true,
            message: "Staff member deleted successfully",
        });
    } catch (error) {
        console.error("Delete staff error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get staff member by ID
const getStaffById = async(req, res) => {
    try {
        const clientId = req.user.id;
        const staffId = req.params.id;

        const staff = await db("staff")
            .where({ id: staffId, client_id: clientId })
            .select(
                "id",
                "name",
                "email",
                "phone",
                "salary",
                "working_hours",
                "notes",
                "active",
                "hire_date",
                "username",
                "portal_access",
                "can_login",
                "permissions",
                "last_login",
                "created_at",
                "updated_at"
            )
            .first();

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found",
            });
        }

        res.json({
            success: true,
            data: staff,
        });
    } catch (error) {
        console.error("Get staff by ID error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Reset staff password
const resetStaffPassword = async(req, res) => {
    try {
        const clientId = req.user.id;
        const staffId = req.params.id;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters",
            });
        }

        // Check if staff belongs to client
        const existingStaff = await db("staff")
            .where({ id: staffId, client_id: clientId })
            .first();

        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found",
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password and invalidate existing sessions
        await db("staff").where({ id: staffId, client_id: clientId }).update({
            password: hashedPassword,
            login_token: null,
            updated_at: new Date(),
        });

        // Invalidate all active sessions for this staff member
        await db("staff_sessions")
            .where({ staff_id: staffId, active: true })
            .update({ active: false });

        res.json({
            success: true,
            message: "Staff password reset successfully",
        });
    } catch (error) {
        console.error("Reset staff password error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get public staff list for customer booking (no authentication required)
const getPublicStaff = async(req, res) => {
    try {
        const { client_id } = req.query;

        if (!client_id) {
            return res.status(400).json({
                success: false,
                message: "Client ID is required",
            });
        }

        const staff = await db("staff")
            .select("id", "name", "active")
            .where({ client_id: parseInt(client_id), active: true })
            .orderBy("name", "asc");

        res.json({
            success: true,
            data: staff,
        });
    } catch (error) {
        console.error("Error fetching public staff:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch staff",
        });
    }
};

// Get staff sessions
const getStaffSessions = async(req, res) => {
    try {
        const clientId = req.user.id;

        const sessions = await db("staff_sessions")
            .select("staff_sessions.*", "staff.name as staff_name", "staff.username")
            .join("staff", "staff_sessions.staff_id", "staff.id")
            .where({ "staff_sessions.client_id": clientId })
            .orderBy("staff_sessions.created_at", "desc");

        res.json({
            success: true,
            data: sessions,
        });
    } catch (error) {
        console.error("Get staff sessions error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Logout staff member (force logout)
const forceLogoutStaff = async(req, res) => {
    try {
        const clientId = req.user.id;
        const staffId = req.params.id;

        // Check if staff belongs to client
        const existingStaff = await db("staff")
            .where({ id: staffId, client_id: clientId })
            .first();

        if (!existingStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff member not found",
            });
        }

        // Invalidate all active sessions for this staff member
        await db("staff_sessions")
            .where({ staff_id: staffId, active: true })
            .update({ active: false });

        // Clear login token
        await db("staff")
            .where({ id: staffId, client_id: clientId })
            .update({ login_token: null });

        res.json({
            success: true,
            message: "Staff member logged out successfully",
        });
    } catch (error) {
        console.error("Force logout staff error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    getStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    getStaffById,
    getPublicStaff,
    resetStaffPassword,
    getStaffSessions,
    forceLogoutStaff,
};