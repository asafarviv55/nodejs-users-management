const express = require('express');
const router = express.Router();
const { healthCheck } = require('../controllers/health.controller');

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const profileRoutes = require('./profile.routes');

// Health check
router.get('/health', healthCheck);

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/profile', profileRoutes);

module.exports = router;
