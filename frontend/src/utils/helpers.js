import { format, formatDistanceToNow } from 'date-fns';

// Format currency
export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

// Format large numbers
export const formatNumber = (number) => {
  if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  }
  if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  }
  return number.toString();
};

// Format date
export const formatDate = (date, formatString = 'dd MMM yyyy') => {
  return format(new Date(date), formatString);
};

// Get relative time
export const getRelativeTime = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

// Calculate percentage change
export const calculatePercentageChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

// Format percentage
export const formatPercentage = (value, decimals = 2) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};

// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  return {
    isValid:
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumbers &&
      hasSpecialChar,
    errors: {
      length: password.length < minLength,
      upperCase: !hasUpperCase,
      lowerCase: !hasLowerCase,
      number: !hasNumbers,
      specialChar: !hasSpecialChar,
    },
  };
};

// Generate error message for password validation
export const getPasswordStrengthMessage = (errors) => {
  const messages = [];
  if (errors.length) messages.push('At least 8 characters');
  if (errors.upperCase) messages.push('One uppercase letter');
  if (errors.lowerCase) messages.push('One lowercase letter');
  if (errors.number) messages.push('One number');
  if (errors.specialChar) messages.push('One special character');
  return messages;
};

// Format match time
export const formatMatchTime = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;

  if (!end) {
    return format(start, 'dd MMM yyyy, hh:mm a');
  }

  if (start.toDateString() === end.toDateString()) {
    return `${format(start, 'dd MMM yyyy')}, ${format(start, 'hh:mm a')} - ${format(
      end,
      'hh:mm a'
    )}`;
  }

  return `${format(start, 'dd MMM yyyy, hh:mm a')} - ${format(
    end,
    'dd MMM yyyy, hh:mm a'
  )}`;
};

// Calculate match duration
export const calculateMatchDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : new Date();
  const durationInMinutes = Math.floor((end - start) / (1000 * 60));

  if (durationInMinutes < 60) {
    return `${durationInMinutes}m`;
  }

  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  return `${hours}h ${minutes}m`;
};

// Format player statistics
export const formatPlayerStats = (stats) => {
  return {
    matches: formatNumber(stats.matches.total),
    battingAverage: stats.batting.average.toFixed(2),
    strikeRate: stats.batting.strikeRate.toFixed(2),
    wickets: stats.bowling.wickets,
    bowlingAverage: stats.bowling.average.toFixed(2),
    economy: stats.bowling.economy.toFixed(2),
  };
};

// Calculate stock metrics
export const calculateStockMetrics = (priceHistory) => {
  if (!priceHistory?.length) return null;

  const prices = priceHistory.map((item) => item.price);
  const volumes = priceHistory.map((item) => item.volume);

  return {
    high: Math.max(...prices),
    low: Math.min(...prices),
    avgPrice: (prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2),
    totalVolume: volumes.reduce((a, b) => a + b, 0),
    volatility: calculateVolatility(prices),
  };
};

// Calculate price volatility
export const calculateVolatility = (prices) => {
  if (prices.length < 2) return 0;

  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (returns.length - 1);
  return Math.sqrt(variance * 252) * 100; // Annualized volatility
};

// Generate chart data
export const generateChartData = (data, type = 'price') => {
  return data.map((item) => ({
    x: new Date(item.timestamp),
    y: type === 'price' ? item.price : item.volume,
  }));
};

// Format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Generate random color
export const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};
