const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/error.middleware');

class LockoutService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'lockouts.json');
    this.maxAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
    this.attemptWindow = 30 * 60 * 1000; // 30 minutes
  }

  async loadLockouts() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.saveLockouts({});
        return {};
      }
      throw new AppError('Failed to load lockout data', 500);
    }
  }

  async saveLockouts(lockouts) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(lockouts, null, 2));
    } catch (error) {
      throw new AppError('Failed to save lockout data', 500);
    }
  }

  async recordFailedAttempt(userId, ipAddress = null) {
    const lockouts = await this.loadLockouts();
    const key = `user${userId}`;

    if (!lockouts[key]) {
      lockouts[key] = {
        userId,
        failedAttempts: [],
        lockedUntil: null,
      };
    }

    const now = new Date();
    const user = lockouts[key];

    // Remove old attempts outside the window
    user.failedAttempts = user.failedAttempts.filter(
      (attempt) => now - new Date(attempt.timestamp) < this.attemptWindow
    );

    // Add new failed attempt
    user.failedAttempts.push({
      timestamp: now.toISOString(),
      ipAddress,
    });

    // Check if account should be locked
    if (user.failedAttempts.length >= this.maxAttempts) {
      user.lockedUntil = new Date(now.getTime() + this.lockoutDuration).toISOString();
    }

    await this.saveLockouts(lockouts);

    return {
      isLocked: user.lockedUntil !== null && new Date(user.lockedUntil) > now,
      attemptsRemaining: Math.max(0, this.maxAttempts - user.failedAttempts.length),
      lockedUntil: user.lockedUntil,
    };
  }

  async clearFailedAttempts(userId) {
    const lockouts = await this.loadLockouts();
    const key = `user${userId}`;

    if (lockouts[key]) {
      lockouts[key].failedAttempts = [];
      lockouts[key].lockedUntil = null;
      await this.saveLockouts(lockouts);
    }

    return true;
  }

  async isAccountLocked(userId) {
    const lockouts = await this.loadLockouts();
    const key = `user${userId}`;

    if (!lockouts[key]) {
      return {
        isLocked: false,
        attemptsRemaining: this.maxAttempts,
      };
    }

    const user = lockouts[key];
    const now = new Date();

    // Check if lockout has expired
    if (user.lockedUntil && new Date(user.lockedUntil) <= now) {
      user.lockedUntil = null;
      user.failedAttempts = [];
      await this.saveLockouts(lockouts);

      return {
        isLocked: false,
        attemptsRemaining: this.maxAttempts,
      };
    }

    // Remove old attempts outside the window
    user.failedAttempts = user.failedAttempts.filter(
      (attempt) => now - new Date(attempt.timestamp) < this.attemptWindow
    );

    const isLocked = user.lockedUntil !== null && new Date(user.lockedUntil) > now;
    const attemptsRemaining = Math.max(0, this.maxAttempts - user.failedAttempts.length);

    return {
      isLocked,
      attemptsRemaining,
      lockedUntil: isLocked ? user.lockedUntil : null,
    };
  }

  async unlockAccount(userId) {
    const lockouts = await this.loadLockouts();
    const key = `user${userId}`;

    if (lockouts[key]) {
      lockouts[key].failedAttempts = [];
      lockouts[key].lockedUntil = null;
      await this.saveLockouts(lockouts);
    }

    return true;
  }

  async getLockedAccounts() {
    const lockouts = await this.loadLockouts();
    const now = new Date();

    const locked = [];

    for (const key in lockouts) {
      const user = lockouts[key];
      if (user.lockedUntil && new Date(user.lockedUntil) > now) {
        locked.push({
          userId: user.userId,
          lockedUntil: user.lockedUntil,
          failedAttempts: user.failedAttempts.length,
        });
      }
    }

    return locked;
  }

  getPolicy() {
    return {
      maxAttempts: this.maxAttempts,
      lockoutDurationMinutes: this.lockoutDuration / (60 * 1000),
      attemptWindowMinutes: this.attemptWindow / (60 * 1000),
    };
  }
}

module.exports = new LockoutService();
