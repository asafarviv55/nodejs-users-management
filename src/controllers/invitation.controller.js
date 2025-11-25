const invitationService = require('../services/invitation.service');

const createInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.create(req.body, req.user.id);
    res.status(201).json(invitation);
  } catch (error) {
    next(error);
  }
};

const listInvitations = async (req, res, next) => {
  try {
    const { status, email } = req.query;
    const invitations = await invitationService.findAll({ status, email });
    res.json({ invitations, count: invitations.length });
  } catch (error) {
    next(error);
  }
};

const getInvitationByToken = async (req, res, next) => {
  try {
    const invitation = await invitationService.findByToken(req.params.token);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    res.json(invitation);
  } catch (error) {
    next(error);
  }
};

const acceptInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.accept(
      req.params.token,
      req.user.id
    );
    res.json({ message: 'Invitation accepted', invitation });
  } catch (error) {
    next(error);
  }
};

const revokeInvitation = async (req, res, next) => {
  try {
    const invitation = await invitationService.revoke(req.params.id);
    res.json(invitation);
  } catch (error) {
    next(error);
  }
};

const deleteInvitation = async (req, res, next) => {
  try {
    await invitationService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInvitation,
  listInvitations,
  getInvitationByToken,
  acceptInvitation,
  revokeInvitation,
  deleteInvitation,
};
