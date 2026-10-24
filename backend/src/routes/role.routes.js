const express = require('express');
const RoleController = require('../controllers/role.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken, allowRoles('Admin'));
router.get('/', RoleController.list);

module.exports = router;
