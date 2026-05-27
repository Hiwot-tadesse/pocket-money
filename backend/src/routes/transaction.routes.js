const express = require('express');
const { body } = require('express-validator');
const {
  createTransaction,
  getTransactions,
  getTransaction,
  updateTransaction,
  deleteTransaction,
  suggestCategory,
} = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.get('/suggest-category', suggestCategory);

router
  .route('/')
  .get(getTransactions)
  .post(
    [
      body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
      body('amount')
        .isFloat()
        .withMessage('Amount must be a valid number')
        .custom((value, { req }) => {
          const amount = Number(value);
          if (!Number.isFinite(amount)) {
            throw new Error('Amount must be a valid number');
          }
          if (req.body.type === 'expense' && amount < 0) {
            throw new Error('Expense amount cannot be negative.');
          }
          if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
          }
          return true;
        }),
      body('description').optional().trim().isLength({ max: 200 }),
    ],
    createTransaction
  );

router
  .route('/:id')
  .get(getTransaction)
  .put(
    [
      body('type').optional().isIn(['income', 'expense']),
      body('amount')
        .optional()
        .isFloat()
        .withMessage('Amount must be a valid number')
        .custom((value, { req }) => {
          const amount = Number(value);
          if (!Number.isFinite(amount)) {
            throw new Error('Amount must be a valid number');
          }
          const type = req.body.type;
          if (type === 'expense' && amount < 0) {
            throw new Error('Expense amount cannot be negative.');
          }
          if (amount <= 0) {
            throw new Error('Amount must be greater than 0');
          }
          return true;
        }),
      body('description').optional().trim().isLength({ max: 200 }),
    ],
    updateTransaction
  )
  .delete(deleteTransaction);

module.exports = router;
