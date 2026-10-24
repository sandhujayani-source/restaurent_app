INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE LOWER(r.role_name) = 'admin'
	OR (
		LOWER(r.role_name) = 'waiter'
		AND p.permission_name IN (
			'categories:read',
			'menu:read',
			'tables:read',
			'orders:read',
			'orders:write',
			'settings:read',
			'billing:read',
			'billing:write',
			'payments:write',
			'customers:read',
			'customers:write'
		)
	)
	OR (
		LOWER(r.role_name) = 'kitchen staff'
		AND p.permission_name IN (
			'menu:read',
			'orders:read',
			'kitchen:read',
			'kitchen:write',
			'settings:read'
		)
	);
