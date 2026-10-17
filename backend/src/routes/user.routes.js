const express = require('express');

const UserController = require('../controllers/user.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

// All staff-management routes require an authenticated Admin.
router.use(authenticateToken);
router.use(allowRoles('Admin'));

// Create a staff account
router.post('/', UserController.createStaff);

// Get all staff accounts
router.get('/', UserController.getAllStaff);

// Get one staff account
router.get('/:id', UserController.getStaffById);

// Update a staff account
router.put('/:id', UserController.updateStaff);

// Deactivate a staff account
router.patch('/:id/deactivate', UserController.deactivateStaff);

module.exports = router;