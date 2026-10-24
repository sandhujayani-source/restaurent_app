const express = require('express');
const ReportController = require('../controllers/report.controller');
const authenticateToken = require('../middleware/auth.middleware');
const allowRoles = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticateToken, allowRoles('Admin'));
router.get('/summary', ReportController.summary);
router.get('/sales', ReportController.sales);

module.exports = router;
