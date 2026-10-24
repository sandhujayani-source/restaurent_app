const pool = require('../config/database');

function createError(message, statusCode) {
	const error = new Error(message);
	error.statusCode = statusCode;
	return error;
}

const PaymentRepository = {
	async findById(id) {
		const [rows] = await pool.execute(
			`SELECT p.id, p.bill_id, b.bill_number, p.payment_method,
					p.amount, p.transaction_reference, p.status, p.paid_at
			 FROM payments p
			 INNER JOIN bills b ON b.id = p.bill_id
			 WHERE p.id = ?
			 LIMIT 1`,
			[id]
		);
		return rows[0] || null;
	},

	async create({ billId, paymentMethod, amount, transactionReference, idempotencyKey, requestHash }) {
		const connection = await pool.getConnection();

		try {
			await connection.beginTransaction();
			if (idempotencyKey) {
				const [existing] = await connection.execute(
					'SELECT id, request_hash FROM payments WHERE idempotency_key = ? FOR UPDATE',
					[idempotencyKey]
				);
				if (existing.length) {
					if (existing[0].request_hash !== requestHash) {
						throw createError(
							'Idempotency-Key was already used with a different payment request.',
							409
						);
					}
					await connection.commit();
					return { id: existing[0].id, replayed: true };
				}
			}

			const [bills] = await connection.execute(
				`SELECT id, order_id, total_amount, status
				 FROM bills
				 WHERE id = ?
				 FOR UPDATE`,
				[billId]
			);
			const bill = bills[0];
			if (!bill) throw createError('Bill not found.', 404);
			if (['paid', 'void', 'cancelled'].includes(bill.status)) {
				throw createError('Bill does not accept further payments.', 409);
			}

			const [payments] = await connection.execute(
				`SELECT COALESCE(SUM(amount), 0) AS paid_amount
				 FROM payments
				 WHERE bill_id = ? AND status = 'completed'`,
				[billId]
			);
			const outstandingCents = Math.round(Number(bill.total_amount) * 100) -
				Math.round(Number(payments[0].paid_amount) * 100);
			if (amount.cents > outstandingCents) {
				throw createError('Payment exceeds the outstanding bill balance.', 409);
			}

			const [result] = await connection.execute(
				`INSERT INTO payments (
					bill_id, payment_method, amount, transaction_reference,
					status, idempotency_key, request_hash
				) VALUES (?, ?, ?, ?, 'completed', ?, ?)`,
				[
					billId,
					paymentMethod,
					amount.decimal,
					transactionReference,
					idempotencyKey,
					requestHash
				]
			);

			const paidCents = Math.round(Number(payments[0].paid_amount) * 100) + amount.cents;
			const newStatus = paidCents >= Math.round(Number(bill.total_amount) * 100)
				? 'paid'
				: 'partially_paid';
			await connection.execute(
				'UPDATE bills SET status = ? WHERE id = ?',
				[newStatus, billId]
			);
			await connection.commit();

			return { id: result.insertId, replayed: false, orderId: bill.order_id };
		} catch (error) {
			await connection.rollback();
			if (error.code === 'ER_DUP_ENTRY' && idempotencyKey) {
				const [existing] = await connection.execute(
					'SELECT id, request_hash FROM payments WHERE idempotency_key = ? LIMIT 1',
					[idempotencyKey]
				);
				if (existing[0]?.request_hash === requestHash) {
					return { id: existing[0].id, replayed: true };
				}
				if (existing.length) {
					throw createError(
						'Idempotency-Key was already used with a different payment request.',
						409
					);
				}
			}
			throw error;
		} finally {
			connection.release();
		}
	}
};

module.exports = PaymentRepository;

