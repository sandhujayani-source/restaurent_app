const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Protected test endpoint
router.get('/me', authMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Authentication successful!',
        user: req.user
    });
});

module.exports = router;