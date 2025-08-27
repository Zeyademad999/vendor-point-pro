require("dotenv").config();

module.exports = {
    development: {
        client: "sqlite3",
        connection: {
            filename: "./data/database.sqlite",
        },
        useNullAsDefault: true,
        migrations: {
            directory: "./src/models/migrations",
        },
        seeds: {
            directory: "./src/models/seeds",
        },
        pool: {
            min: 2,
            max: 10,
        },
    },

    test: {
        client: "sqlite3",
        connection: {
            filename: ":memory:",
        },
        useNullAsDefault: true,
        migrations: {
            directory: "./src/models/migrations",
        },
        seeds: {
            directory: "./src/models/seeds",
        },
    },

    production: {
        client: "sqlite3",
        connection: {
            filename: process.env.DATABASE_URL || "./data/database.sqlite",
        },
        useNullAsDefault: true,
        migrations: {
            directory: "./src/models/migrations",
        },
        pool: {
            min: 2,
            max: 10,
        },
    },
};