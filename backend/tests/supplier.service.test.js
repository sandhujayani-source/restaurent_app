const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const SupplierRepository = require('../src/repositories/supplier.repository');
const SupplierService = require('../src/services/supplier.service');

const originals = { ...SupplierRepository };

afterEach(() => {
	Object.assign(SupplierRepository, originals);
});

test('normalizes supplier details on create', async () => {
	let savedSupplier;
	SupplierRepository.create = async supplier => {
		savedSupplier = supplier;
		return 3;
	};
	SupplierRepository.findById = async id => ({
		id,
		...savedSupplier,
		is_active: 1
	});

	const supplier = await SupplierService.create({
		name: '  Fresh Foods ',
		contactPerson: ' Pat Supplier ',
		phone: ' 555-0101 ',
		email: ' SALES@FRESH.EXAMPLE ',
		address: '  1 Main Street '
	});

	assert.deepEqual(savedSupplier, {
		name: 'Fresh Foods',
		contactPerson: 'Pat Supplier',
		phone: '555-0101',
		email: 'sales@fresh.example',
		address: '1 Main Street'
	});
	assert.equal(supplier.id, 3);
});

test('validates supplier filters and rejects unsupported fields', async () => {
	await assert.rejects(
		SupplierService.list({ includeInactive: 'yes' }),
		error => error.statusCode === 400
	);
	await assert.rejects(
		SupplierService.create({ name: 'Supplier', isActive: true }),
		error => error.statusCode === 400
	);
	await assert.rejects(
		SupplierService.create({ name: 'Supplier', email: 'invalid' }),
		error => error.statusCode === 400
	);
});

test('distinguishes a missing supplier from an already deactivated supplier', async () => {
	SupplierRepository.deactivate = async () => false;
	SupplierRepository.findById = async () => null;
	await assert.rejects(
		SupplierService.deactivate(4),
		error => error.statusCode === 404
	);

	SupplierRepository.findById = async id => ({ id, is_active: 0 });
	await assert.rejects(
		SupplierService.deactivate(4),
		error => error.statusCode === 409
	);
});
