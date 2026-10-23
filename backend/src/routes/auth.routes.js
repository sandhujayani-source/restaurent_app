// TODO: Implement this module.
const express = require('express');

const AuthController = require('../controllers/auth.controller');
const { validateLogin } = require('../validators/auth.validator');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', validateLogin, AuthController.login);
router.post('/logout', authenticateToken, AuthController.logout);

module.exports = router;
