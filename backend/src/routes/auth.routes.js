// TODO: Implement this module.
const express = require('express');

const AuthController = require('../controllers/auth.controller');
const { validateLogin } = require('../validators/auth.validator');

const router = express.Router();

router.post('/login', validateLogin, AuthController.login);

module.exports = router;
