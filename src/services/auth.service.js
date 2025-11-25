const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userService = require('./user.service');
const { AppError } = require('../middleware/error.middleware');

class AuthService {
  async login(name, password) {
    if (!name || !password) {
      throw new AppError('Name and password are required', 400);
    }

    const user = await userService.findByName(name);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    const isValidPassword = await userService.validatePassword(
      password,
      user.password
    );
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    const token = this.generateToken(user);
    const { password: _, ...userData } = user;

    return { token, user: userData };
  }

  async register(userData) {
    const user = await userService.create(userData);
    const fullUser = await userService.findByName(userData.name);
    const token = this.generateToken({ ...fullUser, ...user });

    return { token, user };
  }

  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role || 'user',
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }
}

module.exports = new AuthService();
