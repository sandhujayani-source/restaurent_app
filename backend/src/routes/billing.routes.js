const express = require('express');
const BillingController = require('../controllers/billing.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(allowRoles('Admin', 'Waiter'));

router.post('/orders/:orderId', BillingController.createForOrder);
router.get('/orders/:orderId', BillingController.getByOrderId);
router.get('/:id', BillingController.getById);

module.exports = router;

