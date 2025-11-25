const userService = require('./user.service');
const { AppError } = require('../middleware/error.middleware');

class BulkOperationsService {
  async exportUsers(format = 'json') {
    const users = await userService.findAll();

    if (format === 'csv') {
      return this.convertToCSV(users);
    }

    return users;
  }

  convertToCSV(users) {
    if (!users || users.length === 0) {
      return '';
    }

    // Define CSV headers
    const headers = ['id', 'name', 'email', 'profession', 'role', 'createdAt', 'updatedAt'];

    // Create CSV rows
    const rows = users.map((user) => {
      return headers
        .map((header) => {
          const value = user[header] || '';
          // Escape quotes and wrap in quotes if contains comma
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(',') ? `"${escaped}"` : escaped;
        })
        .join(',');
    });

    // Combine headers and rows
    return [headers.join(','), ...rows].join('\n');
  }

  parseCSV(csvContent) {
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new AppError('CSV file must contain headers and at least one user', 400);
    }

    const headers = lines[0].split(',').map((h) => h.trim());

    const users = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);

      if (values.length !== headers.length) {
        continue; // Skip malformed rows
      }

      const user = {};
      headers.forEach((header, index) => {
        user[header] = values[index].trim();
      });

      users.push(user);
    }

    return users;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  async importUsers(usersData, options = {}) {
    const { skipDuplicates = true, updateExisting = false } = options;

    const results = {
      success: [],
      failed: [],
      skipped: [],
      updated: [],
    };

    for (const userData of usersData) {
      try {
        // Validate required fields
        if (!userData.name || !userData.password) {
          results.failed.push({
            user: userData,
            reason: 'Missing required fields (name, password)',
          });
          continue;
        }

        // Check if user exists
        const existingUser = await userService.findByName(userData.name);

        if (existingUser) {
          if (updateExisting) {
            // Update existing user
            const { password, ...updateData } = userData;
            await userService.update(existingUser.id, updateData);
            results.updated.push(userData.name);
          } else if (skipDuplicates) {
            results.skipped.push(userData.name);
          } else {
            results.failed.push({
              user: userData,
              reason: 'User already exists',
            });
          }
          continue;
        }

        // Create new user
        await userService.create(userData);
        results.success.push(userData.name);
      } catch (error) {
        results.failed.push({
          user: userData,
          reason: error.message,
        });
      }
    }

    return results;
  }

  async bulkDelete(userIds) {
    const results = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        await userService.delete(userId);
        results.success.push(userId);
      } catch (error) {
        results.failed.push({
          userId,
          reason: error.message,
        });
      }
    }

    return results;
  }

  async bulkUpdateRole(userIds, newRole) {
    if (!['user', 'admin'].includes(newRole)) {
      throw new AppError('Invalid role', 400);
    }

    const results = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        await userService.update(userId, { role: newRole });
        results.success.push(userId);
      } catch (error) {
        results.failed.push({
          userId,
          reason: error.message,
        });
      }
    }

    return results;
  }
}

module.exports = new BulkOperationsService();
