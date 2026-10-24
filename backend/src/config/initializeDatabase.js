const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const pool = require('./database');
const applySqlFiles = require('./applySqlFiles');
const ensureAdminAccount = require('./ensureAdminAccount');
const seedWorkbenchData = require('./seedWorkbenchData');

async function initializeDatabase() {
    const databaseName = process.env.DB_NAME || 'restaurent_app_db';
    const serverConnection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    try {
        await serverConnection.query(
            'CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
            [databaseName]
        );
    } finally {
        await serverConnection.end();
    }

    await pool.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            migration_name VARCHAR(255) NOT NULL PRIMARY KEY,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    `);

    const migrationsDirectory = path.resolve(__dirname, '../../database/migrations');
    const migrationNames = (await fs.readdir(migrationsDirectory))
        .filter(file => file.endsWith('.sql'))
        .sort();

    for (const migrationName of migrationNames) {
        const [applied] = await pool.execute(
            'SELECT migration_name FROM schema_migrations WHERE migration_name = ?',
            [migrationName]
        );

        if (applied.length > 0) {
            continue;
        }

        const migrationPath = path.join(migrationsDirectory, migrationName);
        const migrationSql = (await fs.readFile(migrationPath, 'utf8'))
            .replace(/^\s*--.*$/gm, '')
            .trim();

        if (!migrationSql) {
            continue;
        }

        await pool.query(migrationSql);
        await pool.execute(
            'INSERT INTO schema_migrations (migration_name) VALUES (?)',
            [migrationName]
        );
        console.log(`Applied database migration: ${migrationName}`);
    }

    const seedsDirectory = path.resolve(__dirname, '../../database/seeds');
    await applySqlFiles(seedsDirectory, 'seed', pool);

    await ensureAdminAccount(pool);
    await seedWorkbenchData();
    console.log(`Database ready: ${databaseName}`);
}

module.exports = initializeDatabase;