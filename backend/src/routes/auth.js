const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { auth } = require("../middleware/auth");
const { staffAuth } = require("../middleware/staffAuth");

// Client/Admin authentication routes
router.post(
    "/register",
    authController.registerValidation,
    authController.register
);
router.post("/login", authController.loginValidation, authController.login);
router.post("/logout", auth, authController.logout);
router.get("/profile", auth, authController.getProfile);
router.put("/profile", auth, authController.updateProfile);
router.post("/change-password", auth, authController.changePassword);

// Staff authentication routes
router.post(
    "/staff/login",
    authController.staffLoginValidation,
    authController.staffLogin
);
router.post("/staff/logout", staffAuth, authController.staffLogout);
router.get("/staff/profile", staffAuth, authController.getStaffProfile);

module.exports = router;