const express = require("express");
const { body } = require("express-validator");
const bookingController = require("../controllers/bookingController");
const { auth } = require("../middleware/auth");

const router = express.Router();

// Validation middleware
const validateBooking = [
    body("service_id").isInt().withMessage("Service ID must be a valid integer"),
    body("customer_id")
    .optional()
    .custom((value) => {
        if (value !== undefined && value !== null && value !== "") {
            return !isNaN(parseInt(value));
        }
        return true;
    })
    .withMessage("Customer ID must be a valid integer"),
    body("staff_id")
    .optional()
    .custom((value) => {
        if (value !== undefined && value !== null && value !== "") {
            return !isNaN(parseInt(value));
        }
        return true;
    })
    .withMessage("Staff ID must be a valid integer"),
    body("booking_date")
    .isDate()
    .withMessage("Booking date must be a valid date"),
    body("booking_time")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Booking time must be in HH:MM format"),
    body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer"),
    body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
    body("is_recurring")
    .optional()
    .isBoolean()
    .withMessage("is_recurring must be a boolean"),
    body("recurring_pattern")
    .optional()
    .isIn(["weekly", "biweekly", "monthly"])
    .withMessage("Recurring pattern must be weekly, biweekly, or monthly"),
    body("recurring_end_date")
    .optional()
    .isDate()
    .withMessage("Recurring end date must be a valid date"),
];

const validateBookingUpdate = [
    body("service_id")
    .optional()
    .custom((value) => {
        if (value !== undefined && value !== null && value !== "") {
            return !isNaN(parseInt(value));
        }
        return true;
    })
    .withMessage("Service ID must be a valid integer"),
    body("customer_id")
    .optional()
    .custom((value) => {
        if (value !== undefined && value !== null && value !== "") {
            return !isNaN(parseInt(value));
        }
        return true;
    })
    .withMessage("Customer ID must be a valid integer"),
    body("staff_id")
    .optional()
    .custom((value) => {
        if (value !== undefined && value !== null && value !== "") {
            return !isNaN(parseInt(value));
        }
        return true;
    })
    .withMessage("Staff ID must be a valid integer"),
    body("booking_date")
    .optional()
    .isDate()
    .withMessage("Booking date must be a valid date"),
    body("booking_time")
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Booking time must be in HH:MM format"),
    body("duration")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer"),
    body("price")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
    body("status")
    .optional()
    .isIn(["pending", "confirmed", "completed", "cancelled"])
    .withMessage("Invalid status"),
    body("payment_status")
    .optional()
    .isIn(["pending", "paid", "refunded"])
    .withMessage("Invalid payment status"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
];

const validateRecurringBooking = [
    body("service_id").isInt().withMessage("Service ID must be a valid integer"),
    body("customer_id")
    .isInt()
    .withMessage("Customer ID must be a valid integer"),
    body("staff_id").isInt().withMessage("Staff ID must be a valid integer"),
    body("start_date").isDate().withMessage("Start date must be a valid date"),
    body("start_time")
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage("Start time must be in HH:MM format"),
    body("duration")
    .isInt({ min: 1 })
    .withMessage("Duration must be a positive integer"),
    body("price")
    .isFloat({ min: 0 })
    .withMessage("Price must be a positive number"),
    body("recurring_pattern")
    .isIn(["weekly", "biweekly", "monthly"])
    .withMessage("Recurring pattern must be weekly, biweekly, or monthly"),
    body("recurring_end_date")
    .isDate()
    .withMessage("Recurring end date must be a valid date"),
    body("notes").optional().isString().withMessage("Notes must be a string"),
];

const validateNotification = [
    body("type")
    .isIn(["confirmation", "reminder", "cancellation"])
    .withMessage(
        "Notification type must be confirmation, reminder, or cancellation"
    ),
];

// Public routes (no authentication required)
router.post(
    "/customer",
    validateBooking,
    bookingController.createCustomerBooking
);
router.get("/staff-schedules", bookingController.getStaffSchedules);

// Protected routes (authentication required)
router.use(auth);

// Enhanced booking features (must come before /:id routes)
router.get("/time-slots", bookingController.getAvailableTimeSlots);
router.get("/check-conflicts", bookingController.checkConflicts);
router.get("/analytics", bookingController.getBookingAnalytics);
router.post(
    "/recurring",
    validateRecurringBooking,
    bookingController.createRecurringBooking
);

// Basic CRUD operations
router.get("/", bookingController.getBookings);
router.get("/:id", bookingController.getBooking);
router.post("/", validateBooking, bookingController.createBooking);
router.put("/:id", validateBookingUpdate, bookingController.updateBooking);
router.delete("/:id", bookingController.deleteBooking);
router.post(
    "/:id/notifications",
    validateNotification,
    bookingController.sendNotification
);

module.exports = router;