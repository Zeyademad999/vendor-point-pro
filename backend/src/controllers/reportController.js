const { db } = require("../config/database");
const PDFDocument = require("pdfkit");

// Get comprehensive reports with advanced analytics
const getReports = async(req, res) => {
    try {
        const {
            dateRange = "30",
                reportType = "overview",
                startDate,
                endDate,
        } = req.query;
        const clientId = req.user.business_id || req.user.id;

        // Calculate date range
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            end = new Date();
            start = new Date();
            start.setDate(start.getDate() - parseInt(dateRange));
        }

        // Get total sales from receipts
        const totalSalesResult = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [start, end])
            .sum("total_amount as totalSales")
            .first();

        // Get total orders count
        const totalOrdersResult = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [start, end])
            .count("* as totalOrders")
            .first();

        // Get total customers count
        const totalCustomersResult = await db("customers")
            .where("client_id", clientId)
            .count("* as totalCustomers")
            .first();

        // Get total products count
        const totalProductsResult = await db("products")
            .where("client_id", clientId)
            .where("active", true)
            .count("* as totalProducts")
            .first();

        // Get total services count
        const totalServicesResult = await db("services")
            .where("client_id", clientId)
            .where("active", true)
            .count("* as totalServices")
            .first();

        // Get total bookings count
        const totalBookingsResult = await db("bookings")
            .where("client_id", clientId)
            .whereBetween("created_at", [start, end])
            .count("* as totalBookings")
            .first();

        // Get sales by month (last 6 months)
        const salesByMonth = await db("receipts")
            .select(
                db.raw(
                    "strftime('%m', datetime(created_at/1000, 'unixepoch')) as month"
                ),
                db.raw("SUM(total_amount) as sales")
            )
            .where("client_id", clientId)
            .whereBetween("created_at", [
                new Date(new Date().setMonth(new Date().getMonth() - 6)),
                end,
            ])
            .groupBy("month")
            .orderBy("month", "asc");

        // Get top products by sales
        const topProducts = await db("receipts")
            .select(
                "products.name",
                db.raw(
                    "SUM(CAST(json_extract(items, '$[0].price') AS FLOAT) * CAST(json_extract(items, '$[0].quantity') AS INTEGER)) as sales"
                ),
                db.raw(
                    "SUM(CAST(json_extract(items, '$[0].quantity') AS INTEGER)) as quantity"
                )
            )
            .join("products", function() {
                this.on(
                    db.raw("json_extract(receipts.items, '$[0].product_id')"),
                    "=",
                    "products.id"
                );
            })
            .where("receipts.client_id", clientId)
            .whereBetween("receipts.created_at", [start, end])
            .groupBy("products.id", "products.name")
            .orderBy("sales", "desc")
            .limit(5);

        // Get top services by bookings
        const topServices = await db("bookings")
            .select(
                "services.name",
                db.raw("COUNT(bookings.id) as bookings"),
                db.raw("SUM(bookings.price) as revenue")
            )
            .join("services", "bookings.service_id", "services.id")
            .where("bookings.client_id", clientId)
            .whereBetween("bookings.created_at", [start, end])
            .groupBy("services.id", "services.name")
            .orderBy("bookings", "desc")
            .limit(5);

        // Get recent transactions (sales and bookings)
        const recentSales = await db("receipts")
            .select(
                db.raw("'sale' as type"),
                "receipts.id",
                "customers.name as customer",
                "receipts.total_amount as amount",
                "receipts.payment_status as status",
                "receipts.created_at as date"
            )
            .leftJoin("customers", "receipts.customer_id", "customers.id")
            .where("receipts.client_id", clientId)
            .orderBy("receipts.created_at", "desc")
            .limit(5);

        const recentBookings = await db("bookings")
            .select(
                db.raw("'booking' as type"),
                "bookings.id",
                "customers.name as customer",
                "bookings.price as amount",
                "bookings.status",
                "bookings.created_at as date"
            )
            .leftJoin("customers", "bookings.customer_id", "customers.id")
            .where("bookings.client_id", clientId)
            .orderBy("bookings.created_at", "desc")
            .limit(5);

        // Combine and sort recent transactions
        const recentTransactions = [...recentSales, ...recentBookings]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map((transaction) => ({
                id: `#${transaction.id.toString().padStart(3, "0")}`,
                customer: transaction.customer || "Walk-in Customer",
                amount: parseFloat(transaction.amount),
                type: transaction.type,
                date: new Date(transaction.date).toISOString().split("T")[0],
                status: transaction.status,
            }));

        // Calculate performance metrics
        const avgOrderValue =
            totalOrdersResult.totalOrders > 0 ?
            parseFloat(totalSalesResult.totalSales) /
            parseInt(totalOrdersResult.totalOrders) :
            0;

        const revenuePerCustomer =
            totalCustomersResult.totalCustomers > 0 ?
            parseFloat(totalSalesResult.totalSales) /
            parseInt(totalCustomersResult.totalCustomers) :
            0;

        // Get customer insights
        const newCustomersResult = await db("customers")
            .where("client_id", clientId)
            .whereBetween("created_at", [start, end])
            .count("* as newCustomers")
            .first();

        // Get revenue breakdown
        const revenueBreakdown = await db("receipts")
            .select(
                "source",
                db.raw("SUM(total_amount) as total"),
                db.raw("COUNT(*) as count")
            )
            .where("client_id", clientId)
            .whereBetween("created_at", [start, end])
            .groupBy("source");

        // Format sales by month
        const formattedSalesByMonth = salesByMonth.map((item) => ({
            month: new Date(2024, parseInt(item.month) - 1).toLocaleDateString(
                "en-US", { month: "short" }
            ),
            sales: parseFloat(item.sales) || 0,
        }));

        // Format top products
        const formattedTopProducts = topProducts.map((product) => ({
            name: product.name,
            sales: parseFloat(product.sales) || 0,
            quantity: parseInt(product.quantity) || 0,
        }));

        // Format top services
        const formattedTopServices = topServices.map((service) => ({
            name: service.name,
            bookings: parseInt(service.bookings) || 0,
            revenue: parseFloat(service.revenue) || 0,
        }));

        const reportData = {
            totalSales: parseFloat(totalSalesResult.totalSales) || 0,
            totalOrders: parseInt(totalOrdersResult.totalOrders) || 0,
            totalCustomers: parseInt(totalCustomersResult.totalCustomers) || 0,
            totalProducts: parseInt(totalProductsResult.totalProducts) || 0,
            totalServices: parseInt(totalServicesResult.totalServices) || 0,
            totalBookings: parseInt(totalBookingsResult.totalBookings) || 0,
            salesByMonth: formattedSalesByMonth,
            topProducts: formattedTopProducts,
            topServices: formattedTopServices,
            recentTransactions: recentTransactions,
            // Advanced analytics
            performanceMetrics: {
                averageOrderValue: avgOrderValue,
                customerRetentionRate: 85.0, // Mock data - can be calculated from actual data
                conversionRate: 12.5, // Mock data
                revenuePerCustomer: revenuePerCustomer,
                orderCompletionRate: 98.5, // Mock data
                staffProductivity: 85.0, // Mock data
            },
            customerInsights: {
                newCustomers: parseInt(newCustomersResult.newCustomers) || 0,
                returningCustomers: parseInt(totalCustomersResult.totalCustomers) -
                    parseInt(newCustomersResult.newCustomers) || 0,
                customerLifetimeValue: revenuePerCustomer * 12, // Annual value
                churnRate: 2.1, // Mock data
                customerSegments: {
                    highValue: 15, // Mock data - percentage
                    mediumValue: 45, // Mock data - percentage
                    lowValue: 40, // Mock data - percentage
                },
            },
            timeMetrics: {
                avgOrdersPerDay: parseInt(totalOrdersResult.totalOrders) /
                    Math.max(parseInt(dateRange), 1),
                avgMinutesPerOrder: 45, // Mock data
                avgItemsPerOrder: 1.8, // Mock data
                peakHoursPerDay: 12, // Mock data
            },
            revenueBreakdown: {
                productSales: parseFloat(totalSalesResult.totalSales) * 0.65, // Mock data
                serviceBookings: parseFloat(totalSalesResult.totalSales) * 0.35, // Mock data
                onlineOrders: parseFloat(totalSalesResult.totalSales) * 0.25, // Mock data
                posTransactions: parseFloat(totalSalesResult.totalSales) * 0.75, // Mock data
            },
        };

        res.json({
            success: true,
            message: "Reports fetched successfully",
            data: reportData,
        });
    } catch (error) {
        console.error("Get reports error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch reports",
        });
    }
};

// Get performance metrics for staff
const getPerformanceMetrics = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get staff performance data
        const staffPerformance = await db("staff")
            .select(
                "staff.id as staffId",
                "staff.name as staffName",
                db.raw("COUNT(DISTINCT receipts.id) as totalOrders"),
                db.raw("SUM(receipts.total_amount) as totalSales"),
                db.raw("AVG(receipts.total_amount) as avgOrderValue")
            )
            .leftJoin("receipts", function() {
                this.on("receipts.staff_id", "=", "staff.id")
                    .andOn("receipts.created_at", ">=", startDate)
                    .andOn("receipts.created_at", "<=", endDate);
            })
            .where("staff.client_id", clientId)
            .groupBy("staff.id", "staff.name")
            .orderBy("totalSales", "desc");

        const performanceData = staffPerformance.map((staff) => ({
            staffId: staff.staffId,
            staffName: staff.staffName,
            totalSales: parseFloat(staff.totalSales) || 0,
            totalOrders: parseInt(staff.totalOrders) || 0,
            avgOrderValue: parseFloat(staff.avgOrderValue) || 0,
            customerSatisfaction: 4.5 + Math.random() * 0.5, // Mock data
            efficiency: 80 + Math.random() * 20, // Mock data
        }));

        res.json({
            success: true,
            data: performanceData,
        });
    } catch (error) {
        console.error("Get performance metrics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch performance metrics",
        });
    }
};

// Get customer analytics
const getCustomerAnalytics = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get customer behavior data
        const customerBehavior = await db("customers")
            .select(
                "customers.id",
                "customers.name",
                db.raw("COUNT(DISTINCT receipts.id) as orderCount"),
                db.raw("SUM(receipts.total_amount) as totalSpent"),
                db.raw("MAX(receipts.created_at) as lastOrder")
            )
            .leftJoin("receipts", "customers.id", "receipts.customer_id")
            .where("customers.client_id", clientId)
            .whereBetween("receipts.created_at", [startDate, endDate])
            .groupBy("customers.id", "customers.name")
            .orderBy("totalSpent", "desc");

        res.json({
            success: true,
            data: customerBehavior,
        });
    } catch (error) {
        console.error("Get customer analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch customer analytics",
        });
    }
};

// Get sales analytics
const getSalesAnalytics = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get daily sales for the period
        const dailySales = await db("receipts")
            .select(
                db.raw("DATE(datetime(created_at/1000, 'unixepoch')) as date"),
                db.raw("SUM(total_amount) as sales"),
                db.raw("COUNT(*) as orders")
            )
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .groupBy("date")
            .orderBy("date", "asc");

        // Get sales by payment method
        const salesByPaymentMethod = await db("receipts")
            .select(
                "payment_method",
                db.raw("SUM(total_amount) as total"),
                db.raw("COUNT(*) as count")
            )
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .groupBy("payment_method");

        res.json({
            success: true,
            data: {
                dailySales,
                salesByPaymentMethod,
            },
        });
    } catch (error) {
        console.error("Get sales analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch sales analytics",
        });
    }
};

// Get booking analytics
const getBookingAnalytics = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get bookings by status
        const bookingsByStatus = await db("bookings")
            .select(
                "status",
                db.raw("COUNT(*) as count"),
                db.raw("SUM(price) as revenue")
            )
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .groupBy("status");

        // Get bookings by service
        const bookingsByService = await db("bookings")
            .select(
                "services.name",
                db.raw("COUNT(bookings.id) as count"),
                db.raw("SUM(bookings.price) as revenue")
            )
            .join("services", "bookings.service_id", "services.id")
            .where("bookings.client_id", clientId)
            .whereBetween("bookings.created_at", [startDate, endDate])
            .groupBy("services.id", "services.name")
            .orderBy("count", "desc");

        res.json({
            success: true,
            data: {
                bookingsByStatus,
                bookingsByService,
            },
        });
    } catch (error) {
        console.error("Get booking analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch booking analytics",
        });
    }
};

// Enhanced export report with multiple formats
const exportReport = async(req, res) => {
    try {
        const { format = "pdf", dateRange = "30", startDate, endDate } = req.query;
        const clientId = req.user.business_id || req.user.id;

        // Calculate date range
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            end = new Date();
            start = new Date();
            start.setDate(start.getDate() - parseInt(dateRange));
        }

        // Get report data for export
        const reportData = await getReportDataForExport(clientId, start, end);

        // Generate export based on format
        let exportData;
        let contentType;
        let fileName;

        switch (format.toLowerCase()) {
            case "csv":
                exportData = generateCSV(reportData);
                contentType = "text/csv";
                fileName = `report-${new Date().toISOString().split("T")[0]}.csv`;

                res.setHeader("Content-Type", contentType);
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${fileName}"`
                );
                res.send(exportData);
                break;

            case "excel":
                exportData = generateExcel(reportData);
                contentType =
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                fileName = `report-${new Date().toISOString().split("T")[0]}.xlsx`;

                res.setHeader("Content-Type", contentType);
                res.setHeader(
                    "Content-Disposition",
                    `attachment; filename="${fileName}"`
                );
                res.send(exportData);
                break;

            case "pdf":
            default:
                try {
                    exportData = await generatePDF(reportData);
                    contentType = "application/pdf";
                    fileName = `report-${new Date().toISOString().split("T")[0]}.pdf`;

                    res.setHeader("Content-Type", contentType);
                    res.setHeader(
                        "Content-Disposition",
                        `attachment; filename="${fileName}"`
                    );
                    res.send(exportData);
                } catch (error) {
                    console.error("PDF generation error:", error);
                    res.status(500).json({
                        success: false,
                        message: "Failed to generate PDF",
                    });
                }
                break;
        }
    } catch (error) {
        console.error("Export report error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to export report",
        });
    }
};

// Helper function to get report data for export
const getReportDataForExport = async(clientId, startDate, endDate) => {
    // Get basic metrics
    const totalSalesResult = await db("receipts")
        .where("client_id", clientId)
        .whereBetween("created_at", [startDate, endDate])
        .sum("total_amount as totalSales")
        .first();

    const totalOrdersResult = await db("receipts")
        .where("client_id", clientId)
        .whereBetween("created_at", [startDate, endDate])
        .count("* as totalOrders")
        .first();

    // Get detailed transaction data
    const transactions = await db("receipts")
        .select(
            "receipts.id",
            "receipts.total_amount",
            "receipts.payment_method",
            "receipts.payment_status",
            "receipts.created_at",
            "customers.name as customer_name"
        )
        .leftJoin("customers", "receipts.customer_id", "customers.id")
        .where("receipts.client_id", clientId)
        .whereBetween("receipts.created_at", [startDate, endDate])
        .orderBy("receipts.created_at", "desc");

    return {
        summary: {
            totalSales: parseFloat(totalSalesResult.totalSales) || 0,
            totalOrders: parseInt(totalOrdersResult.totalOrders) || 0,
            period: `${startDate.toISOString().split("T")[0]} to ${
        endDate.toISOString().split("T")[0]
      }`,
        },
        transactions: transactions,
    };
};

// Generate CSV export
const generateCSV = (data) => {
    let csv = "Date,Order ID,Customer,Amount,Payment Method,Status\n";

    data.transactions.forEach((transaction) => {
        csv += `${new Date(transaction.created_at).toISOString().split("T")[0]},`;
        csv += `#${transaction.id.toString().padStart(3, "0")},`;
        csv += `"${transaction.customer_name || "Walk-in Customer"}",`;
        csv += `${transaction.total_amount},`;
        csv += `${transaction.payment_method},`;
        csv += `${transaction.payment_status}\n`;
    });

    return csv;
};

// Generate Excel export (simplified - returns CSV format)
const generateExcel = (data) => {
    // For simplicity, return CSV format
    // In a real implementation, you would use a library like 'xlsx'
    return generateCSV(data);
};

// Generate PDF export using PDFKit
const generatePDF = (data) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 50,
            });

            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));

            // Add header
            doc
                .fontSize(24)
                .font("Helvetica-Bold")
                .text("Business Report", { align: "center" })
                .moveDown();

            doc
                .fontSize(12)
                .font("Helvetica")
                .text(`Period: ${data.summary.period}`, { align: "center" })
                .moveDown(2);

            // Add summary section
            doc.fontSize(16).font("Helvetica-Bold").text("Summary").moveDown();

            doc
                .fontSize(12)
                .font("Helvetica")
                .text(`Total Sales: EGP ${data.summary.totalSales.toLocaleString()}`)
                .text(`Total Orders: ${data.summary.totalOrders}`)
                .moveDown(2);

            // Add transactions table
            doc
                .fontSize(16)
                .font("Helvetica-Bold")
                .text("Transaction Details")
                .moveDown();

            // Table headers
            const tableTop = doc.y;
            const tableLeft = 50;
            const colWidth = 120;
            const rowHeight = 20;

            // Headers
            doc
                .fontSize(10)
                .font("Helvetica-Bold")
                .text("Date", tableLeft, tableTop)
                .text("Order ID", tableLeft + colWidth, tableTop)
                .text("Customer", tableLeft + colWidth * 2, tableTop)
                .text("Amount", tableLeft + colWidth * 3, tableTop)
                .text("Status", tableLeft + colWidth * 4, tableTop);

            // Add lines for headers
            doc
                .moveTo(tableLeft, tableTop + 15)
                .lineTo(tableLeft + colWidth * 5, tableTop + 15)
                .stroke();

            // Table data
            let currentY = tableTop + 20;
            data.transactions.forEach((transaction, index) => {
                if (currentY > 700) {
                    // Check if we need a new page
                    doc.addPage();
                    currentY = 50;
                }

                doc
                    .fontSize(9)
                    .font("Helvetica")
                    .text(
                        new Date(transaction.created_at).toISOString().split("T")[0],
                        tableLeft,
                        currentY
                    )
                    .text(
                        `#${transaction.id.toString().padStart(3, "0")}`,
                        tableLeft + colWidth,
                        currentY
                    )
                    .text(
                        transaction.customer_name || "Walk-in Customer",
                        tableLeft + colWidth * 2,
                        currentY
                    )
                    .text(
                        `EGP ${transaction.total_amount}`,
                        tableLeft + colWidth * 3,
                        currentY
                    )
                    .text(transaction.payment_status, tableLeft + colWidth * 4, currentY);

                currentY += rowHeight;
            });

            // Add footer
            doc
                .fontSize(10)
                .font("Helvetica")
                .text(`Generated on: ${new Date().toLocaleDateString()}`, {
                    align: "center",
                });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

// Get real-time analytics
const getRealTimeAnalytics = async(req, res) => {
    try {
        const clientId = req.user.business_id || req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get today's sales
        const todaySales = await db("receipts")
            .where("client_id", clientId)
            .where("created_at", ">=", today)
            .sum("total_amount as total")
            .first();

        // Get today's orders
        const todayOrders = await db("receipts")
            .where("client_id", clientId)
            .where("created_at", ">=", today)
            .count("* as count")
            .first();

        // Get active customers today
        const activeCustomers = await db("receipts")
            .where("client_id", clientId)
            .where("created_at", ">=", today)
            .distinct("customer_id")
            .count("* as count")
            .first();

        res.json({
            success: true,
            data: {
                todaySales: parseFloat(todaySales.total) || 0,
                todayOrders: parseInt(todayOrders.count) || 0,
                activeCustomers: parseInt(activeCustomers.count) || 0,
                lastUpdated: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error("Get real-time analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch real-time analytics",
        });
    }
};

// Get comparative analytics
const getComparativeAnalytics = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Previous period for comparison
        const previousEndDate = new Date(startDate);
        const previousStartDate = new Date(startDate);
        previousStartDate.setDate(
            previousStartDate.getDate() - parseInt(dateRange)
        );

        // Current period data
        const currentSales = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .sum("total_amount as total")
            .first();

        // Previous period data
        const previousSales = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [previousStartDate, previousEndDate])
            .sum("total_amount as total")
            .first();

        const currentTotal = parseFloat(currentSales.total) || 0;
        const previousTotal = parseFloat(previousSales.total) || 0;
        const growthRate =
            previousTotal > 0 ?
            ((currentTotal - previousTotal) / previousTotal) * 100 :
            0;

        res.json({
            success: true,
            data: {
                currentPeriod: {
                    sales: currentTotal,
                    startDate: startDate.toISOString().split("T")[0],
                    endDate: endDate.toISOString().split("T")[0],
                },
                previousPeriod: {
                    sales: previousTotal,
                    startDate: previousStartDate.toISOString().split("T")[0],
                    endDate: previousEndDate.toISOString().split("T")[0],
                },
                growthRate: growthRate,
            },
        });
    } catch (error) {
        console.error("Get comparative analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch comparative analytics",
        });
    }
};

// Get transactions with pagination and filters
const getTransactions = async(req, res) => {
    try {
        const {
            page = 1,
                limit = 10,
                search = "",
                dateRange = "30",
                source,
                paymentMethod,
                startDate,
                endDate,
        } = req.query;
        const clientId = req.user.business_id || req.user.id;

        // Calculate date range
        let start, end;
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            end = new Date();
            start = new Date();
            start.setDate(start.getDate() - parseInt(dateRange));
        }

        // Build query
        let query = db("receipts")
            .select(
                "receipts.*",
                "customers.name as customer_name",
                "customers.email as customer_email",
                "customers.phone as customer_phone",
                "staff.name as staff_name"
            )
            .leftJoin("customers", "receipts.customer_id", "customers.id")
            .leftJoin("staff", "receipts.staff_id", "staff.id")
            .where("receipts.client_id", clientId)
            .whereBetween("receipts.created_at", [start, end]);

        // Apply search filter
        if (search) {
            query = query.where(function() {
                this.where("receipts.receipt_number", "like", `%${search}%`)
                    .orWhere("customers.name", "like", `%${search}%`)
                    .orWhere("customers.email", "like", `%${search}%`);
            });
        }

        // Apply source filter
        if (source && source !== "all") {
            query = query.where("receipts.source", source);
        }

        // Apply payment method filter
        if (paymentMethod && paymentMethod !== "all") {
            query = query.where("receipts.payment_method", paymentMethod);
        }

        // Apply payment status filter for POS transactions (only show paid/completed)
        if (source === "pos") {
            query = query.where(function() {
                this.where("receipts.payment_status", "paid").orWhere(
                    "receipts.payment_status",
                    "completed"
                );
            });
        }

        // Apply order status filter for POS transactions (only show completed/delivered)
        if (source === "pos") {
            query = query.where(function() {
                this.where("receipts.order_status", "completed").orWhere(
                    "receipts.order_status",
                    "delivered"
                );
            });
        }

        // Get total count for pagination
        const totalQuery = query.clone();
        const totalResult = await totalQuery.count("* as total").first();
        const total = parseInt(totalResult.total);

        // Apply pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const transactions = await query
            .orderBy("receipts.created_at", "desc")
            .limit(parseInt(limit))
            .offset(offset);

        // Format transactions
        const formattedTransactions = transactions.map((transaction) => ({
            id: transaction.id,
            receipt_number: transaction.receipt_number,
            customer_name: transaction.customer_name || "Walk-in Customer",
            customer_email: transaction.customer_email || "",
            customer_phone: transaction.customer_phone || "",
            items: transaction.items,
            total_amount: parseFloat(transaction.total_amount),
            payment_method: transaction.payment_method,
            payment_status: transaction.payment_status,
            order_status: transaction.order_status || "completed",
            source: transaction.source || "pos",
            created_at: transaction.created_at,
            updated_at: transaction.updated_at,
            staff_name: transaction.staff_name,
            notes: transaction.notes,
        }));

        const totalPages = Math.ceil(total / parseInt(limit));

        res.json({
            success: true,
            data: {
                transactions: formattedTransactions,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    pages: totalPages,
                },
            },
        });
    } catch (error) {
        console.error("Get transactions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch transactions",
        });
    }
};

// Update transaction
const updateTransaction = async(req, res) => {
    try {
        const { id } = req.params;
        const { customer_name, customer_email, payment_status, notes } = req.body;
        const clientId = req.user.business_id || req.user.id;

        // Verify transaction belongs to client
        const existingTransaction = await db("receipts")
            .where("id", id)
            .where("client_id", clientId)
            .first();

        if (!existingTransaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        // Update transaction
        const updateData = {};
        if (customer_name !== undefined) updateData.customer_name = customer_name;
        if (customer_email !== undefined)
            updateData.customer_email = customer_email;
        if (payment_status !== undefined)
            updateData.payment_status = payment_status;
        if (notes !== undefined) updateData.notes = notes;

        await db("receipts").where("id", id).update(updateData);

        // Get updated transaction
        const updatedTransaction = await db("receipts")
            .select(
                "receipts.*",
                "customers.name as customer_name",
                "customers.email as customer_email",
                "customers.phone as customer_phone",
                "staff.name as staff_name"
            )
            .leftJoin("customers", "receipts.customer_id", "customers.id")
            .leftJoin("staff", "receipts.staff_id", "staff.id")
            .where("receipts.id", id)
            .first();

        res.json({
            success: true,
            message: "Transaction updated successfully",
            data: {
                id: updatedTransaction.id,
                receipt_number: updatedTransaction.receipt_number,
                customer_name: updatedTransaction.customer_name || "Walk-in Customer",
                customer_email: updatedTransaction.customer_email || "",
                customer_phone: updatedTransaction.customer_phone || "",
                items: updatedTransaction.items,
                total_amount: parseFloat(updatedTransaction.total_amount),
                payment_method: updatedTransaction.payment_method,
                payment_status: updatedTransaction.payment_status,
                order_status: updatedTransaction.order_status || "completed",
                source: updatedTransaction.source || "pos",
                created_at: updatedTransaction.created_at,
                updated_at: updatedTransaction.updated_at,
                staff_name: updatedTransaction.staff_name,
                notes: updatedTransaction.notes,
            },
        });
    } catch (error) {
        console.error("Update transaction error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update transaction",
        });
    }
};

// Delete transaction
const deleteTransaction = async(req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user.business_id || req.user.id;

        // Verify transaction belongs to client
        const existingTransaction = await db("receipts")
            .where("id", id)
            .where("client_id", clientId)
            .first();

        if (!existingTransaction) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found",
            });
        }

        // Delete transaction
        await db("receipts").where("id", id).del();

        res.json({
            success: true,
            message: "Transaction deleted successfully",
        });
    } catch (error) {
        console.error("Delete transaction error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete transaction",
        });
    }
};

// Bulk delete transactions
const bulkDeleteTransactions = async(req, res) => {
    try {
        const { ids } = req.body;
        const clientId = req.user.business_id || req.user.id;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid transaction IDs",
            });
        }

        // Verify all transactions belong to client
        const existingTransactions = await db("receipts")
            .whereIn("id", ids)
            .where("client_id", clientId);

        if (existingTransactions.length !== ids.length) {
            return res.status(400).json({
                success: false,
                message: "Some transactions not found or not authorized",
            });
        }

        // Delete transactions
        await db("receipts").whereIn("id", ids).del();

        res.json({
            success: true,
            message: `${ids.length} transactions deleted successfully`,
        });
    } catch (error) {
        console.error("Bulk delete transactions error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete transactions",
        });
    }
};

// Get product analytics
const getProductAnalytics = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get product performance
        const productPerformance = await db("receipts")
            .select(
                "products.name",
                db.raw(
                    "SUM(CAST(json_extract(items, '$[0].price') AS FLOAT) * CAST(json_extract(items, '$[0].quantity') AS INTEGER)) as sales"
                ),
                db.raw(
                    "SUM(CAST(json_extract(items, '$[0].quantity') AS INTEGER)) as quantity"
                ),
                db.raw(
                    "SUM(CAST(json_extract(items, '$[0].price') AS FLOAT) * CAST(json_extract(items, '$[0].quantity') AS INTEGER)) * 0.3 as profit"
                )
            )
            .join("products", function() {
                this.on(
                    db.raw("json_extract(receipts.items, '$[0].product_id')"),
                    "=",
                    "products.id"
                );
            })
            .where("receipts.client_id", clientId)
            .whereBetween("receipts.created_at", [startDate, endDate])
            .groupBy("products.id", "products.name")
            .orderBy("sales", "desc");

        // Get category performance
        const categoryPerformance = await db("receipts")
            .select(
                "categories.name as category",
                db.raw(
                    "SUM(CAST(json_extract(items, '$[0].price') AS FLOAT) * CAST(json_extract(items, '$[0].quantity') AS INTEGER)) as sales"
                ),
                db.raw(
                    "COUNT(DISTINCT json_extract(items, '$[0].product_id')) as items"
                )
            )
            .join("products", function() {
                this.on(
                    db.raw("json_extract(receipts.items, '$[0].product_id')"),
                    "=",
                    "products.id"
                );
            })
            .join("categories", "products.category_id", "categories.id")
            .where("receipts.client_id", clientId)
            .whereBetween("receipts.created_at", [startDate, endDate])
            .groupBy("categories.id", "categories.name")
            .orderBy("sales", "desc");

        res.json({
            success: true,
            data: {
                productPerformance: productPerformance.map((p) => ({
                    name: p.name,
                    sales: parseFloat(p.sales) || 0,
                    quantity: parseInt(p.quantity) || 0,
                    profit: parseFloat(p.profit) || 0,
                })),
                categoryPerformance: categoryPerformance.map((c) => ({
                    category: c.category,
                    sales: parseFloat(c.sales) || 0,
                    items: parseInt(c.items) || 0,
                })),
            },
        });
    } catch (error) {
        console.error("Get product analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch product analytics",
        });
    }
};

// Get financial analytics
const getFinancialAnalytics = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get total revenue
        const totalRevenueResult = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .sum("total_amount as total")
            .first();

        const totalRevenue = parseFloat(totalRevenueResult.total) || 0;

        // Calculate profit (assuming 30% profit margin)
        const grossProfit = totalRevenue * 0.3;
        const expenses = totalRevenue * 0.2; // Mock expenses
        const netProfit = grossProfit - expenses;
        const profitMargin =
            totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

        // Get profit by month
        const profitByMonth = await db("receipts")
            .select(
                db.raw(
                    "strftime('%m', datetime(created_at/1000, 'unixepoch')) as month"
                ),
                db.raw("SUM(total_amount) as revenue")
            )
            .where("client_id", clientId)
            .whereBetween("created_at", [
                new Date(new Date().setMonth(new Date().getMonth() - 6)),
                endDate,
            ])
            .groupBy("month")
            .orderBy("month", "asc");

        const formattedProfitByMonth = profitByMonth.map((item) => ({
            month: new Date(2024, parseInt(item.month) - 1).toLocaleDateString(
                "en-US", { month: "short" }
            ),
            profit: parseFloat(item.revenue) * 0.3,
            margin: 30.0,
        }));

        res.json({
            success: true,
            data: {
                profitMargin: profitMargin,
                grossProfit: grossProfit,
                netProfit: netProfit,
                expenses: expenses,
                profitByMonth: formattedProfitByMonth,
                cashFlow: formattedProfitByMonth.map((item) => ({
                    month: item.month,
                    income: item.profit / 0.3, // Convert back to revenue
                    expenses: (item.profit / 0.3) * 0.2,
                    net: item.profit,
                })),
            },
        });
    } catch (error) {
        console.error("Get financial analytics error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch financial analytics",
        });
    }
};

// Get dashboard summary
const getDashboardSummary = async(req, res) => {
    try {
        const { dateRange = "30" } = req.query;
        const clientId = req.user.business_id || req.user.id;

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(dateRange));

        // Get key metrics
        const totalSalesResult = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .sum("total_amount as total")
            .first();

        const totalOrdersResult = await db("receipts")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .count("* as count")
            .first();

        const totalCustomersResult = await db("customers")
            .where("client_id", clientId)
            .count("* as count")
            .first();

        const totalBookingsResult = await db("bookings")
            .where("client_id", clientId)
            .whereBetween("created_at", [startDate, endDate])
            .count("* as count")
            .first();

        res.json({
            success: true,
            data: {
                totalSales: parseFloat(totalSalesResult.total) || 0,
                totalOrders: parseInt(totalOrdersResult.count) || 0,
                totalCustomers: parseInt(totalCustomersResult.count) || 0,
                totalBookings: parseInt(totalBookingsResult.count) || 0,
                period: `${startDate.toISOString().split("T")[0]} to ${
          endDate.toISOString().split("T")[0]
        }`,
            },
        });
    } catch (error) {
        console.error("Get dashboard summary error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard summary",
        });
    }
};

module.exports = {
    getReports,
    getSalesAnalytics,
    getBookingAnalytics,
    getPerformanceMetrics,
    getCustomerAnalytics,
    getProductAnalytics,
    getFinancialAnalytics,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    bulkDeleteTransactions,
    getDashboardSummary,
    exportReport,
    getRealTimeAnalytics,
    getComparativeAnalytics,
};