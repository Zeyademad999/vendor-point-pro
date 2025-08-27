const { db } = require("../config/database");
const { validationResult } = require("express-validator");

// Get all bookings with filters
const getBookings = async(req, res) => {
    try {
        // For staff members, use business_id; for business owners, use id
        const clientId = req.user.business_id || req.user.id;
        const {
            page = 1,
                limit = 10,
                search = "",
                status = "",
                date = "",
                staff_id = "",
                customer_id = "",
                start_date = "",
                end_date = "",
        } = req.query;

        let query = db("bookings")
            .select(
                "bookings.*",
                "customers.name as customer_name",
                "customers.phone as customer_phone",
                "customers.email as customer_email",
                "services.name as service_name",
                "services.duration as service_duration",
                "staff.name as staff_name"
            )
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .leftJoin("services", "bookings.service_id", "services.id")
            .leftJoin("staff", "bookings.staff_id", "staff.id")
            .where("bookings.client_id", clientId);

        // Apply filters
        if (search) {
            query = query.where(function() {
                this.where("customers.name", "like", `%${search}%`)
                    .orWhere("services.name", "like", `%${search}%`)
                    .orWhere("staff.name", "like", `%${search}%`);
            });
        }

        if (status) {
            query = query.where("bookings.status", status);
        }

        if (date) {
            query = query.where("bookings.booking_date", date);
        }

        if (start_date && end_date) {
            query = query.whereBetween("bookings.booking_date", [
                start_date,
                end_date,
            ]);
        }

        if (staff_id) {
            query = query.where("bookings.staff_id", staff_id);
        }

        if (customer_id) {
            query = query.where("bookings.customer_id", customer_id);
        }

        // Get total count for pagination
        const totalQuery = query.clone();
        const total = await totalQuery.count("* as count").first();

        // Apply pagination and ordering
        const offset = (page - 1) * limit;
        const bookings = await query
            .orderBy("bookings.booking_date", "desc")
            .orderBy("bookings.booking_time", "asc")
            .limit(limit)
            .offset(offset);

        const totalPages = Math.ceil(total.count / limit);

        res.json({
            success: true,
            data: bookings,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: total.count,
                totalPages,
            },
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
};

// Get available time slots for a specific date and service
const getAvailableTimeSlots = async(req, res) => {
    try {
        const clientId = req.user.id;
        const { date, service_id, staff_id } = req.query;

        if (!date || !service_id) {
            return res.status(400).json({
                success: false,
                message: "Date and service_id are required",
            });
        }

        // Get service duration
        const service = await db("services")
            .select("duration")
            .where({ id: service_id, client_id: clientId })
            .first();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        // Get staff working hours (default 9 AM to 6 PM if not specified)
        const workingHours = {
            start: "09:00",
            end: "18:00",
        };

        // Generate time slots (30-minute intervals)
        const slots = [];
        const startTime = new Date(`2000-01-01T${workingHours.start}`);
        const endTime = new Date(`2000-01-01T${workingHours.end}`);
        const slotDuration = 30; // minutes

        for (
            let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)
        ) {
            const slotStart = time.toTimeString().slice(0, 5);
            const slotEnd = new Date(time.getTime() + slotDuration * 60000)
                .toTimeString()
                .slice(0, 5);

            // Check if this slot conflicts with existing bookings
            const conflictingBookings = await db("bookings")
                .where({
                    client_id: clientId,
                    booking_date: date,
                    status: ["confirmed", "pending"],
                })
                .where(function() {
                    this.where("booking_time", "<=", slotStart)
                        .andWhere("booking_time", ">", slotStart)
                        .orWhere("booking_time", "<", slotEnd)
                        .andWhere("booking_time", ">=", slotStart);
                });

            const isAvailable = conflictingBookings.length === 0;

            slots.push({
                id: slots.length + 1,
                start_time: slotStart,
                end_time: slotEnd,
                is_available: isAvailable,
            });
        }

        res.json({
            success: true,
            data: slots,
        });
    } catch (error) {
        console.error("Error fetching time slots:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch time slots",
            error: error.message,
        });
    }
};

// Get staff schedules
const getStaffSchedules = async(req, res) => {
    try {
        // For testing purposes, use a default clientId if not authenticated
        let clientId;
        if (!req.user || !req.user.id) {
            // Use client 3 (blankk) for testing when not authenticated
            clientId = 3;
            console.log("No authentication, using default clientId:", clientId);
        } else {
            clientId = req.user.id;
        }

        const { date } = req.query;

        console.log(
            "getStaffSchedules called with clientId:",
            clientId,
            "date:",
            date
        );

        // Get all staff for this client
        const staff = await db("staff")
            .select("id", "name", "working_hours")
            .where({ client_id: clientId, active: true });

        console.log("Found staff:", staff);

        const schedules = [];

        for (const staffMember of staff) {
            console.log(
                "Processing staff member:",
                staffMember.name,
                "ID:",
                staffMember.id
            );
            console.log("Raw working_hours from DB:", staffMember.working_hours);

            // Get staff's working hours from the database
            let workingHours = [];
            try {
                if (staffMember.working_hours) {
                    workingHours = JSON.parse(staffMember.working_hours);
                    console.log(
                        "Parsed working hours for",
                        staffMember.name,
                        ":",
                        workingHours
                    );
                }
            } catch (error) {
                console.error(
                    "Error parsing working hours for staff",
                    staffMember.id,
                    ":",
                    error
                );
            }

            // If no working hours set, use default
            if (!workingHours || workingHours.length === 0) {
                console.log("Using default working hours for", staffMember.name);
                workingHours = [{
                        day: "monday",
                        start_time: "09:00",
                        end_time: "18:00",
                        is_working: true,
                    },
                    {
                        day: "tuesday",
                        start_time: "09:00",
                        end_time: "18:00",
                        is_working: true,
                    },
                    {
                        day: "wednesday",
                        start_time: "09:00",
                        end_time: "18:00",
                        is_working: true,
                    },
                    {
                        day: "thursday",
                        start_time: "09:00",
                        end_time: "18:00",
                        is_working: true,
                    },
                    {
                        day: "friday",
                        start_time: "09:00",
                        end_time: "18:00",
                        is_working: true,
                    },
                    {
                        day: "saturday",
                        start_time: "09:00",
                        end_time: "17:00",
                        is_working: true,
                    },
                    {
                        day: "sunday",
                        start_time: "10:00",
                        end_time: "16:00",
                        is_working: false,
                    },
                ];
            }

            // Get staff's bookings for the specified date
            const bookings = await db("bookings")
                .select("booking_time", "duration")
                .where({
                    client_id: clientId,
                    staff_id: staffMember.id,
                    booking_date: date,
                    status: ["confirmed", "pending"],
                });

            // Generate available slots
            const availableSlots = [];
            const dayNames = [
                "sunday",
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
            ];
            const dayOfWeek = dayNames[new Date(date).getDay()];
            const workingDay = workingHours.find((h) => h.day === dayOfWeek);

            if (workingDay && workingDay.is_working) {
                const startTime = new Date(`2000-01-01T${workingDay.start_time}`);
                const endTime = new Date(`2000-01-01T${workingDay.end_time}`);
                const slotDuration = 30;

                for (
                    let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + slotDuration)
                ) {
                    const slotStart = time.toTimeString().slice(0, 5);
                    const slotEnd = new Date(time.getTime() + slotDuration * 60000)
                        .toTimeString()
                        .slice(0, 5);

                    // Check if slot conflicts with existing bookings
                    const hasConflict = bookings.some((booking) => {
                        const bookingStart = booking.booking_time;
                        const bookingEnd = new Date(`2000-01-01T${bookingStart}`);
                        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.duration);
                        const bookingEndStr = bookingEnd.toTimeString().slice(0, 5);

                        return (
                            (slotStart >= bookingStart && slotStart < bookingEndStr) ||
                            (slotEnd > bookingStart && slotEnd <= bookingEndStr)
                        );
                    });

                    availableSlots.push({
                        id: availableSlots.length + 1,
                        start_time: slotStart,
                        end_time: slotEnd,
                        is_available: !hasConflict,
                        staff_id: staffMember.id,
                    });
                }
            }

            schedules.push({
                staff_id: staffMember.id,
                staff_name: staffMember.name,
                working_hours: workingHours,
                available_slots: availableSlots,
            });
        }

        console.log("Sending response with schedules:", schedules);
        res.json({
            success: true,
            data: schedules,
        });
    } catch (error) {
        console.error("Error fetching staff schedules:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            success: false,
            message: "Failed to fetch staff schedules",
            error: error.message,
        });
    }
};

// Create recurring booking
const createRecurringBooking = async(req, res) => {
    try {
        const clientId = req.user.id;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const {
            service_id,
            customer_id,
            staff_id,
            start_date,
            start_time,
            duration,
            price,
            recurring_pattern,
            recurring_end_date,
            notes,
        } = req.body;

        // Validate recurring pattern
        if (!["weekly", "biweekly", "monthly"].includes(recurring_pattern)) {
            return res.status(400).json({
                success: false,
                message: "Invalid recurring pattern",
            });
        }

        const createdBookings = [];
        let currentDate = new Date(start_date);
        const endDate = new Date(recurring_end_date);

        while (currentDate <= endDate) {
            const bookingData = {
                client_id: clientId,
                service_id,
                customer_id,
                staff_id,
                booking_date: currentDate.toISOString().split("T")[0],
                booking_time: start_time,
                duration,
                price,
                status: "pending",
                payment_status: "pending",
                notes,
                is_recurring: true,
                recurring_pattern,
                recurring_end_date,
                parent_booking_id: createdBookings.length === 0 ? null : createdBookings[0].id,
            };

            const [bookingId] = await db("bookings").insert(bookingData);
            const booking = await db("bookings")
                .select(
                    "bookings.*",
                    "customers.name as customer_name",
                    "services.name as service_name",
                    "staff.name as staff_name"
                )
                .leftJoin("customers", "bookings.customer_id", "customers.id")
                .leftJoin("services", "bookings.service_id", "services.id")
                .leftJoin("staff", "bookings.staff_id", "staff.id")
                .where("bookings.id", bookingId)
                .first();

            createdBookings.push(booking);

            // Calculate next date based on pattern
            switch (recurring_pattern) {
                case "weekly":
                    currentDate.setDate(currentDate.getDate() + 7);
                    break;
                case "biweekly":
                    currentDate.setDate(currentDate.getDate() + 14);
                    break;
                case "monthly":
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    break;
            }
        }

        res.json({
            success: true,
            message: `Created ${createdBookings.length} recurring bookings`,
            data: createdBookings,
        });
    } catch (error) {
        console.error("Error creating recurring booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create recurring booking",
            error: error.message,
        });
    }
};

// Send booking notification
const sendNotification = async(req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;
        const { type } = req.body;

        if (!["confirmation", "reminder", "cancellation"].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid notification type",
            });
        }

        // Get booking details
        const booking = await db("bookings")
            .select(
                "bookings.*",
                "customers.name as customer_name",
                "customers.email as customer_email",
                "customers.phone as customer_phone",
                "services.name as service_name",
                "staff.name as staff_name"
            )
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .leftJoin("services", "bookings.service_id", "services.id")
            .leftJoin("staff", "bookings.staff_id", "staff.id")
            .where({ "bookings.id": id, "bookings.client_id": clientId })
            .first();

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        // TODO: Implement actual email/SMS sending
        // For now, just log the notification
        console.log(`Sending ${type} notification for booking ${id}:`, {
            customer: booking.customer_name,
            email: booking.customer_email,
            phone: booking.customer_phone,
            service: booking.service_name,
            date: booking.booking_date,
            time: booking.booking_time,
        });

        res.json({
            success: true,
            message: `${type} notification sent successfully`,
        });
    } catch (error) {
        console.error("Error sending notification:", error);
        res.status(500).json({
            success: false,
            message: "Failed to send notification",
            error: error.message,
        });
    }
};

// Check booking conflicts
const checkConflicts = async(req, res) => {
    try {
        const clientId = req.user.id;
        const { date, time, duration, staff_id } = req.query;

        if (!date || !time || !duration) {
            return res.status(400).json({
                success: false,
                message: "Date, time, and duration are required",
            });
        }

        const startTime = new Date(`2000-01-01T${time}`);
        const endTime = new Date(startTime.getTime() + duration * 60000);
        const endTimeStr = endTime.toTimeString().slice(0, 5);

        let query = db("bookings").where({
            client_id: clientId,
            booking_date: date,
            status: ["confirmed", "pending"],
        });

        if (staff_id) {
            query = query.where("staff_id", staff_id);
        }

        const conflicts = await query.where(function() {
            this.where("booking_time", "<", endTimeStr)
                .andWhere("booking_time", ">=", time)
                .orWhere("booking_time", "<=", time)
                .andWhere("booking_time", ">", time);
        });

        res.json({
            success: true,
            data: {
                has_conflicts: conflicts.length > 0,
                conflicts,
            },
        });
    } catch (error) {
        console.error("Error checking conflicts:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check conflicts",
            error: error.message,
        });
    }
};

// Get single booking by ID
const getBooking = async(req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const booking = await db("bookings")
            .select(
                "bookings.*",
                "customers.name as customer_name",
                "customers.phone as customer_phone",
                "customers.email as customer_email",
                "services.name as service_name",
                "services.duration as service_duration",
                "staff.name as staff_name"
            )
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .leftJoin("services", "bookings.service_id", "services.id")
            .leftJoin("staff", "bookings.staff_id", "staff.id")
            .where({ "bookings.id": id, "bookings.client_id": clientId })
            .first();

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        res.json({
            success: true,
            data: booking,
        });
    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking",
            error: error.message,
        });
    }
};

// Create new booking
const createBooking = async(req, res) => {
    try {
        const clientId = req.user.id;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const {
            service_id,
            customer_id,
            staff_id,
            booking_date,
            booking_time,
            duration,
            price,
            notes,
            is_recurring,
            recurring_pattern,
            recurring_end_date,
        } = req.body;

        const bookingData = {
            client_id: clientId,
            service_id,
            customer_id: customer_id || null,
            staff_id: staff_id || null,
            booking_date,
            booking_time,
            duration,
            price,
            status: "pending",
            payment_status: "pending",
            notes,
            is_recurring: is_recurring || false,
            recurring_pattern: recurring_pattern || null,
            recurring_end_date: recurring_end_date || null,
        };

        const [bookingId] = await db("bookings").insert(bookingData);

        const booking = await db("bookings")
            .select(
                "bookings.*",
                "customers.name as customer_name",
                "customers.phone as customer_phone",
                "customers.email as customer_email",
                "services.name as service_name",
                "services.duration as service_duration",
                "staff.name as staff_name"
            )
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .leftJoin("services", "bookings.service_id", "services.id")
            .leftJoin("staff", "bookings.staff_id", "staff.id")
            .where("bookings.id", bookingId)
            .first();

        res.json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message,
        });
    }
};

// Update booking
const updateBooking = async(req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const {
            service_id,
            customer_id,
            staff_id,
            booking_date,
            booking_time,
            duration,
            price,
            status,
            payment_status,
            notes,
        } = req.body;

        const updateData = {
            service_id,
            customer_id: customer_id || null,
            staff_id: staff_id || null,
            booking_date,
            booking_time,
            duration,
            price,
            status,
            payment_status,
            notes,
            updated_at: new Date(),
        };

        const updated = await db("bookings")
            .where({ id, client_id: clientId })
            .update(updateData);

        if (!updated) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        const booking = await db("bookings")
            .select(
                "bookings.*",
                "customers.name as customer_name",
                "customers.phone as customer_phone",
                "customers.email as customer_email",
                "services.name as service_name",
                "services.duration as service_duration",
                "staff.name as staff_name"
            )
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .leftJoin("services", "bookings.service_id", "services.id")
            .leftJoin("staff", "bookings.staff_id", "staff.id")
            .where("bookings.id", id)
            .first();

        res.json({
            success: true,
            message: "Booking updated successfully",
            data: booking,
        });
    } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update booking",
            error: error.message,
        });
    }
};

// Delete booking
const deleteBooking = async(req, res) => {
    try {
        const clientId = req.user.id;
        const { id } = req.params;

        const deleted = await db("bookings")
            .where({ id, client_id: clientId })
            .del();

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        res.json({
            success: true,
            message: "Booking deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete booking",
            error: error.message,
        });
    }
};

// Get booking analytics
const getBookingAnalytics = async(req, res) => {
    try {
        const clientId = req.user.id;
        const { period = "month" } = req.query;

        let dateFilter = "";
        switch (period) {
            case "week":
                dateFilter = "AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
                break;
            case "month":
                dateFilter = "AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
                break;
            case "year":
                dateFilter = "AND booking_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
                break;
        }

        // Get total bookings
        const totalBookings = await db("bookings")
            .where("client_id", clientId)
            .count("* as count")
            .first();

        // Get confirmed bookings
        const confirmedBookings = await db("bookings")
            .where({ client_id: clientId, status: "confirmed" })
            .count("* as count")
            .first();

        // Get total revenue
        const totalRevenue = await db("bookings")
            .where({ client_id: clientId, payment_status: "paid" })
            .sum("price as total")
            .first();

        // Get bookings by status
        const bookingsByStatus = await db("bookings")
            .select("status")
            .count("* as count")
            .where("client_id", clientId)
            .groupBy("status");

        // Get top services
        const topServices = await db("bookings")
            .select(
                "services.name",
                db.raw("COUNT(*) as count"),
                db.raw("SUM(bookings.price) as revenue")
            )
            .leftJoin("services", "bookings.service_id", "services.id")
            .where("bookings.client_id", clientId)
            .groupBy("services.id", "services.name")
            .orderBy("count", "desc")
            .limit(5);

        // Get new bookings this month
        const newBookingsThisMonth = await db("bookings")
            .where("client_id", clientId)
            .where("created_at", ">=", new Date().toISOString().slice(0, 7) + "-01")
            .count("* as count")
            .first();

        const confirmationRate =
            totalBookings.count > 0 ?
            ((confirmedBookings.count / totalBookings.count) * 100).toFixed(1) +
            "%" :
            "0%";

        res.json({
            success: true,
            data: {
                totalBookings: totalBookings.count,
                confirmedBookings: confirmedBookings.count,
                totalRevenue: totalRevenue.total || 0,
                confirmationRate,
                bookingsByStatus,
                topServices,
                newBookingsThisMonth: newBookingsThisMonth.count,
            },
        });
    } catch (error) {
        console.error("Error fetching booking analytics:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking analytics",
            error: error.message,
        });
    }
};

// Create customer booking from website (public endpoint)
const createCustomerBooking = async(req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: errors.array(),
            });
        }

        const {
            service_id,
            customer_name,
            customer_email,
            customer_phone,
            booking_date,
            booking_time,
            notes,
            client_id,
            staff_preference,
            staff_id,
        } = req.body;

        // First, create or find customer
        let customerId;
        const existingCustomer = await db("customers")
            .where({ email: customer_email, client_id })
            .first();

        if (existingCustomer) {
            customerId = existingCustomer.id;
            // Update customer info if needed
            await db("customers").where("id", customerId).update({
                name: customer_name,
                phone: customer_phone,
                updated_at: new Date(),
            });
        } else {
            const [newCustomerId] = await db("customers").insert({
                client_id,
                name: customer_name,
                email: customer_email,
                phone: customer_phone,
                status: "active",
            });
            customerId = newCustomerId;
        }

        // Get service details
        const service = await db("services")
            .select("duration", "price")
            .where({ id: service_id, client_id })
            .first();

        if (!service) {
            return res.status(404).json({
                success: false,
                message: "Service not found",
            });
        }

        // Create booking
        const bookingData = {
            client_id,
            service_id,
            customer_id: customerId,
            booking_date,
            booking_time,
            duration: service.duration,
            price: service.price,
            status: "pending",
            payment_status: "pending",
            notes,
            staff_preference: staff_preference || "any",
            staff_id: staff_preference === "specific" && staff_id ? staff_id : null,
        };

        const [bookingId] = await db("bookings").insert(bookingData);

        const booking = await db("bookings")
            .select(
                "bookings.*",
                "customers.name as customer_name",
                "customers.phone as customer_phone",
                "customers.email as customer_email",
                "services.name as service_name",
                "services.duration as service_duration"
            )
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .leftJoin("services", "bookings.service_id", "services.id")
            .where("bookings.id", bookingId)
            .first();

        res.json({
            success: true,
            message: "Booking created successfully",
            data: booking,
        });
    } catch (error) {
        console.error("Error creating customer booking:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create booking",
            error: error.message,
        });
    }
};

module.exports = {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    deleteBooking,
    getBookingAnalytics,
    createCustomerBooking,
    getAvailableTimeSlots,
    getStaffSchedules,
    createRecurringBooking,
    sendNotification,
    checkConflicts,
};