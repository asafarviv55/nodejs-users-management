const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember,
  updateMemberRole,
  getUserOrganizations,
} = require('../controllers/organization.controller');

// User's organizations
router.get('/my', authenticate, getUserOrganizations);

// List and get organizations
router.get('/', authenticate, listOrganizations);
router.get('/:id', authenticate, getOrganization);

// Create organization (authenticated users)
router.post('/', authenticate, createOrganization);

// Update and delete (admin only)
router.put('/:id', authenticate, requireAdmin, updateOrganization);
router.delete('/:id', authenticate, requireAdmin, deleteOrganization);

// Member management (admin only)
router.post('/:id/members', authenticate, requireAdmin, addMember);
router.delete('/:id/members', authenticate, requireAdmin, removeMember);
router.put('/:id/members', authenticate, requireAdmin, updateMemberRole);

module.exports = router;
