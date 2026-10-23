const express = require('express');
const KitchenController = require('../controllers/kitchen.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken);
router.use(allowRoles('Admin', 'Kitchen Staff'));

router.get('/', KitchenController.list);
router.get('/:id', KitchenController.getById);
router.patch('/:id/status', KitchenController.updateStatus);

module.exports = router;

