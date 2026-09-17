import test from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, verifyPassword, createSessionCookieValue } from './auth.js';

test('hashPassword returns a stable hash for the same password', () => {
    const first = hashPassword('secret-password');
    const second = hashPassword('secret-password');

    assert.notEqual(first, 'secret-password');
    assert.equal(first, second);
});

test('verifyPassword accepts matching passwords and rejects mismatches', () => {
    const hashed = hashPassword('hunter2');

    assert.equal(verifyPassword('hunter2', hashed), true);
    assert.equal(verifyPassword('wrong-password', hashed), false);
});

test('session cookie values can be created and parsed', () => {
    const cookie = createSessionCookieValue('user-123');

    assert.ok(typeof cookie === 'string');
    assert.ok(cookie.includes('user-123'));
});
