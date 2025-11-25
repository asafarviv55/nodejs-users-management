const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  createInvitation,
  listInvitations,
  getInvitationByToken,
  acceptInvitation,
  revokeInvitation,
  deleteInvitation,
} = require('../controllers/invitation.controller');

// List invitations (admin only)
router.get('/', authenticate, requireAdmin, listInvitations);

// Get invitation by token (public)
router.get('/token/:token', getInvitationByToken);

// Create invitation (admin only)
router.post('/', authenticate, requireAdmin, createInvitation);

// Accept invitation (authenticated)
router.post('/accept/:token', authenticate, acceptInvitation);

// Revoke invitation (admin only)
router.put('/:id/revoke', authenticate, requireAdmin, revokeInvitation);

// Delete invitation (admin only)
router.delete('/:id', authenticate, requireAdmin, deleteInvitation);

module.exports = router;
