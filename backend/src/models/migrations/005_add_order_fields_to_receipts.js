exports.up = function(knex) {
    return knex.schema.alterTable("receipts", function(table) {
        // Add order_status field
        table
            .enum("order_status", ["pending", "completed", "cancelled"])
            .defaultTo("pending");

        // Add source field to track if order came from POS or website
        table.enum("source", ["pos", "website"]).defaultTo("pos");

        // Add total_amount field for compatibility (same as total but more explicit)
        table.decimal("total_amount", 10, 2);

        // Update existing records to have default values
        knex("receipts").update({
            order_status: "completed",
            source: "pos",
            total_amount: knex.raw("total"),
        });
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable("receipts", function(table) {
        table.dropColumn("order_status");
        table.dropColumn("source");
        table.dropColumn("total_amount");
    });
};