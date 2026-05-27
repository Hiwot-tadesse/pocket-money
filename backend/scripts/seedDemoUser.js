const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');

const DEMO_USER = {
  username: 'demo_student',
  email: 'demo@gmail.com',
  password: 'Demo@1234',
  pin: '1234',
};

const incomeByMonth = [5200, 5400, 5600, 5900, 6200, 6500];
const expensePattern = [
  { category: 'Food & Drinks', base: 1350, step: 90, descriptions: ['Coffee and breakfast', 'Pizza with friends', 'Lunch at cafe', 'Burger meal'] },
  { category: 'Transport', base: 620, step: 45, descriptions: ['Taxi ride', 'Bus fare', 'Bajaj transport', 'Uber trip'] },
  { category: 'Education', base: 420, step: 25, descriptions: ['Notebook and pen', 'Course materials', 'Library fee'] },
  { category: 'Bills & Utilities', base: 760, step: 35, descriptions: ['Mobile data', 'Internet bill', 'Phone airtime'] },
  { category: 'Entertainment', base: 320, step: 30, descriptions: ['Movie ticket', 'Music subscription', 'Weekend game'] },
  { category: 'Shopping', base: 480, step: 20, descriptions: ['Clothes shopping', 'School bag', 'Phone case'] },
];

const makeDate = (monthsAgo, day) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(day);
  date.setHours(12, 0, 0, 0);
  return date;
};

const jitter = (amount, index) => Math.max(1, Math.round(amount + ((index % 3) - 1) * 35));

const seed = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for demo seed');

  const existingUsers = await User.find({
    $or: [
      { email: DEMO_USER.email },
      { email: 'demo@student.com' },
      { username: DEMO_USER.username },
    ],
  });
  if (existingUsers.length) {
    await Transaction.deleteMany({ user: { $in: existingUsers.map((u) => u._id) } });
    await User.deleteMany({ _id: { $in: existingUsers.map((u) => u._id) } });
    console.log('Removed existing demo user(s) and demo transactions');
  }

  const user = await User.create(DEMO_USER);
  const transactions = [];

  for (let i = 0; i < 6; i += 1) {
    const monthsAgo = 5 - i;
    const income = incomeByMonth[i];

    transactions.push({
      user: user._id,
      type: 'income',
      amount: income,
      category: 'Allowance',
      description: 'Monthly family allowance',
      date: makeDate(monthsAgo, 1),
      isRecurring: true,
      recurringInterval: 'monthly',
    });

    expensePattern.forEach((item, itemIndex) => {
      const amount = jitter(item.base + item.step * i, itemIndex + i);
      const description = item.descriptions[(itemIndex + i) % item.descriptions.length];
      transactions.push({
        user: user._id,
        type: 'expense',
        amount,
        category: item.category,
        description,
        date: makeDate(monthsAgo, 5 + itemIndex * 3),
        tags: [item.category.toLowerCase().replace(/\s+/g, '-')],
      });
    });

    transactions.push({
      user: user._id,
      type: 'expense',
      amount: jitter(250 + 20 * i, i),
      category: 'Savings',
      description: 'Saved money for future goal',
      date: makeDate(monthsAgo, 27),
      tags: ['saving'],
    });
  }

  await Transaction.insertMany(transactions);

  console.log('Demo user created successfully');
  console.log('Email:    demo@gmail.com');
  console.log('Password: Demo@1234');
  console.log('PIN:      1234');
  console.log(`Transactions inserted: ${transactions.length}`);
  console.log('Open the app, log in with this user, and the Home forecast card will have 6 months of history.');

  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error('Demo seed failed:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
