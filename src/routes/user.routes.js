const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');

// Public routes (none - all user operations require auth)

// Protected routes
router.get('/', authenticate, userController.listUsers);
router.get('/:id', authenticate, userController.getUser);

// Admin only routes
router.post('/', authenticate, requireAdmin, userController.createUser);
router.put('/:id', authenticate, requireAdmin, userController.updateUser);
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;
