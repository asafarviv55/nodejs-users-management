const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { AppError } = require('../middleware/error.middleware');
const passwordPolicy = require('./password-policy.service');

const SALT_ROUNDS = 10;

class UserService {
  constructor() {
    this.dataPath = config.dataPath;
  }

  async loadUsers() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.saveUsers({});
        return {};
      }
      throw new AppError('Failed to load users data', 500);
    }
  }

  async saveUsers(users) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(users, null, 2));
    } catch (error) {
      throw new AppError('Failed to save users data', 500);
    }
  }

  generateId(users) {
    const ids = Object.values(users).map((u) => u.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  async findAll() {
    const users = await this.loadUsers();
    return Object.values(users).map(({ password, passwordHistory, ...user }) => user);
  }

  async search(filters = {}) {
    const users = await this.loadUsers();
    let result = Object.values(users).map(({ password, passwordHistory, ...user }) => user);

    // Text search across name and profession
    if (filters.query) {
      const query = filters.query.toLowerCase();
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          (user.profession && user.profession.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query))
      );
    }

    // Filter by role
    if (filters.role) {
      result = result.filter((user) => user.role === filters.role);
    }

    // Filter by profession
    if (filters.profession) {
      result = result.filter(
        (user) => user.profession && user.profession.toLowerCase() === filters.profession.toLowerCase()
      );
    }

    // Filter by date range
    if (filters.createdAfter) {
      result = result.filter(
        (user) => new Date(user.createdAt) >= new Date(filters.createdAfter)
      );
    }

    if (filters.createdBefore) {
      result = result.filter(
        (user) => new Date(user.createdAt) <= new Date(filters.createdBefore)
      );
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

    result.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder * a.name.localeCompare(b.name);
      } else if (sortBy === 'createdAt') {
        return sortOrder * (new Date(a.createdAt) - new Date(b.createdAt));
      } else if (sortBy === 'updatedAt') {
        const aDate = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
        const bDate = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
        return sortOrder * (aDate - bDate);
      }
      return 0;
    });

    // Pagination
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      users: result.slice(startIndex, endIndex),
      total: result.length,
      page,
      limit,
      totalPages: Math.ceil(result.length / limit),
    };
  }

  async findById(id) {
    const users = await this.loadUsers();
    const userKey = Object.keys(users).find(
      (key) => users[key].id === parseInt(id, 10)
    );

    if (!userKey) {
      return null;
    }

    const { password, passwordHistory, ...user } = users[userKey];
    return user;
  }

  async findByName(name) {
    const users = await this.loadUsers();
    const userKey = Object.keys(users).find(
      (key) => users[key].name.toLowerCase() === name.toLowerCase()
    );
    return userKey ? users[userKey] : null;
  }

  async create(userData) {
    const { name, password, profession, role = 'user' } = userData;

    if (!name || !password) {
      throw new AppError('Name and password are required', 400);
    }

    // Validate password against policy
    passwordPolicy.validatePassword(password);

    const existingUser = await this.findByName(name);
    if (existingUser) {
      throw new AppError('User with this name already exists', 409);
    }

    const users = await this.loadUsers();
    const id = this.generateId(users);
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const userKey = `user${id}`;
    users[userKey] = {
      id,
      name,
      password: hashedPassword,
      passwordHistory: [hashedPassword],
      passwordChangedAt: new Date().toISOString(),
      profession: profession || '',
      role,
      createdAt: new Date().toISOString(),
    };

    await this.saveUsers(users);

    const { password: _, passwordHistory, ...newUser } = users[userKey];
    return newUser;
  }

  async update(id, updateData) {
    const users = await this.loadUsers();
    const userKey = Object.keys(users).find(
      (key) => users[key].id === parseInt(id, 10)
    );

    if (!userKey) {
      throw new AppError('User not found', 404);
    }

    const { name, profession, role, avatar, email, phone, bio } = updateData;

    if (name) users[userKey].name = name;
    if (profession !== undefined) users[userKey].profession = profession;
    if (role) users[userKey].role = role;
    if (avatar !== undefined) {
      // Validate base64 image format
      if (avatar && !avatar.startsWith('data:image/')) {
        throw new AppError('Avatar must be a valid base64 image', 400);
      }
      users[userKey].avatar = avatar;
    }
    if (email !== undefined) users[userKey].email = email;
    if (phone !== undefined) users[userKey].phone = phone;
    if (bio !== undefined) users[userKey].bio = bio;
    users[userKey].updatedAt = new Date().toISOString();

    await this.saveUsers(users);

    const { password, ...user } = users[userKey];
    return user;
  }

  async updatePassword(id, newPassword) {
    const users = await this.loadUsers();
    const userKey = Object.keys(users).find(
      (key) => users[key].id === parseInt(id, 10)
    );

    if (!userKey) {
      throw new AppError('User not found', 404);
    }

    // Validate password against policy
    passwordPolicy.validatePassword(newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Check password history
    const passwordHistory = users[userKey].passwordHistory || [];
    passwordPolicy.checkPasswordReuse(hashedPassword, passwordHistory);

    // Update password and history
    users[userKey].password = hashedPassword;
    users[userKey].passwordHistory = [...passwordHistory, hashedPassword].slice(-5);
    users[userKey].passwordChangedAt = new Date().toISOString();
    users[userKey].updatedAt = new Date().toISOString();

    await this.saveUsers(users);
    return true;
  }

  async delete(id) {
    const users = await this.loadUsers();
    const userKey = Object.keys(users).find(
      (key) => users[key].id === parseInt(id, 10)
    );

    if (!userKey) {
      throw new AppError('User not found', 404);
    }

    delete users[userKey];
    await this.saveUsers(users);
    return true;
  }

  async validatePassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = new UserService();
