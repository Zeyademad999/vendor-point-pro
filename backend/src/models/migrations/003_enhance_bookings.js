exports.up = function(knex) {
    return knex.schema.table('bookings', function(table) {
        // Add recurring booking fields
        table.boolean('is_recurring').defaultTo(false);
        table.enum('recurring_pattern', ['weekly', 'biweekly', 'monthly']).nullable();
        table.date('recurring_end_date').nullable();
        table.integer('parent_booking_id').nullable();
        
        // Add foreign key for parent booking
        table.foreign('parent_booking_id').references('id').inTable('bookings').onDelete('CASCADE');
        
        // Add indexes for better performance
        table.index(['client_id', 'booking_date']);
        table.index(['client_id', 'staff_id', 'booking_date']);
        table.index(['client_id', 'status']);
        table.index(['is_recurring', 'parent_booking_id']);
    });
};

exports.down = function(knex) {
    return knex.schema.table('bookings', function(table) {
        table.dropForeign(['parent_booking_id']);
        table.dropIndex(['client_id', 'booking_date']);
        table.dropIndex(['client_id', 'staff_id', 'booking_date']);
        table.dropIndex(['client_id', 'status']);
        table.dropIndex(['is_recurring', 'parent_booking_id']);
        table.dropColumn('is_recurring');
        table.dropColumn('recurring_pattern');
        table.dropColumn('recurring_end_date');
        table.dropColumn('parent_booking_id');
    });
};
