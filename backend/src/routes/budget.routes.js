const express = require('express');
const { body } = require('express-validator');
const {
  createBudget,
  getBudgets,
  getBudget,
  updateBudget,
  deleteBudget,
  resetBudgets,
} = require('../controllers/budget.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/reset', resetBudgets);

router
  .route('/')
  .get(getBudgets)
  .post(
    [
      body('category').notEmpty().withMessage('Category is required'),
      body('limit').isFloat({ min: 0.01 }).withMessage('Limit must be greater than 0'),
      body('period').optional().isIn(['daily', 'weekly', 'monthly']),
    ],
    createBudget
  );

router
  .route('/:id')
  .get(getBudget)
  .put(
    [
      body('limit').optional().isFloat({ min: 0.01 }),
      body('period').optional().isIn(['daily', 'weekly', 'monthly']),
    ],
    updateBudget
  )
  .delete(deleteBudget);

module.exports = router;
