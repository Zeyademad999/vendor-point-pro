exports.up = function(knex) {
    return knex.schema.table('bookings', function(table) {
        // Add recurring booking fields
        table.boolean('is_recurring').defaultTo(false);
        table.enum('recurring_pattern', ['weekly', 'biweekly', 'monthly']).nullable();
        table.date('recurring_end_date').nullable();
        table.integer('parent_booking_id').nullable();
    });
};

exports.down = function(knex) {
    return knex.schema.table('bookings', function(table) {
        table.dropColumn('is_recurring');
        table.dropColumn('recurring_pattern');
        table.dropColumn('recurring_end_date');
        table.dropColumn('parent_booking_id');
    });
};