const lockoutService = require('../services/lockout.service');

const checkLockoutStatus = async (req, res, next) => {
  try {
    const status = await lockoutService.isAccountLocked(req.params.userId);
    res.json(status);
  } catch (error) {
    next(error);
  }
};

const unlockAccount = async (req, res, next) => {
  try {
    await lockoutService.unlockAccount(req.params.userId);
    res.json({ message: 'Account unlocked successfully' });
  } catch (error) {
    next(error);
  }
};

const getLockedAccounts = async (req, res, next) => {
  try {
    const accounts = await lockoutService.getLockedAccounts();
    res.json({ accounts, count: accounts.length });
  } catch (error) {
    next(error);
  }
};

const getLockoutPolicy = async (req, res, next) => {
  try {
    const policy = lockoutService.getPolicy();
    res.json(policy);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkLockoutStatus,
  unlockAccount,
  getLockedAccounts,
  getLockoutPolicy,
};
