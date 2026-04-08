const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth.routes');
const transactionRoutes = require('./routes/transaction.routes');
const budgetRoutes = require('./routes/budget.routes');
const reportRoutes = require('./routes/report.routes');
const alertRoutes = require('./routes/alert.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

// Security & logging middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/alerts', alertRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

module.exports = app;
