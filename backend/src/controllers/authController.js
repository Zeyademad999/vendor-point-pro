const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/database");
const config = require("../config/config");
const { body, validationResult } = require("express-validator");

// Validation rules
const registerValidation = [
    body("name")
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage("Name must be between 2 and 255 characters"),
    body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
    body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
    body("phone")
    .optional()
    .isMobilePhone()
    .withMessage("Valid phone number is required"),
    body("subdomain")
    .optional()
    .isAlphanumeric()
    .isLength({ min: 3, max: 50 })
    .withMessage("Subdomain must be 3-50 alphanumeric characters"),
];

const loginValidation = [
    body("email").notEmpty().withMessage("Email or username is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

// Staff login validation
const staffLoginValidation = [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

// Helper function to log portal access
const logPortalAccess = async(
    userId,
    staffId,
    portal,
    action,
    req,
    details = {}
) => {
    try {
        await db("portal_access_logs").insert({
            user_id: userId,
            staff_id: staffId,
            portal,
            action,
            ip_address: req.ip,
            user_agent: req.get("User-Agent"),
            details: JSON.stringify(details),
        });
    } catch (error) {
        console.error("Error logging portal access:", error);
    }
};

// Register new user
const register = async(req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const { name, email, password, phone, subdomain, businessType } = req.body;

        // Check if email already exists
        const existingUser = await db("users").where({ email }).first();
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Email already registered",
            });
        }

        // Check if subdomain is available (if provided)
        if (subdomain) {
            const existingSubdomain = await db("users").where({ subdomain }).first();
            if (existingSubdomain) {
                return res.status(400).json({
                    success: false,
                    message: "Subdomain already taken",
                });
            }
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user
        const [userId] = await db("users").insert({
            name,
            email,
            password: hashedPassword,
            phone,
            subdomain: subdomain || null,
            role: "client",
            status: "trial",
            trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
            settings: JSON.stringify({
                businessType,
                currency: "EGP",
                timezone: "Africa/Cairo",
                language: "en",
            }),
        });

        // Get the created user (without password)
        const user = await db("users")
            .select(
                "id",
                "name",
                "email",
                "phone",
                "role",
                "status",
                "subdomain",
                "settings"
            )
            .where({ id: userId })
            .first();

        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role },
            config.jwt.secret, { expiresIn: config.jwt.expiresIn }
        );

        // Log portal access
        await logPortalAccess(user.id, null, "admin", "login", req, {
            registration: true,
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user,
                token,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Login user (supports business owners and staff/cashier)
const login = async(req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const { email, password } = req.body;

        // First, try to find a business owner/client by email
        let user = await db("users").where({ email }).first();

        if (user) {
            // Check password for business owner
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Check if account is active
            if (user.status !== "active" && user.status !== "trial") {
                return res.status(401).json({
                    success: false,
                    message: "Account is not active. Please contact support.",
                });
            }

            // Generate JWT token for business owner
            const token = jwt.sign({
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                },
                config.jwt.secret, { expiresIn: config.jwt.expiresIn }
            );

            // Remove password from response
            const { password: _, ...userWithoutPassword } = user;

            // Log portal access
            await logPortalAccess(user.id, null, "admin", "login", req);

            return res.json({
                success: true,
                message: "Login successful",
                data: {
                    user: userWithoutPassword,
                    token,
                },
            });
        }

        // If no business owner found, check for staff/cashier
        console.log("Checking for staff with username:", email);

        // First, let's check if the staff exists at all
        const allStaff = await db("staff")
            .select("id", "username", "name")
            .where("username", "LIKE", "%sayed%");
        console.log("All staff with 'sayed' in username:", allStaff);

        const staff = await db("staff")
            .select("staff.*", "users.name as business_name", "users.subdomain")
            .join("users", "staff.client_id", "users.id")
            .where({ "staff.username": email }) // Use email field as username
            .first();

        console.log("Staff found:", staff ? "Yes" : "No");
        if (staff) {
            console.log("Staff details:", {
                id: staff.id,
                name: staff.name,
                username: staff.username,
                can_login: staff.can_login,
                portal_access: staff.portal_access,
                active: staff.active,
                business_name: staff.business_name,
                password_hash: staff.password ? "EXISTS" : "MISSING",
            });
        } else {
            console.log("No staff found with username:", email);
        }

        if (staff) {
            // Check password for staff
            console.log("Checking password for staff");
            console.log("Input password:", password);
            console.log("Stored password hash:", staff.password);
            const isPasswordValid = await bcrypt.compare(password, staff.password);
            console.log("Password valid:", isPasswordValid);
            if (!isPasswordValid) {
                console.log("Login denied: invalid password");
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password",
                });
            }

            // Check if staff can login
            console.log("Checking can_login:", staff.can_login);
            if (!staff.can_login) {
                console.log("Login denied: can_login is false");
                return res.status(401).json({
                    success: false,
                    message: "Login access not enabled for this account",
                });
            }

            // Create user object for staff
            const staffUser = {
                id: staff.id,
                name: staff.name,
                email: staff.username, // Use username as email
                phone: staff.phone,
                role: staff.portal_access || "staff",
                status: staff.active ? "active" : "suspended",
                business_id: staff.client_id,
                business_name: staff.business_name,
                portal_access: staff.portal_access,
                created_at: staff.created_at,
                updated_at: staff.updated_at,
            };

            // Generate JWT token for staff
            const token = jwt.sign({
                    userId: staff.id,
                    email: staff.username,
                    role: staff.portal_access || "staff",
                    businessId: staff.client_id,
                },
                config.jwt.secret, { expiresIn: config.jwt.expiresIn }
            );

            // Log portal access
            await logPortalAccess(
                staff.client_id,
                staff.id,
                staff.portal_access || "staff",
                "login",
                req
            );

            console.log("Staff login successful, sending response");
            console.log("Staff user object:", staffUser);
            return res.json({
                success: true,
                message: "Login successful",
                data: {
                    user: staffUser,
                    token,
                },
            });
        }

        // If neither found, return error
        return res.status(401).json({
            success: false,
            message: "Invalid email or password",
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Staff login
const staffLogin = async(req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const { username, password } = req.body;

        // Find staff by username
        const staff = await db("staff")
            .select("staff.*", "users.name as business_name", "users.subdomain")
            .join("users", "staff.client_id", "users.id")
            .where({ "staff.username": username })
            .first();

        if (!staff) {
            await logPortalAccess(null, null, "staff", "access_denied", req, {
                reason: "invalid_username",
            });
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        // Check if staff can login
        if (!staff.can_login) {
            await logPortalAccess(null, staff.id, "staff", "access_denied", req, {
                reason: "login_disabled",
            });
            return res.status(401).json({
                success: false,
                message: "Login access is disabled for this account",
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, staff.password);
        if (!isPasswordValid) {
            await logPortalAccess(null, staff.id, "staff", "access_denied", req, {
                reason: "invalid_password",
            });
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }

        // Check if staff is active
        if (!staff.active) {
            await logPortalAccess(null, staff.id, "staff", "access_denied", req, {
                reason: "inactive_staff",
            });
            return res.status(401).json({
                success: false,
                message: "Account is inactive. Please contact your manager.",
            });
        }

        // Generate JWT token for staff
        const token = jwt.sign({
                staffId: staff.id,
                clientId: staff.client_id,
                username: staff.username,
                portalAccess: staff.portal_access,
            },
            config.jwt.secret, { expiresIn: "8h" } // Staff tokens expire in 8 hours
        );

        // Update last login
        await db("staff").where({ id: staff.id }).update({
            last_login: new Date(),
            login_token: token,
        });

        // Note: Session tracking can be added later for enhanced security

        // Log successful login
        await logPortalAccess(
            staff.client_id,
            staff.id,
            staff.portal_access,
            "login",
            req
        );

        // Remove sensitive data from response
        const { password: _, login_token: __, ...staffWithoutSensitive } = staff;

        res.json({
            success: true,
            message: "Staff login successful",
            data: {
                staff: staffWithoutSensitive,
                business: {
                    id: staff.client_id,
                    name: staff.business_name,
                    subdomain: staff.subdomain,
                },
                token,
            },
        });
    } catch (error) {
        console.error("Staff login error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Staff logout
const staffLogout = async(req, res) => {
    try {
        const staffId = req.staff && req.staff.id;
        const token =
            req.headers.authorization &&
            req.headers.authorization.replace("Bearer ", "");

        if (token && staffId) {
            // Clear login token
            await db("staff").where({ id: staffId }).update({ login_token: null });
        }

        // Log logout
        if (staffId) {
            await logPortalAccess(
                req.staff && req.staff.client_id,
                staffId,
                (req.staff && req.staff.portal_access) || "staff",
                "logout",
                req
            );
        }

        res.json({
            success: true,
            message: "Staff logged out successfully",
        });
    } catch (error) {
        console.error("Staff logout error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get current user profile
const getProfile = async(req, res) => {
    try {
        const { password, ...userWithoutPassword } = req.user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Get staff profile
const getStaffProfile = async(req, res) => {
    try {
        const staff = await db("staff")
            .select("staff.*", "users.name as business_name", "users.subdomain")
            .join("users", "staff.client_id", "users.id")
            .where({ "staff.id": req.staff.id })
            .first();

        if (!staff) {
            return res.status(404).json({
                success: false,
                message: "Staff profile not found",
            });
        }

        // Remove sensitive data
        const { password, login_token, ...staffWithoutSensitive } = staff;

        res.json({
            success: true,
            data: {
                staff: staffWithoutSensitive,
                business: {
                    id: staff.client_id,
                    name: staff.business_name,
                    subdomain: staff.subdomain,
                },
            },
        });
    } catch (error) {
        console.error("Get staff profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update user profile
const updateProfile = async(req, res) => {
    try {
        const { name, phone, settings } = req.body;
        const userId = req.user.id;

        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (settings) updateData.settings = JSON.stringify(settings);

        await db("users")
            .where({ id: userId })
            .update({
                ...updateData,
                updated_at: new Date(),
            });

        // Get updated user
        const updatedUser = await db("users")
            .select(
                "id",
                "name",
                "email",
                "phone",
                "role",
                "status",
                "subdomain",
                "settings"
            )
            .where({ id: userId })
            .first();

        res.json({
            success: true,
            message: "Profile updated successfully",
            data: {
                user: updatedUser,
            },
        });
    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Change password
const changePassword = async(req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Get current user with password
        const user = await db("users").where({ id: userId }).first();

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect",
            });
        }

        // Hash new password
        const saltRounds = 12;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await db("users").where({ id: userId }).update({
            password: hashedNewPassword,
            updated_at: new Date(),
        });

        res.json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Logout (client-side token removal)
const logout = async(req, res) => {
    try {
        // Log logout
        await logPortalAccess(
            req.user && req.user.id,
            null,
            "admin",
            "logout",
            req
        );

        res.json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Logout error:", error);
        res.json({
            success: true,
            message: "Logged out successfully",
        });
    }
};

module.exports = {
    register,
    login,
    staffLogin,
    staffLogout,
    getProfile,
    getStaffProfile,
    updateProfile,
    changePassword,
    logout,
    registerValidation,
    loginValidation,
    staffLoginValidation,
};