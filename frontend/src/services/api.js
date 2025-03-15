import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

const BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // If token refresh fails, logout user
      store.dispatch(logout());
      return Promise.reject(error);
    }

    // Handle other errors
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth endpoints
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: (token) => `/auth/reset-password/${token}`,
    logout: '/auth/logout',
    me: '/auth/me',
  },

  // Match endpoints
  matches: {
    all: '/matches',
    upcoming: '/matches/upcoming',
    live: '/matches/live',
    completed: '/matches/completed',
    details: (id) => `/matches/${id}`,
  },

  // Player endpoints
  players: {
    all: '/players',
    trending: '/players/trending',
    details: (id) => `/players/${id}`,
    performance: (id) => `/players/${id}/performance`,
    buy: (id) => `/players/${id}/buy`,
    sell: (id) => `/players/${id}/sell`,
    ownership: (id) => `/players/${id}/ownership`,
  },

  // Wallet endpoints
  wallet: {
    details: '/wallet',
    deposit: '/wallet/deposit',
    withdraw: '/wallet/withdraw',
    transactions: '/wallet/transactions',
    transactionDetails: (id) => `/wallet/transactions/${id}`,
  },

  // User endpoints
  users: {
    profile: '/users/profile',
    kyc: '/users/kyc',
    referral: '/users/referral',
    settings: '/users/settings',
  },
};

// API methods
const apiMethods = {
  // Generic methods
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // File upload method
  upload: async (url, formData, onProgress = () => {}) => {
    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default {
  ...apiMethods,
  endpoints,
};
