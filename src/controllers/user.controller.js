const userService = require('../services/user.service');

const listUsers = async (req, res, next) => {
  try {
    const users = await userService.findAll();
    res.json({ users, count: users.length });
  } catch (error) {
    next(error);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const {
      query,
      role,
      profession,
      createdAfter,
      createdBefore,
      sortBy,
      sortOrder,
      page,
      limit,
    } = req.query;

    const result = await userService.search({
      query,
      role,
      profession,
      createdAfter,
      createdBefore,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const user = await userService.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await userService.delete(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { role, ...updateData } = req.body;
    const user = await userService.update(req.user.id, updateData);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listUsers,
  searchUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
};
