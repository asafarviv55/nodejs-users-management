const preferencesService = require('../services/preferences.service');

const getMyPreferences = async (req, res, next) => {
  try {
    const preferences = await preferencesService.getUserPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

const updateMyPreferences = async (req, res, next) => {
  try {
    const preferences = await preferencesService.updateUserPreferences(
      req.user.id,
      req.body
    );
    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

const resetMyPreferences = async (req, res, next) => {
  try {
    const preferences = await preferencesService.resetUserPreferences(req.user.id);
    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

const exportMyPreferences = async (req, res, next) => {
  try {
    const data = await preferencesService.exportUserPreferences(req.user.id);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

const importMyPreferences = async (req, res, next) => {
  try {
    const preferences = await preferencesService.importUserPreferences(
      req.user.id,
      req.body.settings
    );
    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

const getUserPreferences = async (req, res, next) => {
  try {
    const preferences = await preferencesService.getUserPreferences(
      req.params.userId
    );
    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

const getDefaultPreferences = async (req, res, next) => {
  try {
    const defaults = preferencesService.getDefaultPreferences();
    res.json({ settings: defaults });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyPreferences,
  updateMyPreferences,
  resetMyPreferences,
  exportMyPreferences,
  importMyPreferences,
  getUserPreferences,
  getDefaultPreferences,
};
