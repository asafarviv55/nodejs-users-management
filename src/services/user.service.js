const fs = require('fs').promises;
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const { AppError } = require('../middleware/error.middleware');

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
    return Object.values(users).map(({ password, ...user }) => user);
  }

  async findById(id) {
    const users = await this.loadUsers();
    const userKey = Object.keys(users).find(
      (key) => users[key].id === parseInt(id, 10)
    );

    if (!userKey) {
      return null;
    }

    const { password, ...user } = users[userKey];
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
      profession: profession || '',
      role,
      createdAt: new Date().toISOString(),
    };

    await this.saveUsers(users);

    const { password: _, ...newUser } = users[userKey];
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

    const { name, profession, role } = updateData;

    if (name) users[userKey].name = name;
    if (profession !== undefined) users[userKey].profession = profession;
    if (role) users[userKey].role = role;
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

    users[userKey].password = await bcrypt.hash(newPassword, SALT_ROUNDS);
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
