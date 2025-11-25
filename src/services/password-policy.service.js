const { AppError } = require('../middleware/error.middleware');

class PasswordPolicyService {
  constructor() {
    this.policy = {
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      expirationDays: 90,
      preventReuse: 5, // Number of previous passwords to check
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
    };
  }

  validatePassword(password) {
    const errors = [];

    if (!password) {
      throw new AppError('Password is required', 400);
    }

    if (password.length < this.policy.minLength) {
      errors.push(`Password must be at least ${this.policy.minLength} characters long`);
    }

    if (password.length > this.policy.maxLength) {
      errors.push(`Password must not exceed ${this.policy.maxLength} characters`);
    }

    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (this.policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (this.policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new AppError(errors.join('. '), 400);
    }

    return true;
  }

  isPasswordExpired(user) {
    if (!user.passwordChangedAt) {
      // If no password change date, check creation date
      const createdAt = new Date(user.createdAt);
      const now = new Date();
      return now - createdAt > this.policy.maxAge;
    }

    const passwordChangedAt = new Date(user.passwordChangedAt);
    const now = new Date();
    return now - passwordChangedAt > this.policy.maxAge;
  }

  getPasswordExpirationDate(user) {
    const baseDate = user.passwordChangedAt
      ? new Date(user.passwordChangedAt)
      : new Date(user.createdAt);

    return new Date(baseDate.getTime() + this.policy.maxAge);
  }

  getDaysUntilExpiration(user) {
    const expirationDate = this.getPasswordExpirationDate(user);
    const now = new Date();
    const daysRemaining = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysRemaining);
  }

  shouldWarnUser(user) {
    const daysRemaining = this.getDaysUntilExpiration(user);
    return daysRemaining <= 7 && daysRemaining > 0;
  }

  checkPasswordReuse(newPasswordHash, passwordHistory = []) {
    if (!passwordHistory || passwordHistory.length === 0) {
      return true;
    }

    const recentPasswords = passwordHistory.slice(-this.policy.preventReuse);

    // Note: In a real implementation, we'd need to hash and compare properly
    // This is a simplified check
    if (recentPasswords.includes(newPasswordHash)) {
      throw new AppError(
        `Password has been used recently. Please choose a different password.`,
        400
      );
    }

    return true;
  }

  getPolicy() {
    return {
      minLength: this.policy.minLength,
      maxLength: this.policy.maxLength,
      requireUppercase: this.policy.requireUppercase,
      requireLowercase: this.policy.requireLowercase,
      requireNumbers: this.policy.requireNumbers,
      requireSpecialChars: this.policy.requireSpecialChars,
      expirationDays: this.policy.expirationDays,
      preventReuse: this.policy.preventReuse,
    };
  }
}

module.exports = new PasswordPolicyService();
