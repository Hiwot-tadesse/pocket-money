const express = require('express');
const { body } = require('express-validator');
const { getGoals, createGoal, updateGoal, deleteGoal, contributeToGoal } = require('../controllers/goal.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();
router.use(protect);

router
  .route('/')
  .get(getGoals)
  .post(
    [
      body('title').notEmpty().trim().withMessage('Title is required'),
      body('targetAmount').isFloat({ min: 0.01 }).withMessage('Target amount must be greater than 0'),
    ],
    createGoal
  );

router
  .route('/:id')
  .put(updateGoal)
  .delete(deleteGoal);

router.post(
  '/:id/contribute',
  [body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0')],
  contributeToGoal
);

module.exports = router;
