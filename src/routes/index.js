const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/health.controller');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const profileRoutes = require('./profile.routes');
const organizationRoutes = require('./organization.routes');
const invitationRoutes = require('./invitation.routes');
const auditRoutes = require('./audit.routes');
const sessionRoutes = require('./session.routes');
const bulkOperationsRoutes = require('./bulk-operations.routes');
const lockoutRoutes = require('./lockout.routes');
const preferencesRoutes = require('./preferences.routes');

// Health check
router.get('/health', healthCheck);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);
router.use('/organizations', organizationRoutes);
router.use('/invitations', invitationRoutes);
router.use('/audit', auditRoutes);
router.use('/sessions', sessionRoutes);
router.use('/bulk', bulkOperationsRoutes);
router.use('/lockout', lockoutRoutes);
router.use('/preferences', preferencesRoutes);

module.exports = router;
