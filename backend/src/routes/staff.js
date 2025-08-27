const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { auth } = require("../middleware/auth");

// Public staff route (no authentication required)
router.get("/public", staffController.getPublicStaff);

// Staff management routes (for business owners)
router.get("/", auth, staffController.getStaff);
router.post("/", auth, staffController.createStaff);
router.get("/:id", auth, staffController.getStaffById);
router.put("/:id", auth, staffController.updateStaff);
router.delete("/:id", auth, staffController.deleteStaff);

// Staff session management
router.get("/sessions/all", auth, staffController.getStaffSessions);
router.post("/:id/logout", auth, staffController.forceLogoutStaff);
router.post("/:id/reset-password", auth, staffController.resetStaffPassword);

module.exports = router;