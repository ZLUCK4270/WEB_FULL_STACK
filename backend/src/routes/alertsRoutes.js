const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { listAlerts } = require('../controllers/alertsController');

router.get('/', authenticateToken, requirePermission('alerts', 'view'), listAlerts);

module.exports = router;
