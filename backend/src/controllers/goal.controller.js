const Goal = require('../models/Goal');

// @desc  Get all goals for user
const getGoals = async (req, res, next) => {
  try {
    const goals = await Goal.find({ user: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: goals });
  } catch (error) {
    next(error);
  }
};

// @desc  Create a goal
const createGoal = async (req, res, next) => {
  try {
    const { title, description, targetAmount, deadline, icon, color } = req.body;
    const goal = await Goal.create({
      user: req.user._id,
      title,
      description,
      targetAmount,
      deadline: deadline || null,
      icon: icon || 'star',
      color: color || '#4338CA',
    });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

// @desc  Update a goal
const updateGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const { title, description, targetAmount, currentAmount, deadline, icon, color, isCompleted } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (targetAmount !== undefined) updates.targetAmount = targetAmount;
    if (currentAmount !== undefined) updates.currentAmount = Math.min(currentAmount, targetAmount || goal.targetAmount);
    if (deadline !== undefined) updates.deadline = deadline;
    if (icon !== undefined) updates.icon = icon;
    if (color !== undefined) updates.color = color;
    if (typeof isCompleted === 'boolean') updates.isCompleted = isCompleted;

    const updated = await Goal.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete a goal
const deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
    await goal.deleteOne();
    res.json({ success: true, message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc  Add money to a goal
const contributeToGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid contribution amount' });
    }

    goal.currentAmount = Math.min(goal.currentAmount + parseFloat(amount), goal.targetAmount);
    if (goal.currentAmount >= goal.targetAmount) goal.isCompleted = true;
    await goal.save();
    res.json({ success: true, data: goal });
  } catch (error) {
    next(error);
  }
};

module.exports = { getGoals, createGoal, updateGoal, deleteGoal, contributeToGoal };
