const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  getMyPreferences,
  updateMyPreferences,
  resetMyPreferences,
  exportMyPreferences,
  importMyPreferences,
  getUserPreferences,
  getDefaultPreferences,
} = require('../controllers/preferences.controller');

// Get default preferences (public)
router.get('/defaults', getDefaultPreferences);

// My preferences (authenticated)
router.get('/my', authenticate, getMyPreferences);
router.put('/my', authenticate, updateMyPreferences);
router.post('/my/reset', authenticate, resetMyPreferences);
router.get('/my/export', authenticate, exportMyPreferences);
router.post('/my/import', authenticate, importMyPreferences);

// Admin: Get any user's preferences
router.get('/users/:userId', authenticate, requireAdmin, getUserPreferences);

module.exports = router;
