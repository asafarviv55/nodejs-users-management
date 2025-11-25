const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/', authenticate, userController.getProfile);
router.put('/', authenticate, userController.updateProfile);

module.exports = router;
