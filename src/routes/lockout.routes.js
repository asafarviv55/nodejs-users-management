const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  checkLockoutStatus,
  unlockAccount,
  getLockedAccounts,
  getLockoutPolicy,
} = require('../controllers/lockout.controller');

// Get lockout policy (public)
router.get('/policy', getLockoutPolicy);

// Check lockout status (admin only)
router.get('/:userId', authenticate, requireAdmin, checkLockoutStatus);

// Get all locked accounts (admin only)
router.get('/', authenticate, requireAdmin, getLockedAccounts);

// Unlock account (admin only)
router.post('/:userId/unlock', authenticate, requireAdmin, unlockAccount);

module.exports = router;
