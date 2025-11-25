const sessionService = require('../services/session.service');

const getMySessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.user.id);
    res.json({ sessions, count: sessions.length });
  } catch (error) {
    next(error);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const session = await sessionService.revoke(req.params.sessionId);
    res.json({ message: 'Session revoked', session });
  } catch (error) {
    next(error);
  }
};

const revokeAllSessions = async (req, res, next) => {
  try {
    const { exceptCurrent } = req.query;
    const currentSessionId = exceptCurrent ? req.headers['x-session-id'] : null;
    const count = await sessionService.revokeAllUserSessions(
      req.user.id,
      currentSessionId
    );
    res.json({ message: 'All sessions revoked', count });
  } catch (error) {
    next(error);
  }
};

const getUserSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getUserSessions(req.params.userId);
    res.json({ sessions, count: sessions.length });
  } catch (error) {
    next(error);
  }
};

const cleanupExpiredSessions = async (req, res, next) => {
  try {
    const count = await sessionService.cleanupExpiredSessions();
    res.json({ message: 'Expired sessions cleaned up', count });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMySessions,
  revokeSession,
  revokeAllSessions,
  getUserSessions,
  cleanupExpiredSessions,
};
