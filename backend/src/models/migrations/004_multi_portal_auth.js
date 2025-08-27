exports.up = async function(knex) {
    // Add staff login capabilities to existing staff table
    await knex.schema.alterTable("staff", (table) => {
        table.string("username", 100).unique(); // For staff login
        table.string("password", 255); // Hashed password for staff login
        table
            .enum("portal_access", ["staff", "cashier", "admin", "all"])
            .defaultTo("staff");
        table.boolean("can_login").defaultTo(false); // Whether staff can login to portals
        table.json("permissions").defaultTo(
            JSON.stringify({
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
            })
        );
        table.timestamp("last_login");
        table.string("login_token", 500); // JWT token for staff login
    });

    // Create staff sessions table for tracking active logins
    await knex.schema.createTable("staff_sessions", (table) => {
        table.increments("id").primary();
        table
            .integer("staff_id")
            .unsigned()
            .references("id")
            .inTable("staff")
            .onDelete("CASCADE");
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table.string("token", 500).notNullable();
        table.string("portal", 50).notNullable(); // staff, cashier, admin
        table.string("ip_address", 45);
        table.string("user_agent", 500);
        table.timestamp("created_at").defaultTo(knex.fn.now());
        table.timestamp("expires_at").notNullable();
        table.boolean("active").defaultTo(true);

        // Indexes
        table.index(["staff_id"]);
        table.index(["client_id"]);
        table.index(["token"]);
        table.index(["active", "expires_at"]);
    });

    // Create portal access logs for audit trail
    await knex.schema.createTable("portal_access_logs", (table) => {
        table.increments("id").primary();
        table
            .integer("user_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .integer("staff_id")
            .unsigned()
            .references("id")
            .inTable("staff")
            .onDelete("CASCADE");
        table
            .enum("portal", ["admin", "staff", "cashier", "customer"])
            .notNullable();
        table
            .enum("action", ["login", "logout", "access_denied", "permission_denied"])
            .notNullable();
        table.string("ip_address", 45);
        table.string("user_agent", 500);
        table.json("details"); // Additional context
        table.timestamp("created_at").defaultTo(knex.fn.now());

        // Indexes
        table.index(["user_id"]);
        table.index(["staff_id"]);
        table.index(["portal", "action"]);
        table.index(["created_at"]);
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists("portal_access_logs");
    await knex.schema.dropTableIfExists("staff_sessions");

    await knex.schema.alterTable("staff", (table) => {
        table.dropColumn("username");
        table.dropColumn("password");
        table.dropColumn("portal_access");
        table.dropColumn("can_login");
        table.dropColumn("permissions");
        table.dropColumn("last_login");
        table.dropColumn("login_token");
    });
};