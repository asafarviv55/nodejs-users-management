const jwt = require('jsonwebtoken');
const config = require('../config/env');
const userService = require('./user.service');
const lockoutService = require('./lockout.service');
const { AppError } = require('../middleware/error.middleware');

class AuthService {
  async login(name, password, ipAddress = null) {
    if (!name || !password) {
      throw new AppError('Name and password are required', 400);
    }

    const user = await userService.findByName(name);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if account is locked
    const lockoutStatus = await lockoutService.isAccountLocked(user.id);
    if (lockoutStatus.isLocked) {
      throw new AppError(
        `Account is locked due to too many failed login attempts. Please try again later.`,
        423
      );
    }

    const isValidPassword = await userService.validatePassword(
      password,
      user.password
    );

    if (!isValidPassword) {
      // Record failed attempt
      const status = await lockoutService.recordFailedAttempt(user.id, ipAddress);

      if (status.isLocked) {
        throw new AppError(
          `Account is now locked due to too many failed login attempts. Please try again later.`,
          423
        );
      }

      throw new AppError(
        `Invalid credentials. ${status.attemptsRemaining} attempts remaining.`,
        401
      );
    }

    // Clear failed attempts on successful login
    await lockoutService.clearFailedAttempts(user.id);

    const token = this.generateToken(user);
    const { password: _, passwordHistory, ...userData } = user;

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
