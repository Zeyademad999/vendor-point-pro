exports.up = function(knex) {
    return knex.schema.table("bookings", function(table) {
        table.enum("staff_preference", ["any", "specific"]).defaultTo("any");
    });
};

exports.down = function(knex) {
    return knex.schema.table("bookings", function(table) {
        table.dropColumn("staff_preference");
    });
};