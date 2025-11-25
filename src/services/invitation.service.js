const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { AppError } = require('../middleware/error.middleware');

class InvitationService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'invitations.json');
  }

  async loadInvitations() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.saveInvitations({});
        return {};
      }
      throw new AppError('Failed to load invitations data', 500);
    }
  }

  async saveInvitations(invitations) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(invitations, null, 2));
    } catch (error) {
      throw new AppError('Failed to save invitations data', 500);
    }
  }

  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateId(invitations) {
    const ids = Object.values(invitations).map((i) => i.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  async create(invitationData, inviterId) {
    const { email, role = 'user', expiresInHours = 72, organizationId } = invitationData;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const invitations = await this.loadInvitations();
    const id = this.generateId(invitations);
    const token = this.generateToken();

    const invKey = `inv${id}`;
    invitations[invKey] = {
      id,
      email,
      token,
      role,
      organizationId: organizationId || null,
      invitedBy: inviterId,
      status: 'pending',
      expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    await this.saveInvitations(invitations);
    return invitations[invKey];
  }

  async findByToken(token) {
    const invitations = await this.loadInvitations();
    const invKey = Object.keys(invitations).find(
      (key) => invitations[key].token === token
    );
    return invKey ? invitations[invKey] : null;
  }

  async findAll(filters = {}) {
    const invitations = await this.loadInvitations();
    let result = Object.values(invitations);

    if (filters.status) {
      result = result.filter((inv) => inv.status === filters.status);
    }

    if (filters.email) {
      result = result.filter((inv) => inv.email === filters.email);
    }

    return result;
  }

  async accept(token, userId) {
    const invitations = await this.loadInvitations();
    const invKey = Object.keys(invitations).find(
      (key) => invitations[key].token === token
    );

    if (!invKey) {
      throw new AppError('Invitation not found', 404);
    }

    const invitation = invitations[invKey];

    if (invitation.status !== 'pending') {
      throw new AppError('Invitation has already been used', 400);
    }

    const expiresAt = new Date(invitation.expiresAt);
    if (expiresAt < new Date()) {
      invitation.status = 'expired';
      await this.saveInvitations(invitations);
      throw new AppError('Invitation has expired', 400);
    }

    invitation.status = 'accepted';
    invitation.acceptedBy = userId;
    invitation.acceptedAt = new Date().toISOString();

    await this.saveInvitations(invitations);
    return invitation;
  }

  async revoke(id) {
    const invitations = await this.loadInvitations();
    const invKey = Object.keys(invitations).find(
      (key) => invitations[key].id === parseInt(id, 10)
    );

    if (!invKey) {
      throw new AppError('Invitation not found', 404);
    }

    invitations[invKey].status = 'revoked';
    invitations[invKey].revokedAt = new Date().toISOString();

    await this.saveInvitations(invitations);
    return invitations[invKey];
  }

  async delete(id) {
    const invitations = await this.loadInvitations();
    const invKey = Object.keys(invitations).find(
      (key) => invitations[key].id === parseInt(id, 10)
    );

    if (!invKey) {
      throw new AppError('Invitation not found', 404);
    }

    delete invitations[invKey];
    await this.saveInvitations(invitations);
    return true;
  }
}

module.exports = new InvitationService();
