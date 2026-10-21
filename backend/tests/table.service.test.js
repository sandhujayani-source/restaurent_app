const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const TableRepository = require('../src/repositories/table.repository');
const TableService = require('../src/services/table.service');

const originalRepositoryMethods = { ...TableRepository };

afterEach(() => {
    Object.assign(TableRepository, originalRepositoryMethods);
});

test('creates a table with normalized number and default values', async () => {
    let insertedTable;
    TableRepository.create = async values => {
        insertedTable = values;
        return 7;
    };
    TableRepository.findById = async id => ({
        id,
        table_number: 'T1',
        capacity: 1,
        status: 'available',
        is_active: 1
    });

    const table = await TableService.createTable({ tableNumber: ' T1 ' });

    assert.deepEqual(insertedTable, {
        tableNumber: 'T1',
        capacity: 1,
        status: 'available'
    });
    assert.equal(table.id, 7);
});

test('rejects invalid payloads and table values with 400 errors', async () => {
    await assert.rejects(
        TableService.createTable(null),
        error => error.statusCode === 400
    );
    await assert.rejects(
        TableService.updateTable(1, []),
        error => error.statusCode === 400
    );
    await assert.rejects(
        TableService.createTable({ tableNumber: 'T1', capacity: 0 }),
        error => error.statusCode === 400
    );
    await assert.rejects(
        TableService.getTables('unknown'),
        error => error.statusCode === 400
    );
});

test('updates only supplied fields for an active table', async () => {
    let currentTable = {
        id: 7,
        table_number: 'T1',
        capacity: 2,
        status: 'available',
        is_active: 1
    };
    let updatedValues;

    TableRepository.findById = async () => currentTable;
    TableRepository.update = async (id, changes) => {
        updatedValues = changes;
        currentTable = {
            ...currentTable,
            ...(changes.tableNumber && { table_number: changes.tableNumber }),
            ...(changes.capacity && { capacity: changes.capacity }),
            ...(changes.status && { status: changes.status })
        };
        return 1;
    };

    const table = await TableService.updateTable(7, {
        capacity: 4,
        status: 'OCCUPIED'
    });

    assert.deepEqual(updatedValues, { capacity: 4, status: 'occupied' });
    assert.equal(table.capacity, 4);
    assert.equal(table.status, 'occupied');
});