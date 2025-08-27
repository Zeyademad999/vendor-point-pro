exports.up = async function(knex) {
    await knex.schema.alterTable("services", (table) => {
        table.text("notes");
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable("services", (table) => {
        table.dropColumn("notes");
    });
};