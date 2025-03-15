import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchWalletDetails = createAsyncThunk(
  'wallet/fetchDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wallet');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const addMoney = createAsyncThunk(
  'wallet/addMoney',
  async ({ amount, paymentMethod, paymentDetails }, { rejectWithValue }) => {
    try {
      const response = await api.post('/wallet/deposit', {
        amount,
        paymentMethod,
        paymentDetails,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const withdrawMoney = createAsyncThunk(
  'wallet/withdrawMoney',
  async ({ amount, bankDetails }, { rejectWithValue }) => {
    try {
      const response = await api.post('/wallet/withdraw', {
        amount,
        bankDetails,
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchTransactionHistory = createAsyncThunk(
  'wallet/fetchTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/wallet/transactions', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchTransactionDetails = createAsyncThunk(
  'wallet/fetchTransactionDetails',
  async (transactionId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/wallet/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  balance: 0,
  transactions: {
    data: [],
    pagination: null,
    isLoading: false,
    error: null,
  },
  selectedTransaction: {
    data: null,
    isLoading: false,
    error: null,
  },
  stats: null,
  operation: {
    isProcessing: false,
    error: null,
    lastOperation: null,
  },
  filters: {
    type: null,
    status: null,
    startDate: null,
    endDate: null,
  },
};

// Slice
const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearWalletErrors: (state) => {
      state.transactions.error = null;
      state.selectedTransaction.error = null;
      state.operation.error = null;
    },
    updateBalance: (state, action) => {
      state.balance = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Wallet Details
      .addCase(fetchWalletDetails.pending, (state) => {
        state.transactions.isLoading = true;
        state.transactions.error = null;
      })
      .addCase(fetchWalletDetails.fulfilled, (state, action) => {
        state.transactions.isLoading = false;
        state.balance = action.payload.data.balance;
        state.transactions.data = action.payload.data.transactions;
        state.stats = action.payload.data.stats;
      })
      .addCase(fetchWalletDetails.rejected, (state, action) => {
        state.transactions.isLoading = false;
        state.transactions.error = action.payload?.message || 'Failed to fetch wallet details';
      })

      // Add Money
      .addCase(addMoney.pending, (state) => {
        state.operation.isProcessing = true;
        state.operation.error = null;
      })
      .addCase(addMoney.fulfilled, (state, action) => {
        state.operation.isProcessing = false;
        state.balance = action.payload.data.newBalance;
        state.operation.lastOperation = action.payload.data.transaction;
        // Add to transactions list if exists
        if (state.transactions.data.length) {
          state.transactions.data.unshift(action.payload.data.transaction);
        }
      })
      .addCase(addMoney.rejected, (state, action) => {
        state.operation.isProcessing = false;
        state.operation.error = action.payload?.message || 'Failed to add money';
      })

      // Withdraw Money
      .addCase(withdrawMoney.pending, (state) => {
        state.operation.isProcessing = true;
        state.operation.error = null;
      })
      .addCase(withdrawMoney.fulfilled, (state, action) => {
        state.operation.isProcessing = false;
        state.balance = action.payload.data.newBalance;
        state.operation.lastOperation = action.payload.data.transaction;
        // Add to transactions list if exists
        if (state.transactions.data.length) {
          state.transactions.data.unshift(action.payload.data.transaction);
        }
      })
      .addCase(withdrawMoney.rejected, (state, action) => {
        state.operation.isProcessing = false;
        state.operation.error = action.payload?.message || 'Failed to withdraw money';
      })

      // Fetch Transaction History
      .addCase(fetchTransactionHistory.pending, (state) => {
        state.transactions.isLoading = true;
        state.transactions.error = null;
      })
      .addCase(fetchTransactionHistory.fulfilled, (state, action) => {
        state.transactions.isLoading = false;
        state.transactions.data = action.payload.data;
        state.transactions.pagination = action.payload.pagination;
      })
      .addCase(fetchTransactionHistory.rejected, (state, action) => {
        state.transactions.isLoading = false;
        state.transactions.error = action.payload?.message || 'Failed to fetch transactions';
      })

      // Fetch Transaction Details
      .addCase(fetchTransactionDetails.pending, (state) => {
        state.selectedTransaction.isLoading = true;
        state.selectedTransaction.error = null;
      })
      .addCase(fetchTransactionDetails.fulfilled, (state, action) => {
        state.selectedTransaction.isLoading = false;
        state.selectedTransaction.data = action.payload.data;
      })
      .addCase(fetchTransactionDetails.rejected, (state, action) => {
        state.selectedTransaction.isLoading = false;
        state.selectedTransaction.error = action.payload?.message || 'Failed to fetch transaction details';
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearWalletErrors,
  updateBalance,
} = walletSlice.actions;

export default walletSlice.reducer;
