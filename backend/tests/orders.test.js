const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const OrderRepository = require('../src/repositories/order.repository');
const OrderService = require('../src/services/order.service');

const originals = { ...OrderRepository };

afterEach(() => {
    Object.assign(OrderRepository, originals);
});

test('creates an order with a request hash and authenticated waiter ID', async () => {
    let createInput;
    OrderRepository.createOrder = async input => {
        createInput = input;
        return { id: 12, replayed: false };
    };
    OrderRepository.findById = async id => ({ id, status: 'pending' });

    const result = await OrderService.createOrder(
        {
            tableId: 4,
            items: [{ menuItemId: 3, quantity: 2 }]
        },
        { userId: 8, role: 'Waiter' },
        'request-123'
    );

    assert.equal(createInput.userId, 8);
    assert.equal(createInput.idempotencyKey, 'request-123');
    assert.match(createInput.requestHash, /^[a-f0-9]{64}$/);
    assert.equal(createInput.items[0].unitPrice, undefined);
    assert.equal(result.replayed, false);
});

test('rejects invalid order bodies and client-supplied prices', async () => {
    const user = { userId: 8, role: 'Waiter' };

    await assert.rejects(
        OrderService.createOrder({}, user),
        error => error.statusCode === 400
    );
    await assert.rejects(
        OrderService.createOrder({
            items: [{ menuItemId: 3, quantity: 2, price: 1 }]
        }, user),
        error => error.statusCode === 400
    );
    await assert.rejects(
        OrderService.createOrder({
            items: [{ menuItemId: 3, quantity: 0 }]
        }, user),
        error => error.statusCode === 400
    );
});

test('limits waiter order lists to the authenticated waiter', async () => {
    let query;
    OrderRepository.findAll = async filters => {
        query = filters;
        return [];
    };

    await OrderService.listOrders({ status: 'pending' }, {
        userId: 8,
        role: 'Waiter'
    });

    assert.deepEqual(query, { status: 'pending', tableId: undefined, createdBy: 8 });
});

test('accepts only completion or cancellation status requests', async () => {
    await assert.rejects(
        OrderService.updateStatus(12, 'preparing', { userId: 8, role: 'Waiter' }),
        error => error.statusCode === 400
    );
    await assert.rejects(
        OrderService.updateStatus(12, 'completed', { userId: 8, role: 'Kitchen Staff' }),
        error => error.statusCode === 403
    );
});