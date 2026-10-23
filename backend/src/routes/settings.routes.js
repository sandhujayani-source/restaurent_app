const express = require('express');
const SettingsController = require('../controllers/settings.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken);
router.get(
	'/',
	allowRoles('Admin', 'Waiter', 'Kitchen Staff'),
	SettingsController.list
);
router.put('/:key', allowRoles('Admin'), SettingsController.update);

module.exports = router;

