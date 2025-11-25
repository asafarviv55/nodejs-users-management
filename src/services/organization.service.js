const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/error.middleware');

class OrganizationService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'organizations.json');
  }

  async loadOrganizations() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.saveOrganizations({});
        return {};
      }
      throw new AppError('Failed to load organizations data', 500);
    }
  }

  async saveOrganizations(organizations) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(organizations, null, 2));
    } catch (error) {
      throw new AppError('Failed to save organizations data', 500);
    }
  }

  generateId(organizations) {
    const ids = Object.values(organizations).map((o) => o.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  async findAll() {
    const organizations = await this.loadOrganizations();
    return Object.values(organizations);
  }

  async findById(id) {
    const organizations = await this.loadOrganizations();
    const orgKey = Object.keys(organizations).find(
      (key) => organizations[key].id === parseInt(id, 10)
    );
    return orgKey ? organizations[orgKey] : null;
  }

  async create(orgData, creatorId) {
    const { name, description, settings } = orgData;

    if (!name) {
      throw new AppError('Organization name is required', 400);
    }

    const organizations = await this.loadOrganizations();
    const id = this.generateId(organizations);

    const orgKey = `org${id}`;
    organizations[orgKey] = {
      id,
      name,
      description: description || '',
      settings: settings || {},
      members: [
        {
          userId: creatorId,
          role: 'owner',
          joinedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      createdBy: creatorId,
    };

    await this.saveOrganizations(organizations);
    return organizations[orgKey];
  }

  async update(id, updateData) {
    const organizations = await this.loadOrganizations();
    const orgKey = Object.keys(organizations).find(
      (key) => organizations[key].id === parseInt(id, 10)
    );

    if (!orgKey) {
      throw new AppError('Organization not found', 404);
    }

    const { name, description, settings } = updateData;

    if (name) organizations[orgKey].name = name;
    if (description !== undefined) organizations[orgKey].description = description;
    if (settings) organizations[orgKey].settings = { ...organizations[orgKey].settings, ...settings };
    organizations[orgKey].updatedAt = new Date().toISOString();

    await this.saveOrganizations(organizations);
    return organizations[orgKey];
  }

  async delete(id) {
    const organizations = await this.loadOrganizations();
    const orgKey = Object.keys(organizations).find(
      (key) => organizations[key].id === parseInt(id, 10)
    );

    if (!orgKey) {
      throw new AppError('Organization not found', 404);
    }

    delete organizations[orgKey];
    await this.saveOrganizations(organizations);
    return true;
  }

  async addMember(orgId, userId, role = 'member') {
    const organizations = await this.loadOrganizations();
    const orgKey = Object.keys(organizations).find(
      (key) => organizations[key].id === parseInt(orgId, 10)
    );

    if (!orgKey) {
      throw new AppError('Organization not found', 404);
    }

    const existingMember = organizations[orgKey].members.find(
      (m) => m.userId === userId
    );

    if (existingMember) {
      throw new AppError('User is already a member of this organization', 409);
    }

    organizations[orgKey].members.push({
      userId,
      role,
      joinedAt: new Date().toISOString(),
    });

    await this.saveOrganizations(organizations);
    return organizations[orgKey];
  }

  async removeMember(orgId, userId) {
    const organizations = await this.loadOrganizations();
    const orgKey = Object.keys(organizations).find(
      (key) => organizations[key].id === parseInt(orgId, 10)
    );

    if (!orgKey) {
      throw new AppError('Organization not found', 404);
    }

    organizations[orgKey].members = organizations[orgKey].members.filter(
      (m) => m.userId !== userId
    );

    await this.saveOrganizations(organizations);
    return organizations[orgKey];
  }

  async updateMemberRole(orgId, userId, newRole) {
    const organizations = await this.loadOrganizations();
    const orgKey = Object.keys(organizations).find(
      (key) => organizations[key].id === parseInt(orgId, 10)
    );

    if (!orgKey) {
      throw new AppError('Organization not found', 404);
    }

    const member = organizations[orgKey].members.find(
      (m) => m.userId === userId
    );

    if (!member) {
      throw new AppError('User is not a member of this organization', 404);
    }

    member.role = newRole;
    await this.saveOrganizations(organizations);
    return organizations[orgKey];
  }

  async getUserOrganizations(userId) {
    const organizations = await this.loadOrganizations();
    return Object.values(organizations).filter((org) =>
      org.members.some((m) => m.userId === userId)
    );
  }
}

module.exports = new OrganizationService();
