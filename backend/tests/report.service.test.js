const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const ReportRepository = require('../src/repositories/report.repository');
const ReportService = require('../src/services/report.service');

const originalMethods = { ...ReportRepository };

afterEach(() => {
	Object.assign(ReportRepository, originalMethods);
});

test('forwards validated inclusive report dates to the repository', async () => {
	let requestedRange;
	ReportRepository.getSummary = async range => {
		requestedRange = range;
		return { totalOrders: 3 };
	};

	const summary = await ReportService.getSummary({
		from: '2026-01-01',
		to: '2026-01-31'
	});

	assert.deepEqual(requestedRange, { from: '2026-01-01', to: '2026-01-31' });
	assert.equal(summary.totalOrders, 3);
});

test('rejects malformed, reversed, and excessively wide report ranges', async () => {
	await assert.rejects(
		ReportService.getDailySales({ from: '2026-02-30', to: '2026-03-01' }),
		error => error.statusCode === 400
	);
	await assert.rejects(
		ReportService.getSummary({ from: '2026-03-02', to: '2026-03-01' }),
		error => error.statusCode === 400
	);
	await assert.rejects(
		ReportService.getSummary({ from: '2025-01-01', to: '2026-01-02' }),
		error => error.statusCode === 400
	);
	await assert.rejects(
		ReportService.getSummary({ from: '2026-01-01', to: '2026-01-31', status: 'ready' }),
		error => error.statusCode === 400
	);
});
