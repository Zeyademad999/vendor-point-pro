const express = require("express");
const { body } = require("express-validator");
const clientController = require("../controllers/clientController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Validation middleware for client registration
const validateClientRegistration = [
    body("businessName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Business name must be between 2 and 100 characters"),
    body("ownerName")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Owner name must be between 2 and 100 characters"),
    body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Must be a valid email address"),
    body("phone")
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters"),
    body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
    body("businessType")
    .isIn(["retail", "salon", "clinic", "restaurant", "gym", "other"])
    .withMessage("Invalid business type"),
    body("subdomain")
    .trim()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-z0-9-]+$/)
    .withMessage(
        "Subdomain must be 3-20 characters, lowercase letters, numbers, and hyphens only"
    ),
    body("plan")
    .isIn(["starter", "professional", "enterprise"])
    .withMessage("Invalid plan selection"),
];

// Public routes
router.post(
    "/register",
    validateClientRegistration,
    clientController.registerClient
);
router.get("/website/:subdomain", clientController.getWebsiteConfig);

// Protected routes (require authentication)
router.get("/dashboard", auth, clientController.getClientDashboard);
router.get("/portals", auth, clientController.getClientPortals);
router.get("/website-settings", auth, clientController.getWebsiteSettings);
router.put("/website-settings", auth, clientController.updateWebsiteSettings);

module.exports = router;