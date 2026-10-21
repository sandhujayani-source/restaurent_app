const express = require('express');
const TableController = require('../controllers/table.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken);

router.get(
	'/',
	allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
	TableController.getTables
);
router.get(
	'/:id',
	allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
	TableController.getTable
);
router.post('/', allowRoles('Admin'), TableController.createTable);
router.patch('/:id', allowRoles('Admin'), TableController.updateTable);
router.delete('/:id', allowRoles('Admin'), TableController.deactivateTable);

module.exports = router;

