const assert = require('node:assert/strict');
const { test } = require('node:test');

const { getJwtSecret } = require('../src/config/env');

test('accepts a non-placeholder JWT secret with sufficient length', () => {
    assert.equal(getJwtSecret('a'.repeat(64)), 'a'.repeat(64));
});

test('rejects missing, short, and documented placeholder JWT secrets', () => {
    for (const secret of [
        undefined,
        'short-secret',
        'replace_with_your_own_secret',
        'replace_with_a_long_random_secret'
    ]) {
        assert.throws(
            () => getJwtSecret(secret),
            error => error.statusCode === 500
        );
    }
});