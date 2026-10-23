const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const KitchenRepository = require('../src/repositories/kitchen.repository');
const KitchenService = require('../src/services/kitchen.service');

const originalRepositoryMethods = { ...KitchenRepository };

afterEach(() => {
    Object.assign(KitchenRepository, originalRepositoryMethods);
});

test('normalizes and forwards supported kitchen status filters', async () => {
    let selectedStatus;
    KitchenRepository.findAll = async status => {
        selectedStatus = status;
        return [];
    };

    await KitchenService.listTickets('PREPARING');

    assert.equal(selectedStatus, 'preparing');
});

test('rejects unsupported kitchen filters and status transitions', async () => {
    await assert.rejects(
        KitchenService.listTickets('completed'),
        error => error.statusCode === 400
    );
    await assert.rejects(
        KitchenService.updateStatus('invalid', 'preparing'),
        error => error.statusCode === 400
    );
    await assert.rejects(
        KitchenService.updateStatus(1, 'pending'),
        error => error.statusCode === 400
    );
});

test('forwards valid preparation transitions to the repository', async () => {
    let update;
    KitchenRepository.updateStatus = async (...args) => {
        update = args;
        return { id: args[0], status: args[1] };
    };

    const result = await KitchenService.updateStatus('9', 'READY');

    assert.deepEqual(update, [9, 'ready']);
    assert.deepEqual(result, { id: 9, status: 'ready' });
});