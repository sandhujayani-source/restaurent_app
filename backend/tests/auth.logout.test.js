const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const jwt = require('jsonwebtoken');

const TokenRepository = require('../src/repositories/token.repository');
const AuthService = require('../src/services/auth.service');
const authenticateToken = require('../src/middleware/auth.middleware');

const originalIsRevoked = TokenRepository.isRevoked;
const originalRevoke = TokenRepository.revoke;
const originalJwtSecret = process.env.JWT_SECRET;
const jwtSecret = 'logout-test-secret-that-is-long-enough';

afterEach(() => {
    TokenRepository.isRevoked = originalIsRevoked;
    TokenRepository.revoke = originalRevoke;
    if (originalJwtSecret === undefined) {
        delete process.env.JWT_SECRET;
    } else {
        process.env.JWT_SECRET = originalJwtSecret;
    }
});

function createResponse() {
    return {
        statusCode: undefined,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };
}

test('logout revokes the presented token until its expiration', async () => {
    const token = 'example.jwt.token';
    const expiresAt = Math.floor(Date.now() / 1000) + 60;
    let revoked;
    TokenRepository.revoke = async (...args) => {
        revoked = args;
    };

    const result = await AuthService.logout(token, expiresAt);

    assert.deepEqual(revoked, [token, new Date(expiresAt * 1000)]);
    assert.deepEqual(result, { message: 'Logged out successfully.' });
});

test('authentication rejects a valid but revoked token', async () => {
    process.env.JWT_SECRET = jwtSecret;
    const token = jwt.sign({ userId: 1 }, jwtSecret, { expiresIn: '1m' });
    TokenRepository.isRevoked = async () => true;
    const response = createResponse();
    let nextCalled = false;

    await authenticateToken(
        { headers: { authorization: `Bearer ${token}` } },
        response,
        () => { nextCalled = true; }
    );

    assert.equal(response.statusCode, 401);
    assert.equal(nextCalled, false);
});

test('authentication accepts a valid token that is not revoked', async () => {
    process.env.JWT_SECRET = jwtSecret;
    const token = jwt.sign({ userId: 1 }, jwtSecret, { expiresIn: '1m' });
    TokenRepository.isRevoked = async () => false;
    const request = { headers: { authorization: `Bearer ${token}` } };
    let nextCalled = false;

    await authenticateToken(request, createResponse(), () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(request.user.userId, 1);
    assert.equal(request.authToken, token);
});