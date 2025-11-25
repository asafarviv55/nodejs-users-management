const bulkOperationsService = require('../services/bulk-operations.service');

const exportUsers = async (req, res, next) => {
  try {
    const { format } = req.query;

    const data = await bulkOperationsService.exportUsers(format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      return res.send(data);
    }

    res.json({ users: data, count: data.length });
  } catch (error) {
    next(error);
  }
};

const importUsers = async (req, res, next) => {
  try {
    const { users, format, skipDuplicates, updateExisting } = req.body;

    let usersData = users;

    // If CSV format, parse it
    if (format === 'csv' && typeof users === 'string') {
      usersData = bulkOperationsService.parseCSV(users);
    }

    const results = await bulkOperationsService.importUsers(usersData, {
      skipDuplicates: skipDuplicates !== false,
      updateExisting: updateExisting === true,
    });

    res.json(results);
  } catch (error) {
    next(error);
  }
};

const bulkDelete = async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    const results = await bulkOperationsService.bulkDelete(userIds);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

const bulkUpdateRole = async (req, res, next) => {
  try {
    const { userIds, role } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    if (!role) {
      return res.status(400).json({ error: 'role is required' });
    }

    const results = await bulkOperationsService.bulkUpdateRole(userIds, role);
    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportUsers,
  importUsers,
  bulkDelete,
  bulkUpdateRole,
};
