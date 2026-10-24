const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { generateAlerts, listAlerts, countAlerts, resolveAlert } = require('../controllers/alertsController');

router.get('/', authenticateToken, requirePermission('alerts', 'view'), listAlerts);
router.get('/count', authenticateToken, requirePermission('alerts', 'view'), countAlerts);
router.post('/generate', authenticateToken, requirePermission('alerts', 'create'), generateAlerts);
router.patch('/:id/resolve', authenticateToken, requirePermission('alerts', 'edit'), resolveAlert);

module.exports = router;
