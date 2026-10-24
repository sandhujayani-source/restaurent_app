const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const CustomerRepository = require('../src/repositories/customer.repository');
const CustomerService = require('../src/services/customer.service');

const originals = { ...CustomerRepository };

afterEach(() => {
	Object.assign(CustomerRepository, originals);
});

test('normalizes customer contact fields and creates a customer', async () => {
	let savedCustomer;
	CustomerRepository.create = async customer => {
		savedCustomer = customer;
		return 8;
	};
	CustomerRepository.findById = async id => ({ id, ...savedCustomer });

	const customer = await CustomerService.create({
		fullName: '  Jane Customer ',
		phone: ' 555-0100 ',
		email: ' JANE@example.com '
	});

	assert.deepEqual(savedCustomer, {
		fullName: 'Jane Customer',
		phone: '555-0100',
		email: 'jane@example.com'
	});
	assert.equal(customer.id, 8);
});

test('rejects malformed customer fields and unknown filters', async () => {
	await assert.rejects(
		CustomerService.create({ fullName: 'Nope', unexpected: true }),
		error => error.statusCode === 400
	);
	await assert.rejects(
		CustomerService.create({ fullName: 'Jane', email: 'not-an-email' }),
		error => error.statusCode === 400
	);
	await assert.rejects(
		CustomerService.list({ sort: 'email' }),
		error => error.statusCode === 400
	);
});

test('returns 404 when updating a customer that does not exist', async () => {
	CustomerRepository.update = async () => false;

	await assert.rejects(
		CustomerService.update(99, { fullName: 'Jane' }),
		error => error.statusCode === 404
	);
});
