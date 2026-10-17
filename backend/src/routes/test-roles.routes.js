const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

// Admin-only endpoint
router.get('/admin', authMiddleware, allowRoles('Admin'), (req, res) => {
res.status(200).json({
success: true,
message: 'Admin access granted!'
});
});

// Waiter-only endpoint
router.get('/waiter', authMiddleware, allowRoles('Waiter'), (req, res) => {
res.status(200).json({
success: true,
message: 'Waiter access granted!'
});
});

// Kitchen Staff-only endpoint
router.get('/kitchen', authMiddleware, allowRoles('Kitchen Staff'), (req, res) => {
res.status(200).json({
success: true,
message: 'Kitchen Staff access granted!'
});
});

module.exports = router;
