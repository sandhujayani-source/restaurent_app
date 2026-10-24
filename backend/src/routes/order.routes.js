const express = require('express');
const OrderController = require('../controllers/order.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get(
	'/',
	allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
	OrderController.list
);
router.get(
	'/:id',
	allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
	OrderController.getById
);
router.post('/', allowRoles('Admin', 'Waiter'), OrderController.create);
router.patch(
	'/:id/status',
	allowRoles('Admin', 'Waiter'),
	OrderController.updateStatus
);

module.exports = router;

