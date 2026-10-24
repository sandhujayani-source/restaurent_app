const express = require('express');
const InventoryController = require('../controllers/inventory.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken, allowRoles('Admin'));
router.get('/', InventoryController.list);
router.post('/', InventoryController.create);
router.get('/:id', InventoryController.getById);
router.put('/:id', InventoryController.update);
router.patch('/:id/quantity', InventoryController.updateQuantity);

module.exports = router;
