const express = require('express');
const PaymentController = require('../controllers/payment.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken);
router.post(
	'/',
	allowRoles('Admin', 'Waiter'),
	PaymentController.create
);

module.exports = router;

