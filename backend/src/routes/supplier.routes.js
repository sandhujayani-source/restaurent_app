const express = require('express');
const SupplierController = require('../controllers/supplier.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken, allowRoles('Admin'));
router.get('/', SupplierController.list);
router.post('/', SupplierController.create);
router.get('/:id', SupplierController.getById);
router.put('/:id', SupplierController.update);
router.patch('/:id/deactivate', SupplierController.deactivate);

module.exports = router;
