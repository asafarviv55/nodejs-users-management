const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  getMySessions,
  revokeSession,
  revokeAllSessions,
  getUserSessions,
  cleanupExpiredSessions,
} = require('../controllers/session.controller');

// Get my active sessions
router.get('/my', authenticate, getMySessions);

// Revoke a specific session
router.delete('/:sessionId', authenticate, revokeSession);

// Revoke all user sessions
router.delete('/', authenticate, revokeAllSessions);

// Admin: Get user sessions
router.get('/users/:userId', authenticate, requireAdmin, getUserSessions);

// Admin: Cleanup expired sessions
router.post('/cleanup', authenticate, requireAdmin, cleanupExpiredSessions);

module.exports = router;
