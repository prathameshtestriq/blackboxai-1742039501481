import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const fetchAllPlayers = createAsyncThunk(
  'players/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/players', { params });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchTrendingPlayers = createAsyncThunk(
  'players/fetchTrending',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/players/trending');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchPlayerDetails = createAsyncThunk(
  'players/fetchDetails',
  async (playerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/players/${playerId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchPlayerPerformance = createAsyncThunk(
  'players/fetchPerformance',
  async (playerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/players/${playerId}/performance`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const buyPlayerStock = createAsyncThunk(
  'players/buyStock',
  async ({ playerId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/players/${playerId}/buy`, { quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const sellPlayerStock = createAsyncThunk(
  'players/sellStock',
  async ({ playerId, quantity }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/players/${playerId}/sell`, { quantity });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchPlayerStockOwnership = createAsyncThunk(
  'players/fetchOwnership',
  async (playerId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/players/${playerId}/ownership`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

// Initial state
const initialState = {
  allPlayers: {
    data: [],
    pagination: null,
    isLoading: false,
    error: null,
  },
  trendingPlayers: {
    data: [],
    isLoading: false,
    error: null,
  },
  selectedPlayer: {
    data: null,
    performance: null,
    ownership: null,
    isLoading: false,
    error: null,
  },
  trading: {
    isProcessing: false,
    error: null,
    lastTransaction: null,
  },
  filters: {
    role: null,
    status: null,
    sort: '-stock.currentPrice',
  },
  watchlist: [],
};

// Slice
const playerSlice = createSlice({
  name: 'players',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    clearPlayerErrors: (state) => {
      state.allPlayers.error = null;
      state.trendingPlayers.error = null;
      state.selectedPlayer.error = null;
      state.trading.error = null;
    },
    updatePlayerStockPrice: (state, action) => {
      const { playerId, price, volume } = action.payload;
      // Update in all players list
      const playerIndex = state.allPlayers.data.findIndex(
        player => player._id === playerId
      );
      if (playerIndex !== -1) {
        state.allPlayers.data[playerIndex].stock.currentPrice = price;
        state.allPlayers.data[playerIndex].stock.availableVolume = volume;
      }
      // Update in trending players if present
      const trendingIndex = state.trendingPlayers.data.findIndex(
        player => player._id === playerId
      );
      if (trendingIndex !== -1) {
        state.trendingPlayers.data[trendingIndex].stock.currentPrice = price;
        state.trendingPlayers.data[trendingIndex].stock.availableVolume = volume;
      }
      // Update selected player if it's the same player
      if (state.selectedPlayer.data?._id === playerId) {
        state.selectedPlayer.data.stock.currentPrice = price;
        state.selectedPlayer.data.stock.availableVolume = volume;
      }
    },
    addToWatchlist: (state, action) => {
      if (!state.watchlist.includes(action.payload)) {
        state.watchlist.push(action.payload);
      }
    },
    removeFromWatchlist: (state, action) => {
      state.watchlist = state.watchlist.filter(id => id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Players
      .addCase(fetchAllPlayers.pending, (state) => {
        state.allPlayers.isLoading = true;
        state.allPlayers.error = null;
      })
      .addCase(fetchAllPlayers.fulfilled, (state, action) => {
        state.allPlayers.isLoading = false;
        state.allPlayers.data = action.payload.data;
        state.allPlayers.pagination = action.payload.pagination;
      })
      .addCase(fetchAllPlayers.rejected, (state, action) => {
        state.allPlayers.isLoading = false;
        state.allPlayers.error = action.payload?.message || 'Failed to fetch players';
      })

      // Fetch Trending Players
      .addCase(fetchTrendingPlayers.pending, (state) => {
        state.trendingPlayers.isLoading = true;
        state.trendingPlayers.error = null;
      })
      .addCase(fetchTrendingPlayers.fulfilled, (state, action) => {
        state.trendingPlayers.isLoading = false;
        state.trendingPlayers.data = action.payload.data;
      })
      .addCase(fetchTrendingPlayers.rejected, (state, action) => {
        state.trendingPlayers.isLoading = false;
        state.trendingPlayers.error = action.payload?.message || 'Failed to fetch trending players';
      })

      // Fetch Player Details
      .addCase(fetchPlayerDetails.pending, (state) => {
        state.selectedPlayer.isLoading = true;
        state.selectedPlayer.error = null;
      })
      .addCase(fetchPlayerDetails.fulfilled, (state, action) => {
        state.selectedPlayer.isLoading = false;
        state.selectedPlayer.data = action.payload.data;
      })
      .addCase(fetchPlayerDetails.rejected, (state, action) => {
        state.selectedPlayer.isLoading = false;
        state.selectedPlayer.error = action.payload?.message || 'Failed to fetch player details';
      })

      // Fetch Player Performance
      .addCase(fetchPlayerPerformance.pending, (state) => {
        state.selectedPlayer.isLoading = true;
      })
      .addCase(fetchPlayerPerformance.fulfilled, (state, action) => {
        state.selectedPlayer.isLoading = false;
        state.selectedPlayer.performance = action.payload.data;
      })
      .addCase(fetchPlayerPerformance.rejected, (state, action) => {
        state.selectedPlayer.isLoading = false;
        state.selectedPlayer.error = action.payload?.message || 'Failed to fetch player performance';
      })

      // Buy Player Stock
      .addCase(buyPlayerStock.pending, (state) => {
        state.trading.isProcessing = true;
        state.trading.error = null;
      })
      .addCase(buyPlayerStock.fulfilled, (state, action) => {
        state.trading.isProcessing = false;
        state.trading.lastTransaction = action.payload.data;
      })
      .addCase(buyPlayerStock.rejected, (state, action) => {
        state.trading.isProcessing = false;
        state.trading.error = action.payload?.message || 'Failed to buy stock';
      })

      // Sell Player Stock
      .addCase(sellPlayerStock.pending, (state) => {
        state.trading.isProcessing = true;
        state.trading.error = null;
      })
      .addCase(sellPlayerStock.fulfilled, (state, action) => {
        state.trading.isProcessing = false;
        state.trading.lastTransaction = action.payload.data;
      })
      .addCase(sellPlayerStock.rejected, (state, action) => {
        state.trading.isProcessing = false;
        state.trading.error = action.payload?.message || 'Failed to sell stock';
      })

      // Fetch Player Stock Ownership
      .addCase(fetchPlayerStockOwnership.pending, (state) => {
        state.selectedPlayer.isLoading = true;
      })
      .addCase(fetchPlayerStockOwnership.fulfilled, (state, action) => {
        state.selectedPlayer.isLoading = false;
        state.selectedPlayer.ownership = action.payload.data;
      })
      .addCase(fetchPlayerStockOwnership.rejected, (state, action) => {
        state.selectedPlayer.isLoading = false;
        state.selectedPlayer.error = action.payload?.message || 'Failed to fetch ownership details';
      });
  },
});

export const {
  setFilters,
  clearFilters,
  clearPlayerErrors,
  updatePlayerStockPrice,
  addToWatchlist,
  removeFromWatchlist,
} = playerSlice.actions;

export default playerSlice.reducer;
