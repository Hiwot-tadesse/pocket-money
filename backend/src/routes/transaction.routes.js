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
      body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
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
      body('amount').optional().isFloat({ min: 0.01 }),
      body('description').optional().trim().isLength({ max: 200 }),
    ],
    updateTransaction
  )
  .delete(deleteTransaction);

module.exports = router;
