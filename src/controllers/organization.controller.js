const organizationService = require('../services/organization.service');

const listOrganizations = async (req, res, next) => {
  try {
    const organizations = await organizationService.findAll();
    res.json({ organizations, count: organizations.length });
  } catch (error) {
    next(error);
  }
};

const getOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.findById(req.params.id);
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    res.json(organization);
  } catch (error) {
    next(error);
  }
};

const createOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.create(req.body, req.user.id);
    res.status(201).json(organization);
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const organization = await organizationService.update(req.params.id, req.body);
    res.json(organization);
  } catch (error) {
    next(error);
  }
};

const deleteOrganization = async (req, res, next) => {
  try {
    await organizationService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const organization = await organizationService.addMember(
      req.params.id,
      userId,
      role
    );
    res.json(organization);
  } catch (error) {
    next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const organization = await organizationService.removeMember(
      req.params.id,
      userId
    );
    res.json(organization);
  } catch (error) {
    next(error);
  }
};

const updateMemberRole = async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const organization = await organizationService.updateMemberRole(
      req.params.id,
      userId,
      role
    );
    res.json(organization);
  } catch (error) {
    next(error);
  }
};

const getUserOrganizations = async (req, res, next) => {
  try {
    const organizations = await organizationService.getUserOrganizations(
      req.user.id
    );
    res.json({ organizations, count: organizations.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  addMember,
  removeMember,
  updateMemberRole,
  getUserOrganizations,
};
