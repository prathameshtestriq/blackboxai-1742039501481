// App Constants
export const APP_NAME = 'Cricket Stock Trading';
export const APP_VERSION = '1.0.0';

// API Status Codes
export const STATUS_CODES = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// Match Status
export const MATCH_STATUS = {
  UPCOMING: 'upcoming',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
};

// Match Format
export const MATCH_FORMAT = {
  T20: 'T20',
  ODI: 'ODI',
  TEST: 'Test',
  T10: 'T10',
};

// Player Roles
export const PLAYER_ROLES = {
  BATSMAN: 'batsman',
  BOWLER: 'bowler',
  ALL_ROUNDER: 'all-rounder',
  WICKET_KEEPER: 'wicket-keeper',
};

// Player Status
export const PLAYER_STATUS = {
  ACTIVE: 'active',
  INJURED: 'injured',
  RETIRED: 'retired',
  SUSPENDED: 'suspended',
};

// Transaction Types
export const TRANSACTION_TYPES = {
  WALLET_DEPOSIT: 'wallet_deposit',
  WALLET_WITHDRAWAL: 'wallet_withdrawal',
  STOCK_PURCHASE: 'stock_purchase',
  STOCK_SALE: 'stock_sale',
  REFERRAL_BONUS: 'referral_bonus',
  SYSTEM_CREDIT: 'system_credit',
  SYSTEM_DEBIT: 'system_debit',
};

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  NET_BANKING: 'net_banking',
  UPI: 'upi',
  WALLET: 'wallet',
};

// KYC Status
export const KYC_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
};

// User Status
export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
};

// Chart Periods
export const CHART_PERIODS = {
  DAY: '1D',
  WEEK: '1W',
  MONTH: '1M',
  THREE_MONTHS: '3M',
  SIX_MONTHS: '6M',
  YEAR: '1Y',
  ALL: 'ALL',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  TRANSACTION: 'transaction',
  MATCH: 'match',
  PLAYER: 'player',
  SYSTEM: 'system',
  KYC: 'kyc',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  KYC_REQUIRED: 'KYC verification required to access this feature.',
  INSUFFICIENT_BALANCE: 'Insufficient wallet balance.',
  INSUFFICIENT_STOCKS: 'Insufficient stocks available.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Login successful.',
  REGISTER: 'Registration successful.',
  PROFILE_UPDATE: 'Profile updated successfully.',
  KYC_SUBMIT: 'KYC documents submitted successfully.',
  STOCK_PURCHASE: 'Stock purchased successfully.',
  STOCK_SALE: 'Stock sold successfully.',
  MONEY_ADDED: 'Money added to wallet successfully.',
  MONEY_WITHDRAWN: 'Money withdrawn successfully.',
  REFERRAL_APPLIED: 'Referral code applied successfully.',
};

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  PHONE_REGEX: /^\+?[1-9]\d{9,14}$/,
};

// File Upload
export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg'],
  ALLOWED_DOC_TYPES: ['application/pdf'],
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 50,
};

// Time Intervals
export const INTERVALS = {
  AUTO_REFRESH: 30000, // 30 seconds
  PRICE_UPDATE: 5000, // 5 seconds
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications',
};

// Routes
export const ROUTES = {
  HOME: 'Home',
  LOGIN: 'Login',
  REGISTER: 'Register',
  FORGOT_PASSWORD: 'ForgotPassword',
  MATCHES: 'Matches',
  PLAYERS: 'Players',
  WALLET: 'Wallet',
  PROFILE: 'Profile',
  SETTINGS: 'Settings',
  KYC: 'KYC',
  REFERRAL: 'Referral',
};

// Theme
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Languages
export const LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
};

// Countries
export const COUNTRIES = {
  INDIA: 'IN',
  USA: 'US',
  UK: 'GB',
  // Add more as needed
};
