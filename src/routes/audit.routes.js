const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  listAuditLogs,
  getUserActivity,
  getMyActivity,
  getResourceHistory,
} = require('../controllers/audit.controller');

// Get my activity (authenticated)
router.get('/my', authenticate, getMyActivity);

// List all audit logs (admin only)
router.get('/', authenticate, requireAdmin, listAuditLogs);

// Get user activity (admin only)
router.get('/users/:userId', authenticate, requireAdmin, getUserActivity);

// Get resource history (admin only)
router.get(
  '/resources/:resource/:resourceId',
  authenticate,
  requireAdmin,
  getResourceHistory
);

module.exports = router;
