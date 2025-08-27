exports.up = function(knex) {
    return knex.schema
        .alterTable("receipts", function(table) {
            // Drop the existing enum constraint
            table.dropColumn("order_status");
        })
        .then(() => {
            return knex.schema.alterTable("receipts", function(table) {
                // Add the new enum with updated values
                table
                    .enum("order_status", [
                        "pending",
                        "in_progress",
                        "shipped",
                        "out_for_delivery",
                        "delivered",
                        "cancelled",
                    ])
                    .defaultTo("pending");
            });
        });
};

exports.down = function(knex) {
    return knex.schema
        .alterTable("receipts", function(table) {
            // Drop the new enum constraint
            table.dropColumn("order_status");
        })
        .then(() => {
            return knex.schema.alterTable("receipts", function(table) {
                // Restore the original enum
                table
                    .enum("order_status", ["pending", "completed", "cancelled"])
                    .defaultTo("pending");
            });
        });
};