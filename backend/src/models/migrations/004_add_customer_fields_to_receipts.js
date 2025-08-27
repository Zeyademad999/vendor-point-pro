exports.up = async function(knex) {
    await knex.schema.alterTable("receipts", (table) => {
        // Add customer fields for public orders (when customer_id is null)
        table.string("customer_name", 255);
        table.string("customer_email", 255);
        table.string("customer_phone", 50);
        table.text("customer_address");
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable("receipts", (table) => {
        table.dropColumn("customer_name");
        table.dropColumn("customer_email");
        table.dropColumn("customer_phone");
        table.dropColumn("customer_address");
    });
};