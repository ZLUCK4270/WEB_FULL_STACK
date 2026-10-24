const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { listAuditLogs } = require('../controllers/auditController');

router.get('/', authenticateToken, requirePermission('audit', 'view'), listAuditLogs);

module.exports = router;
