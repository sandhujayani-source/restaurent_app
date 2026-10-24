const express = require('express');
const CustomerController = require('../controllers/customer.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken, allowRoles('Admin', 'Waiter'));
router.get('/', CustomerController.list);
router.post('/', CustomerController.create);
router.get('/:id', CustomerController.getById);
router.put('/:id', CustomerController.update);

module.exports = router;
