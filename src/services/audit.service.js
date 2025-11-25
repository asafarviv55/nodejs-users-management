const fs = require('fs').promises;
const path = require('path');
const { AppError } = require('../middleware/error.middleware');

class AuditService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'audit-logs.json');
  }

  async loadLogs() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.saveLogs([]);
        return [];
      }
      throw new AppError('Failed to load audit logs', 500);
    }
  }

  async saveLogs(logs) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(logs, null, 2));
    } catch (error) {
      throw new AppError('Failed to save audit logs', 500);
    }
  }

  generateId(logs) {
    return logs.length > 0 ? Math.max(...logs.map((l) => l.id)) + 1 : 1;
  }

  async log(logData) {
    const {
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      status = 'success',
    } = logData;

    const logs = await this.loadLogs();
    const id = this.generateId(logs);

    const logEntry = {
      id,
      userId,
      action,
      resource,
      resourceId: resourceId || null,
      details: details || {},
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status,
      timestamp: new Date().toISOString(),
    };

    logs.push(logEntry);

    // Keep only last 10000 logs to prevent file from growing too large
    if (logs.length > 10000) {
      logs.shift();
    }

    await this.saveLogs(logs);
    return logEntry;
  }

  async findAll(filters = {}) {
    const logs = await this.loadLogs();
    let result = logs;

    if (filters.userId) {
      result = result.filter((log) => log.userId === parseInt(filters.userId, 10));
    }

    if (filters.action) {
      result = result.filter((log) => log.action === filters.action);
    }

    if (filters.resource) {
      result = result.filter((log) => log.resource === filters.resource);
    }

    if (filters.status) {
      result = result.filter((log) => log.status === filters.status);
    }

    if (filters.startDate) {
      result = result.filter(
        (log) => new Date(log.timestamp) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      result = result.filter(
        (log) => new Date(log.timestamp) <= new Date(filters.endDate)
      );
    }

    // Sort by timestamp descending (most recent first)
    result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Pagination
    const page = parseInt(filters.page, 10) || 1;
    const limit = parseInt(filters.limit, 10) || 50;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      logs: result.slice(startIndex, endIndex),
      total: result.length,
      page,
      limit,
      totalPages: Math.ceil(result.length / limit),
    };
  }

  async getUserActivity(userId, limit = 50) {
    const logs = await this.loadLogs();
    const userLogs = logs
      .filter((log) => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return userLogs;
  }

  async getResourceHistory(resource, resourceId, limit = 50) {
    const logs = await this.loadLogs();
    const resourceLogs = logs
      .filter((log) => log.resource === resource && log.resourceId === resourceId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return resourceLogs;
  }
}

module.exports = new AuditService();
