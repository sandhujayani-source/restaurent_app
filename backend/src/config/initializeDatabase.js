const fs = require('node:fs/promises');
const path = require('node:path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const pool = require('./database');

async function ensureAdminAccount() {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || (
        process.env.NODE_ENV === 'production' ? '' : 'admin@123'
    );
    const email = process.env.ADMIN_EMAIL || 'admin@restaurant.local';

    if (!password) {
        console.warn('ADMIN_PASSWORD is not set; skipped admin account bootstrap.');
        return;
    }

    const rolesToEnsure = [
        ['admin', 'Restaurant administrator'],
        ['Waiter', 'Restaurant service staff'],
        ['Kitchen Staff', 'Restaurant kitchen staff']
    ];

    for (const [roleName, description] of rolesToEnsure) {
        await pool.execute(
            'INSERT IGNORE INTO roles (role_name, description) VALUES (?, ?)',
            [roleName, description]
        );
    }

    const [roles] = await pool.execute(
        'SELECT id FROM roles WHERE role_name = ? LIMIT 1',
        ['admin']
    );
    const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
        [username, email]
    );

    if (existingUsers.length > 0) {
        return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await pool.execute(
        `INSERT INTO users (
            full_name, username, email, password_hash, role_id, is_active
        ) VALUES (?, ?, ?, ?, ?, 1)`,
        ['Administrator', username, email, passwordHash, roles[0].id]
    );

    console.log(`Created initial admin account: ${username}`);
}

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
    const migrationFiles = (await fs.readdir(migrationsDirectory))
        .filter(file => file.endsWith('.sql'))
        .sort();

    for (const migrationName of migrationFiles) {
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

    await ensureAdminAccount();
    console.log(`Database ready: ${databaseName}`);
}

module.exports = initializeDatabase;