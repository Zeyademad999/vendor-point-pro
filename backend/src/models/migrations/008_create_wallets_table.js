exports.up = function(knex) {
  return knex.schema.createTable('wallets', function(table) {
    table.increments('id').primary();
    table.integer('client_id').notNullable();
    table.string('name').notNullable();
    table.decimal('balance', 15, 2).defaultTo(0);
    table.string('wallet_type').defaultTo('custom'); // custom, business, personal, etc.
    table.string('currency', 3).defaultTo('EGP');
    table.string('color').defaultTo('#10B981'); // hex color code
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign key
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    
    // Indexes
    table.index(['client_id']);
    table.index(['client_id', 'is_active']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('wallets');
};
