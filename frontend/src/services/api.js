import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator (stable)
// For physical device: 'http://YOUR_IP:5000/api'
// For iOS simulator: 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ============ AUTH ============
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  loginWithPin: (data) => api.post('/auth/login-pin', data),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// ============ TRANSACTIONS ============
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  suggestCategory: (params) => api.get('/transactions/suggest-category', { params }),
};

// ============ BUDGETS ============
export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getOne: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
  reset: () => api.post('/budgets/reset'),
};

// ============ REPORTS ============
export const reportAPI = {
  getSummary: (params) => api.get('/reports/summary', { params }),
  getDaily: (params) => api.get('/reports/daily', { params }),
  getWeekly: (params) => api.get('/reports/weekly', { params }),
  getMonthly: (params) => api.get('/reports/monthly', { params }),
  getByCategory: (params) => api.get('/reports/by-category', { params }),
};

// ============ ALERTS ============
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  markAsRead: (id) => api.put(`/alerts/${id}/read`),
  markAllAsRead: () => api.put('/alerts/read-all'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// ============ CHAT / AI ============
export const chatAPI = {
  send: (message, history = []) => api.post('/chat', { message, history }),
};

// ============ GOALS ============
export const goalAPI = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
  contribute: (id, amount) => api.post(`/goals/${id}/contribute`, { amount }),
};

export default api;
