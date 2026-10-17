const express = require('express');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/profile
// Requires a valid JWT token
router.get('/profile', authenticateToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authentication successful.',
        user: req.user
    });
});

module.exports = router;