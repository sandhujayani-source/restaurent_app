const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');

const applySqlFiles = require('../src/config/applySqlFiles');

test('applies SQL files in sorted order after stripping comment-only lines', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'restaurant-seeds-'));
    const statements = [];
    const logs = [];
    const database = {
        async query(sql) {
            statements.push(sql);
        }
    };

    try {
        await fs.writeFile(
            path.join(directory, '002_second.sql'),
            '-- ignored comment\n\nINSERT IGNORE INTO second_seed VALUES (2);\n'
        );
        await fs.writeFile(
            path.join(directory, '001_first.sql'),
            '  -- ignored comment\nINSERT IGNORE INTO first_seed VALUES (1);\n'
        );
        await fs.writeFile(path.join(directory, 'README.txt'), 'not SQL');

        await applySqlFiles(directory, 'seed', database, message => logs.push(message));

        assert.deepEqual(statements, [
            'INSERT IGNORE INTO first_seed VALUES (1);',
            'INSERT IGNORE INTO second_seed VALUES (2);'
        ]);
        assert.deepEqual(logs, [
            'Applied database seed: 001_first.sql',
            'Applied database seed: 002_second.sql'
        ]);
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
});

test('propagates SQL errors instead of reporting a successful seed', async () => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'restaurant-seeds-'));

    try {
        await fs.writeFile(path.join(directory, '001_failure.sql'), 'INVALID SQL');

        await assert.rejects(
            applySqlFiles(directory, 'seed', {
                async query() {
                    throw new Error('database rejected seed');
                }
            }, () => {}),
            /database rejected seed/
        );
    } finally {
        await fs.rm(directory, { recursive: true, force: true });
    }
});

test('role and permission seed scripts are real, idempotent SQL', async () => {
    const seedDirectory = path.resolve(__dirname, '../database/seeds');
    const seeds = await Promise.all(
        ['001_roles.sql', '002_permissions.sql', '003_role_permissions.sql']
            .map(fileName => fs.readFile(path.join(seedDirectory, fileName), 'utf8'))
    );

    assert.ok(seeds.every(sql => !sql.includes('TODO')));
    assert.ok(seeds[0].includes('INSERT IGNORE INTO roles'));
    assert.match(seeds[0], /Kitchen Staff/);
    assert.ok(seeds[1].includes('INSERT IGNORE INTO permissions'));
    assert.ok(seeds[2].includes('INSERT IGNORE INTO role_permissions'));
});
