const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { AppError } = require('../middleware/error.middleware');

class SessionService {
  constructor() {
    this.dataPath = path.join(process.cwd(), 'data', 'sessions.json');
    this.maxSessionsPerUser = 5;
  }

  async loadSessions() {
    try {
      const data = await fs.readFile(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.saveSessions({});
        return {};
      }
      throw new AppError('Failed to load sessions data', 500);
    }
  }

  async saveSessions(sessions) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(sessions, null, 2));
    } catch (error) {
      throw new AppError('Failed to save sessions data', 500);
    }
  }

  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateId(sessions) {
    const ids = Object.values(sessions).map((s) => s.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  async create(sessionData) {
    const { userId, ipAddress, userAgent, expiresIn = 3600000 } = sessionData;

    if (!userId) {
      throw new AppError('User ID is required', 400);
    }

    const sessions = await this.loadSessions();

    // Check user's active sessions count
    const userSessions = Object.values(sessions).filter(
      (s) => s.userId === userId && s.status === 'active'
    );

    // If user has too many sessions, remove the oldest one
    if (userSessions.length >= this.maxSessionsPerUser) {
      const oldestSession = userSessions.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      )[0];
      await this.revoke(oldestSession.sessionId);
    }

    const id = this.generateId(sessions);
    const sessionId = this.generateSessionId();

    const sessionKey = `session${id}`;
    sessions[sessionKey] = {
      id,
      sessionId,
      userId,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      status: 'active',
      expiresAt: new Date(Date.now() + expiresIn).toISOString(),
      createdAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    };

    await this.saveSessions(sessions);
    return sessions[sessionKey];
  }

  async findBySessionId(sessionId) {
    const sessions = await this.loadSessions();
    const sessionKey = Object.keys(sessions).find(
      (key) => sessions[key].sessionId === sessionId
    );
    return sessionKey ? sessions[sessionKey] : null;
  }

  async getUserSessions(userId, includeInactive = false) {
    const sessions = await this.loadSessions();
    let userSessions = Object.values(sessions).filter((s) => s.userId === userId);

    if (!includeInactive) {
      userSessions = userSessions.filter((s) => s.status === 'active');
    }

    return userSessions.sort(
      (a, b) => new Date(b.lastActivityAt) - new Date(a.lastActivityAt)
    );
  }

  async updateActivity(sessionId) {
    const sessions = await this.loadSessions();
    const sessionKey = Object.keys(sessions).find(
      (key) => sessions[key].sessionId === sessionId
    );

    if (!sessionKey) {
      return false;
    }

    sessions[sessionKey].lastActivityAt = new Date().toISOString();
    await this.saveSessions(sessions);
    return true;
  }

  async revoke(sessionId) {
    const sessions = await this.loadSessions();
    const sessionKey = Object.keys(sessions).find(
      (key) => sessions[key].sessionId === sessionId
    );

    if (!sessionKey) {
      throw new AppError('Session not found', 404);
    }

    sessions[sessionKey].status = 'revoked';
    sessions[sessionKey].revokedAt = new Date().toISOString();

    await this.saveSessions(sessions);
    return sessions[sessionKey];
  }

  async revokeAllUserSessions(userId, exceptSessionId = null) {
    const sessions = await this.loadSessions();
    let revokedCount = 0;

    for (const key in sessions) {
      if (
        sessions[key].userId === userId &&
        sessions[key].status === 'active' &&
        sessions[key].sessionId !== exceptSessionId
      ) {
        sessions[key].status = 'revoked';
        sessions[key].revokedAt = new Date().toISOString();
        revokedCount++;
      }
    }

    await this.saveSessions(sessions);
    return revokedCount;
  }

  async cleanupExpiredSessions() {
    const sessions = await this.loadSessions();
    const now = new Date();
    let cleanedCount = 0;

    for (const key in sessions) {
      const session = sessions[key];
      if (
        session.status === 'active' &&
        new Date(session.expiresAt) < now
      ) {
        session.status = 'expired';
        cleanedCount++;
      }
    }

    await this.saveSessions(sessions);
    return cleanedCount;
  }

  async isSessionValid(sessionId) {
    const session = await this.findBySessionId(sessionId);

    if (!session) {
      return false;
    }

    if (session.status !== 'active') {
      return false;
    }

    const expiresAt = new Date(session.expiresAt);
    if (expiresAt < new Date()) {
      await this.revoke(sessionId);
      return false;
    }

    return true;
  }
}

module.exports = new SessionService();
