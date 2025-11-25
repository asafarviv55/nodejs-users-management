const auditService = require('../services/audit.service');

const listAuditLogs = async (req, res, next) => {
  try {
    const { userId, action, resource, status, startDate, endDate, page, limit } =
      req.query;

    const result = await auditService.findAll({
      userId,
      action,
      resource,
      status,
      startDate,
      endDate,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getUserActivity = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const logs = await auditService.getUserActivity(
      req.params.userId,
      limit ? parseInt(limit, 10) : 50
    );
    res.json({ logs, count: logs.length });
  } catch (error) {
    next(error);
  }
};

const getMyActivity = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const logs = await auditService.getUserActivity(
      req.user.id,
      limit ? parseInt(limit, 10) : 50
    );
    res.json({ logs, count: logs.length });
  } catch (error) {
    next(error);
  }
};

const getResourceHistory = async (req, res, next) => {
  try {
    const { resource, resourceId } = req.params;
    const { limit } = req.query;
    const logs = await auditService.getResourceHistory(
      resource,
      resourceId,
      limit ? parseInt(limit, 10) : 50
    );
    res.json({ logs, count: logs.length });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listAuditLogs,
  getUserActivity,
  getMyActivity,
  getResourceHistory,
};
