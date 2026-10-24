const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { listBackups, createBackup, restoreBackup } = require('../controllers/backupController');

router.get('/', authenticateToken, requirePermission('backups', 'view'), listBackups);
router.post('/', authenticateToken, requirePermission('backups', 'create'), createBackup);
router.post('/restore', authenticateToken, requirePermission('backups', 'edit'), restoreBackup);

module.exports = router;
