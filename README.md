# Pocket Money Tracker

A full-stack mobile application for tracking personal finances, built with **React Native** (frontend) and **Node.js/Express** (backend) with **MongoDB** for data persistence.

## Architecture

```
pocket-money/
├── backend/          # Node.js + Express REST API
│   └── src/
│       ├── config/       # Database configuration
│       ├── controllers/  # Route handlers
│       ├── middleware/    # Auth & error middleware
│       ├── models/       # Mongoose schemas
│       ├── routes/       # API route definitions
│       ├── utils/        # Categorizer & alert engine
│       └── __tests__/    # Unit tests
├── frontend/         # React Native (Expo) mobile app
│   └── src/
│       ├── constants/    # Theme & category config
│       ├── context/      # Auth context provider
│       ├── navigation/   # App navigator (tabs + stacks)
│       ├── screens/      # All UI screens
│       └── services/     # Axios API client
└── README.md
```

## Features

- **Authentication**: Register/login with email+password or 4-digit PIN, JWT token-based sessions
- **Transaction Management**: Full CRUD for income & expense records with structured attributes
- **Auto-Categorization**: Rule-based keyword matching maps descriptions to predefined categories
- **Budget Management**: Set daily/weekly/monthly budgets per category with real-time tracking
- **Financial Reports**: Aggregated reports (daily, weekly, monthly) with category breakdowns
- **Alerts & Notifications**: Threshold-based alerts (80% budget warning, budget exceeded, inactivity detection)
- **Dashboard**: Overview of balance, recent transactions, and quick-action buttons

## Tech Stack

| Layer     | Technology                                   |
|-----------|----------------------------------------------|
| Frontend  | React Native, Expo, React Navigation, Axios  |
| Backend   | Node.js, Express, Mongoose, JWT, bcryptjs    |
| Database  | MongoDB                                      |
| Testing   | Jest, Supertest                               |

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

```bash
cd backend
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

The API server starts at `http://localhost:5000`.

### Frontend Setup

```bash
cd frontend
npm install
npx expo start
```

Scan the QR code with Expo Go or run on an emulator.

### API Endpoints

| Method | Endpoint                       | Description                    |
|--------|--------------------------------|--------------------------------|
| POST   | /api/auth/register             | Register new user              |
| POST   | /api/auth/login                | Login with email/password      |
| POST   | /api/auth/login-pin            | Login with email/PIN           |
| GET    | /api/auth/me                   | Get user profile               |
| PUT    | /api/auth/me                   | Update user profile            |
| GET    | /api/transactions              | List transactions (filtered)   |
| POST   | /api/transactions              | Create transaction             |
| GET    | /api/transactions/:id          | Get single transaction         |
| PUT    | /api/transactions/:id          | Update transaction             |
| DELETE | /api/transactions/:id          | Delete transaction             |
| GET    | /api/transactions/suggest-category | Auto-categorize description |
| GET    | /api/budgets                   | List budgets                   |
| POST   | /api/budgets                   | Create budget                  |
| PUT    | /api/budgets/:id               | Update budget                  |
| DELETE | /api/budgets/:id               | Delete budget                  |
| POST   | /api/budgets/reset             | Recalculate budget spent       |
| GET    | /api/reports/summary           | Financial summary              |
| GET    | /api/reports/daily             | Daily report                   |
| GET    | /api/reports/weekly            | Weekly report                  |
| GET    | /api/reports/monthly           | Monthly report                 |
| GET    | /api/reports/by-category       | Spending by category           |
| GET    | /api/alerts                    | List alerts                    |
| PUT    | /api/alerts/:id/read           | Mark alert as read             |
| PUT    | /api/alerts/read-all           | Mark all alerts as read        |
| DELETE | /api/alerts/:id                | Delete alert                   |

### Running Tests

```bash
cd backend
npm test
```

## Auto-Categorization

The system uses rule-based keyword matching to auto-assign categories. For example:
- "lunch at cafe" → Food & Drinks
- "bus fare" → Transport
- "weekly allowance" → Allowance
- "netflix subscription" → Entertainment

If no match is found, it defaults to "Other Expense" or "Other Income".

## Budget Alerts

- **Warning**: Triggered when spending reaches 80% of a budget limit
- **Exceeded**: Triggered when spending exceeds the budget limit
- **Inactivity**: Triggered after 7 days with no recorded transactions
