const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const InventoryRepository = require('../src/repositories/inventory.repository');
const InventoryService = require('../src/services/inventory.service');

const originals = { ...InventoryRepository };

afterEach(() => {
	Object.assign(InventoryRepository, originals);
});

test('creates inventory with normalized decimal precision and nullable supplier', async () => {
	let savedItem;
	InventoryRepository.create = async item => {
		savedItem = item;
		return 11;
	};
	InventoryRepository.findById = async id => ({ id, ...savedItem });

	const item = await InventoryService.create({
		itemName: '  Rice ',
		unit: ' kg ',
		quantity: 5.125,
		reorderLevel: 2,
		supplierId: null
	});

	assert.deepEqual(savedItem, {
		itemName: 'Rice',
		unit: 'kg',
		quantity: '5.125',
		reorderLevel: '2.000',
		supplierId: null
	});
	assert.equal(item.id, 11);
});

test('validates stock quantities and inventory filters', async () => {
	await assert.rejects(
		InventoryService.create({
			itemName: 'Rice',
			unit: 'kg',
			quantity: -1,
			reorderLevel: 0
		}),
		error => error.statusCode === 400
	);
	await assert.rejects(
		InventoryService.create({
			itemName: 'Rice',
			unit: 'kg',
			quantity: 1.2345,
			reorderLevel: 0
		}),
		error => error.statusCode === 400
	);
	await assert.rejects(
		InventoryService.list({ lowStockOnly: 'sometimes' }),
		error => error.statusCode === 400
	);
});

test('limits stock update bodies to a non-negative quantity', async () => {
	InventoryRepository.updateQuantity = async () => true;
	InventoryRepository.findById = async id => ({ id, quantity: '3.000' });

	const item = await InventoryService.updateQuantity(5, { quantity: 3 });
	assert.equal(item.id, 5);

	await assert.rejects(
		InventoryService.updateQuantity(5, { quantity: 3, unit: 'kg' }),
		error => error.statusCode === 400
	);
});
