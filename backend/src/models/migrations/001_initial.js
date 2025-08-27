exports.up = async function(knex) {
    // Users table (Clients and Admins)
    await knex.schema.createTable("users", (table) => {
        table.increments("id").primary();
        table.string("email", 255).unique().notNullable();
        table.string("password", 255).notNullable();
        table.string("name", 255).notNullable();
        table.string("phone", 50);
        table.enum("role", ["admin", "client"]).defaultTo("client");
        table.enum("status", ["active", "suspended", "trial"]).defaultTo("trial");
        table.string("subdomain", 100).unique();
        table.string("subscription_plan", 50);
        table.string("subscription_status", 50);
        table.datetime("trial_ends_at");
        table.json("settings");
        table.timestamps(true, true);

        // Indexes
        table.index(["email"]);
        table.index(["subdomain"]);
        table.index(["role", "status"]);
    });

    // Categories table
    await knex.schema.createTable("categories", (table) => {
        table.increments("id").primary();
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table.string("name", 255).notNullable();
        table.enum("type", ["product", "service"]).notNullable();
        table.text("description");
        table.timestamps(true, true);

        // Indexes
        table.index(["client_id", "type"]);
    });

    // Products table
    await knex.schema.createTable("products", (table) => {
        table.increments("id").primary();
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .integer("category_id")
            .unsigned()
            .references("id")
            .inTable("categories")
            .onDelete("SET NULL");
        table.string("name", 255).notNullable();
        table.text("description");
        table.decimal("price", 10, 2).notNullable();
        table.decimal("cost_price", 10, 2).defaultTo(0);
        table.integer("stock").defaultTo(0);
        table.integer("alert_level").defaultTo(10);
        table.string("barcode", 100);
        table.json("images");
        table.boolean("active").defaultTo(true);
        table.timestamps(true, true);

        // Indexes
        table.index(["client_id", "category_id"]);
        table.index(["client_id", "active"]);
        table.index(["barcode"]);
    });

    // Services table
    await knex.schema.createTable("services", (table) => {
        table.increments("id").primary();
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .integer("category_id")
            .unsigned()
            .references("id")
            .inTable("categories")
            .onDelete("SET NULL");
        table.string("name", 255).notNullable();
        table.text("description");
        table.decimal("price", 10, 2).notNullable();
        table.integer("duration").defaultTo(30);
        table.boolean("booking_enabled").defaultTo(false);
        table.json("available_times");
        table.json("images");
        table.boolean("active").defaultTo(true);
        table.timestamps(true, true);

        // Indexes
        table.index(["client_id", "category_id"]);
        table.index(["client_id", "booking_enabled"]);
    });

    // Staff table
    await knex.schema.createTable("staff", (table) => {
        table.increments("id").primary();
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table.string("name", 255).notNullable();
        table.string("email", 255);
        table.string("phone", 50);
        table.string("photo", 255);
        table.decimal("salary", 10, 2).defaultTo(0);
        table.json("working_hours");
        table.json("permissions");
        table.text("notes");
        table.boolean("active").defaultTo(true);
        table.date("hire_date");
        table.timestamps(true, true);

        // Indexes
        table.index(["client_id", "active"]);
        table.index(["email"]);
    });

    // Customers table
    await knex.schema.createTable("customers", (table) => {
        table.increments("id").primary();
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table.string("name", 255).notNullable();
        table.string("email", 255);
        table.string("phone", 50);
        table.date("birthday");
        table.text("address");
        table.text("notes");
        table.boolean("birthday_greetings").defaultTo(true);
        table.integer("loyalty_points").defaultTo(0);
        table.decimal("total_spent", 10, 2).defaultTo(0);
        table.timestamp("last_visit");
        table.timestamps(true, true);

        // Indexes
        table.index(["client_id", "email"]);
        table.index(["client_id", "phone"]);
        table.index(["client_id", "last_visit"]);
    });

    // Receipts/Transactions table
    await knex.schema.createTable("receipts", (table) => {
        table.increments("id").primary();
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .integer("customer_id")
            .unsigned()
            .references("id")
            .inTable("customers")
            .onDelete("SET NULL");
        table
            .integer("staff_id")
            .unsigned()
            .references("id")
            .inTable("staff")
            .onDelete("SET NULL");
        table.string("receipt_number", 50).unique();
        table.decimal("subtotal", 10, 2).notNullable();
        table.decimal("tax", 10, 2).defaultTo(0);
        table.decimal("discount", 10, 2).defaultTo(0);
        table.decimal("total", 10, 2).notNullable();
        table.string("payment_method", 50).notNullable();
        table.string("payment_status", 50).defaultTo("completed");
        table.json("items").notNullable();
        table.text("notes");
        table.boolean("send_invoice").defaultTo(false);
        table.timestamps(true, true);

        // Indexes
        table.index(["client_id", "created_at"]);
        table.index(["receipt_number"]);
        table.index(["customer_id"]);
        table.index(["staff_id"]);
    });

    // Bookings table
    await knex.schema.createTable("bookings", (table) => {
        table.increments("id").primary();
        table
            .integer("client_id")
            .unsigned()
            .references("id")
            .inTable("users")
            .onDelete("CASCADE");
        table
            .integer("service_id")
            .unsigned()
            .references("id")
            .inTable("services")
            .onDelete("CASCADE");
        table
            .integer("customer_id")
            .unsigned()
            .references("id")
            .inTable("customers")
            .onDelete("SET NULL");
        table
            .integer("staff_id")
            .unsigned()
            .references("id")
            .inTable("staff")
            .onDelete("SET NULL");
        table.date("booking_date").notNullable();
        table.time("booking_time").notNullable();
        table.integer("duration").notNullable();
        table
            .enum("status", ["pending", "confirmed", "completed", "cancelled"])
            .defaultTo("pending");
        table.decimal("price", 10, 2).notNullable();
        table.string("payment_status", 50).defaultTo("pending");
        table.text("notes");
        table.timestamps(true, true);

        // Indexes
        table.index(["client_id", "booking_date"]);
        table.index(["service_id"]);
        table.index(["customer_id"]);
        table.index(["staff_id"]);
        table.index(["status"]);
    });
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists("bookings");
    await knex.schema.dropTableIfExists("receipts");
    await knex.schema.dropTableIfExists("customers");
    await knex.schema.dropTableIfExists("staff");
    await knex.schema.dropTableIfExists("services");
    await knex.schema.dropTableIfExists("products");
    await knex.schema.dropTableIfExists("categories");
    await knex.schema.dropTableIfExists("users");
};