exports.up = function(knex) {
  return knex.schema.createTable('wallet_transactions', function(table) {
    table.increments('id').primary();
    table.integer('client_id').notNullable();
    table.integer('wallet_id').notNullable();
    table.integer('from_wallet_id'); // for transfers
    table.integer('to_wallet_id'); // for transfers
    table.string('transaction_type').notNullable(); // credit, debit, transfer
    table.decimal('amount', 15, 2).notNullable();
    table.string('currency', 3).defaultTo('EGP');
    table.string('category').defaultTo('general'); // revenue, cost, transfer, etc.
    table.text('description');
    table.string('reference_number').unique();
    table.boolean('is_confirmed').defaultTo(true);
    table.timestamps(true, true);
    
    // Foreign keys
    table.foreign('client_id').references('id').inTable('clients').onDelete('CASCADE');
    table.foreign('wallet_id').references('id').inTable('wallets').onDelete('CASCADE');
    table.foreign('from_wallet_id').references('id').inTable('wallets').onDelete('SET NULL');
    table.foreign('to_wallet_id').references('id').inTable('wallets').onDelete('SET NULL');
    
    // Indexes
    table.index(['client_id']);
    table.index(['wallet_id']);
    table.index(['client_id', 'wallet_id']);
    table.index(['transaction_type']);
    table.index(['category']);
    table.index(['created_at']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('wallet_transactions');
};
