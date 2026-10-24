const pool = require('../config/database');

const ReportRepository = {
	async getSummary({ from, to }) {
		const [totals] = await pool.execute(
			`SELECT
				COUNT(*) AS total_orders,
				SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_orders,
				SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_orders,
				COALESCE(SUM(
					CASE WHEN status = 'completed' THEN total_amount ELSE 0 END
				), 0) AS gross_sales
			 FROM orders
			 WHERE created_at >= ?
			   AND created_at < DATE_ADD(?, INTERVAL 1 DAY)`,
			[`${from} 00:00:00`, `${to} 00:00:00`]
		);
		const [statusBreakdown] = await pool.execute(
			`SELECT status, COUNT(*) AS order_count
			 FROM orders
			 WHERE created_at >= ?
			   AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
			 GROUP BY status
			 ORDER BY status`,
			[`${from} 00:00:00`, `${to} 00:00:00`]
		);
		const [topItems] = await pool.execute(
			`SELECT mi.id AS menu_item_id, mi.name AS menu_item_name,
					SUM(oi.quantity) AS quantity_sold,
					SUM(oi.subtotal) AS sales_total
			 FROM orders o
			 INNER JOIN order_items oi ON oi.order_id = o.id
			 INNER JOIN menu_items mi ON mi.id = oi.menu_item_id
			 WHERE o.status = 'completed'
			   AND o.created_at >= ?
			   AND o.created_at < DATE_ADD(?, INTERVAL 1 DAY)
			 GROUP BY mi.id, mi.name
			 ORDER BY quantity_sold DESC, mi.name ASC
			 LIMIT 10`,
			[`${from} 00:00:00`, `${to} 00:00:00`]
		);

		const total = totals[0] || {};
		return {
			from,
			to,
			totalOrders: Number(total.total_orders || 0),
			completedOrders: Number(total.completed_orders || 0),
			cancelledOrders: Number(total.cancelled_orders || 0),
			grossSales: Number(total.gross_sales || 0),
			statusBreakdown,
			topItems
		};
	},

	async getDailySales({ from, to }) {
		const [rows] = await pool.execute(
			`SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS sales_date,
					COUNT(*) AS completed_orders,
					COALESCE(SUM(total_amount), 0) AS gross_sales
			 FROM orders
			 WHERE status = 'completed'
			   AND created_at >= ?
			   AND created_at < DATE_ADD(?, INTERVAL 1 DAY)
			 GROUP BY DATE(created_at)
			 ORDER BY sales_date ASC`,
			[`${from} 00:00:00`, `${to} 00:00:00`]
		);
		return rows.map(row => ({
			date: row.sales_date,
			completedOrders: Number(row.completed_orders),
			grossSales: Number(row.gross_sales)
		}));
	}
};

module.exports = ReportRepository;
