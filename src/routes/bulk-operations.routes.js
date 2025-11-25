const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  exportUsers,
  importUsers,
  bulkDelete,
  bulkUpdateRole,
} = require('../controllers/bulk-operations.controller');

// Export users (admin only)
router.get('/export', authenticate, requireAdmin, exportUsers);

// Import users (admin only)
router.post('/import', authenticate, requireAdmin, importUsers);

// Bulk delete users (admin only)
router.post('/delete', authenticate, requireAdmin, bulkDelete);

// Bulk update role (admin only)
router.post('/update-role', authenticate, requireAdmin, bulkUpdateRole);

module.exports = router;
