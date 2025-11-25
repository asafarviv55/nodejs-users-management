const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/error.middleware');

class PreferencesService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'preferences.json');
  }

  async loadPreferences() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.savePreferences({});
        return {};
      }
      throw new AppError('Failed to load preferences data', 500);
    }
  }

  async savePreferences(preferences) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(preferences, null, 2));
    } catch (error) {
      throw new AppError('Failed to save preferences data', 500);
    }
  }

  getDefaultPreferences() {
    return {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
      timeFormat: '12h',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      privacy: {
        profileVisible: true,
        showEmail: false,
        showPhone: false,
      },
      emailPreferences: {
        newsletter: false,
        productUpdates: true,
        securityAlerts: true,
      },
    };
  }

  async getUserPreferences(userId) {
    const preferences = await this.loadPreferences();
    const key = `user${userId}`;

    if (!preferences[key]) {
      return {
        userId,
        settings: this.getDefaultPreferences(),
        updatedAt: null,
      };
    }

    return preferences[key];
  }

  async updateUserPreferences(userId, updates) {
    const preferences = await this.loadPreferences();
    const key = `user${userId}`;

    if (!preferences[key]) {
      preferences[key] = {
        userId,
        settings: this.getDefaultPreferences(),
        createdAt: new Date().toISOString(),
      };
    }

    // Deep merge settings
    preferences[key].settings = this.deepMerge(
      preferences[key].settings,
      updates
    );
    preferences[key].updatedAt = new Date().toISOString();

    await this.savePreferences(preferences);
    return preferences[key];
  }

  async resetUserPreferences(userId) {
    const preferences = await this.loadPreferences();
    const key = `user${userId}`;

    preferences[key] = {
      userId,
      settings: this.getDefaultPreferences(),
      updatedAt: new Date().toISOString(),
    };

    await this.savePreferences(preferences);
    return preferences[key];
  }

  async deleteUserPreferences(userId) {
    const preferences = await this.loadPreferences();
    const key = `user${userId}`;

    if (preferences[key]) {
      delete preferences[key];
      await this.savePreferences(preferences);
    }

    return true;
  }

  deepMerge(target, source) {
    const output = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          source[key] instanceof Object &&
          !Array.isArray(source[key]) &&
          key in target
        ) {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      }
    }

    return output;
  }

  async exportUserPreferences(userId) {
    const preferences = await this.getUserPreferences(userId);
    return {
      userId,
      settings: preferences.settings,
      exportedAt: new Date().toISOString(),
    };
  }

  async importUserPreferences(userId, settings) {
    const preferences = await this.loadPreferences();
    const key = `user${userId}`;

    // Validate settings structure
    const defaultSettings = this.getDefaultPreferences();
    const validatedSettings = this.validateSettings(settings, defaultSettings);

    preferences[key] = {
      userId,
      settings: validatedSettings,
      updatedAt: new Date().toISOString(),
    };

    await this.savePreferences(preferences);
    return preferences[key];
  }

  validateSettings(settings, template) {
    const validated = {};

    for (const key in template) {
      if (settings.hasOwnProperty(key)) {
        if (
          typeof template[key] === 'object' &&
          !Array.isArray(template[key]) &&
          template[key] !== null
        ) {
          validated[key] = this.validateSettings(settings[key], template[key]);
        } else if (typeof settings[key] === typeof template[key]) {
          validated[key] = settings[key];
        } else {
          validated[key] = template[key];
        }
      } else {
        validated[key] = template[key];
      }
    }

    return validated;
  }
}

module.exports = new PreferencesService();
