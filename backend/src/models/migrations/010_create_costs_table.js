exports.up = function(knex) {
  return knex.schema.createTable('costs', function(table) {
    table.increments('id').primary();
    table.integer('client_id').notNullable();
    table.string('title').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('EGP');
    table.string('category').notNullable();
    table.string('payment_method').defaultTo('cash');
    table.string('status').defaultTo('paid'); // paid, pending, overdue
    table.date('due_date');
    table.text('description');
    table.string('reference_number').unique();
    table.boolean('is_recurring').defaultTo(false);
    table.string('recurrence_type'); // monthly, quarterly, yearly
    table.timestamps(true, true);
    
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.index(['client_id']);
    table.index(['client_id', 'category']);
    table.index(['client_id', 'status']);
    table.index(['due_date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('costs');
};
